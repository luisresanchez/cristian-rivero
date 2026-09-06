#!/usr/bin/env python3
"""
fetch_youtube_metrics.py — Actualiza métricas de YouTube en metrics.js
usando YouTube Data API v3 (gratuita).

Uso:
  YOUTUBE_API_KEY=<tu_key> python3 scripts/fetch_youtube_metrics.py
  python3 scripts/fetch_youtube_metrics.py --key <tu_key>
  python3 scripts/fetch_youtube_metrics.py --dry-run
"""
import os, re, sys, json, argparse, datetime, urllib.request, urllib.error

CHANNEL_ID = 'UCo1ZJX4yuQP-MAEbVzKhplQ'  # Canal de Cristian Rivero
METRICS_JS = os.path.join(os.path.dirname(__file__), '..', 'js', 'metrics.js')
LOG_FILE   = os.path.join(os.path.dirname(__file__), 'metrics_update.log')
YT_API     = 'https://www.googleapis.com/youtube/v3'

def api_get(url):
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'HTTP {e.code}: {e.read().decode()[:300]}')

def fmt(n, dec=1):
    n = float(n or 0)
    if n >= 1_000_000: return f'{n/1_000_000:.{dec}f}M'
    if n >= 1_000:     return f'{n/1_000:.{dec}f}K'
    return f'{n:,.0f}'

def log(msg):
    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    try:
        with open(LOG_FILE, 'a') as f: f.write(line + '\n')
    except: pass

def fetch_channel_stats(key):
    url = f'{YT_API}/channels?part=statistics&id={CHANNEL_ID}&key={key}'
    data = api_get(url)
    items = data.get('items', [])
    if not items:
        raise RuntimeError(f'Canal no encontrado: {CHANNEL_ID}')
    s = items[0]['statistics']
    return {
        'subs':   int(s.get('subscriberCount', 0)),
        'views':  int(s.get('viewCount', 0)),
    }

def fetch_recent_stats(key, days=90):
    start = (datetime.datetime.utcnow() - datetime.timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%SZ')
    url = (f'{YT_API}/search?part=id&channelId={CHANNEL_ID}'
           f'&type=video&publishedAfter={start}&maxResults=50&key={key}')
    data = api_get(url)
    video_ids = [i['id']['videoId'] for i in data.get('items', []) if 'videoId' in i.get('id', {})]
    if not video_ids:
        return {'period_views': 0, 'period_likes': 0, 'period_comments': 0}
    ids_str = ','.join(video_ids)
    data2 = api_get(f'{YT_API}/videos?part=statistics&id={ids_str}&key={key}')
    views = likes = comments = 0
    for item in data2.get('items', []):
        s = item.get('statistics', {})
        views    += int(s.get('viewCount', 0))
        likes    += int(s.get('likeCount', 0))
        comments += int(s.get('commentCount', 0))
    return {'period_views': views, 'period_likes': likes, 'period_comments': comments}

def update_metrics_js(metrics):
    with open(METRICS_JS, 'r', encoding='utf-8') as f:
        src = f.read()
    for key, val in metrics.items():
        pattern = rf"(  {re.escape(key)}:\s*')[^']*(')"
        src, n = re.subn(pattern, rf"\g<1>{val}\g<2>", src)
        if n == 0:
            print(f'  AVISO: clave {key!r} no encontrada en metrics.js')
    with open(METRICS_JS, 'w', encoding='utf-8') as f:
        f.write(src)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--key', help='YouTube API key (o env YOUTUBE_API_KEY)')
    parser.add_argument('--days', type=int, default=90)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    key = args.key or os.environ.get('YOUTUBE_API_KEY', '')
    if not key:
        print('ERROR: Se necesita YOUTUBE_API_KEY')
        print('Pásala con --key o como variable de entorno.')
        sys.exit(1)

    log('=== Iniciando fetch métricas YouTube ===')
    try:
        channel = fetch_channel_stats(key)
        recent  = fetch_recent_stats(key, args.days)

        daily_avg = round(recent['period_views'] / args.days) if recent['period_views'] else 0
        er = 0.0
        if recent['period_views']:
            er = (recent['period_likes'] + recent['period_comments']) / recent['period_views'] * 100

        metrics = {
            'yt_views':    fmt(channel['views']),
            'yt_subs':     fmt(channel['subs'], 0),
            'yt_90days':   fmt(recent['period_views']),
            'yt_daily':    fmt(daily_avg, 0),
            'hero_yt_stat': f'{fmt(channel["views"])} vistas',
        }

        print('\n── Métricas YouTube ──')
        for k, v in metrics.items():
            print(f'  {k}: {v}')
        print(f'  Engagement Rate: {er:.2f}%')

        if args.dry_run:
            print('\n[dry-run] metrics.js NO modificado.')
        else:
            update_metrics_js(metrics)
            log(f'OK — subs:{metrics["yt_subs"]} vistas:{metrics["yt_views"]} ER:{er:.2f}%')
            print('\nmetrics.js actualizado.')

    except RuntimeError as e:
        log(f'ERROR: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()

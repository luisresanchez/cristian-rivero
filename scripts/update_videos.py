#!/usr/bin/env python3
"""
update_videos.py — Actualiza los carruseles de video en index.html
Corre automáticamente cada viernes a las 9 AM via crontab.
Fuente: YouTube RSS (sin API key, sin costo).

Crontab: 0 9 * * 5 python3 /Users/luisre/Desktop/Web/cristian-rivero/scripts/update_videos.py
"""

import re
import urllib.request
from datetime import datetime

BASE = '/Users/luisre/Desktop/Web/cristian-rivero'
INDEX = f'{BASE}/index.html'

PLAYLISTS = {
    'podcast': {
        'id': 'PLTUqBkj7Q9eZmMRpJihI72SmOQnQo9DOn',
        'track_id': 'episodes-track',
        'card_class': 'episode-yt-card',
        'limit': 10,
        'reverse': False,  # RSS ya viene de más reciente a más antiguo
    },
    'metele': {
        'id': 'PLTUqBkj7Q9eZdE38lj4L77Hqo2KB4wzRb',
        'track_id': 'metele-track',
        'card_class': 'episode-yt-card episode-yt-card--gastro',
        'limit': 8,
        'reverse': True,   # RSS viene de más antiguo a más reciente
    },
}

MONTH_ES = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}


def fetch_rss(playlist_id):
    url = f'https://www.youtube.com/feeds/videos.xml?playlist_id={playlist_id}'
    with urllib.request.urlopen(url, timeout=15) as r:
        return r.read().decode('utf-8')


def parse_videos(xml, limit):
    ids     = re.findall(r'<yt:videoId>([^<]+)</yt:videoId>', xml)
    titles  = re.findall(r'<media:title>([^<]+)</media:title>', xml)
    dates   = re.findall(r'<published>([^<]+)</published>', xml)
    videos = list(zip(ids, titles, dates))
    return videos


def format_date(iso):
    # e.g. "2026-06-18T..."
    parts = iso[:10].split('-')
    if len(parts) == 3:
        return f'{MONTH_ES.get(parts[1], parts[1])} {parts[0]}'
    return iso[:7]


def clean_title(title):
    # Remove emoji sequences and excessive caps for display
    return title.strip()


def build_cards(videos, card_class):
    cards = []
    for vid_id, title, date in videos:
        label = format_date(date)
        title_clean = clean_title(title)
        link = f'https://www.youtube.com/watch?v={vid_id}'
        thumb = f'https://img.youtube.com/vi/{vid_id}/hqdefault.jpg'
        alt = title_clean[:40]
        cards.append(f'''          <a class="{card_class}" href="{link}" target="_blank" rel="noopener noreferrer">
            <div class="episode-yt-card__thumb">
              <img src="{thumb}" alt="{alt}" loading="lazy" />
              <span class="episode-yt-card__play" aria-hidden="true">▶</span>
            </div>
            <div class="episode-yt-card__body">
              <span class="episode-yt-card__date">{label}</span>
              <p class="episode-yt-card__title">{title_clean}</p>
            </div>
          </a>''')
    return '\n\n'.join(cards)


def update_track(html, track_id, new_cards):
    pattern = rf'(<div class="episodes-track" id="{track_id}">)(.*?)(</div>\n      </div>)'
    replacement = rf'\g<1>\n\n{new_cards}\n\n        \g<3>'
    updated, n = re.subn(pattern, replacement, html, flags=re.DOTALL)
    return updated, n > 0


def main():
    with open(INDEX, 'r', encoding='utf-8') as f:
        html = f.read()

    changed = False
    for name, cfg in PLAYLISTS.items():
        print(f'Fetching {name} playlist...')
        try:
            xml = fetch_rss(cfg['id'])
            videos = parse_videos(xml, cfg['limit'])
            if cfg.get('reverse'):
                videos = list(reversed(videos[-cfg['limit']:]))
            else:
                videos = videos[:cfg['limit']]
            cards = build_cards(videos, cfg['card_class'])
            html, ok = update_track(html, cfg['track_id'], cards)
            if ok:
                print(f'  ✓ {len(videos)} videos updated for {name}')
                changed = True
            else:
                print(f'  ✗ Track {cfg["track_id"]} not found in HTML')
        except Exception as e:
            print(f'  ✗ Error fetching {name}: {e}')

    if changed:
        with open(INDEX, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'\n✓ index.html updated — {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    else:
        print('\nNo changes made.')


if __name__ == '__main__':
    main()

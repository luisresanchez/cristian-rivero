const CHANNEL_ID = 'UCo1ZJX4yuQP-MAEbVzKhplQ';
const YT = 'https://www.googleapis.com/youtube/v3';

function fmt(n, dec = 1) {
  n = parseFloat(n || 0);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(dec) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(dec) + 'K';
  return n.toLocaleString('es-PE');
}

export default async function handler(req, res) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY no configurada' });
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  try {
    // Estadísticas del canal
    const chRes = await fetch(
      `${YT}/channels?part=statistics&id=${CHANNEL_ID}&key=${key}`
    );
    const chData = await chRes.json();

    if (chData.error) {
      return res.status(502).json({ error: chData.error.message });
    }

    const s = chData.items?.[0]?.statistics ?? {};
    const totalViews = parseInt(s.viewCount || 0);
    const subs       = parseInt(s.subscriberCount || 0);

    // Últimos 90 días: buscar videos recientes
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const srRes = await fetch(
      `${YT}/search?part=id&channelId=${CHANNEL_ID}&type=video&publishedAfter=${since}&maxResults=50&key=${key}`
    );
    const srData = await srRes.json();
    const ids = (srData.items || [])
      .map(i => i.id?.videoId)
      .filter(Boolean)
      .join(',');

    let periodViews = 0;
    let periodLikes = 0;
    let periodComments = 0;

    if (ids) {
      const vRes = await fetch(
        `${YT}/videos?part=statistics&id=${ids}&key=${key}`
      );
      const vData = await vRes.json();
      for (const item of vData.items || []) {
        const vs = item.statistics || {};
        periodViews    += parseInt(vs.viewCount    || 0);
        periodLikes    += parseInt(vs.likeCount    || 0);
        periodComments += parseInt(vs.commentCount || 0);
      }
    }

    const dailyAvg = Math.round(periodViews / 90);

    res.status(200).json({
      yt_views:     fmt(totalViews),
      yt_subs:      fmt(subs, 0),
      yt_90days:    fmt(periodViews),
      yt_daily:     fmt(dailyAvg, 0),
      hero_yt_stat: `${fmt(totalViews)} vistas`,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

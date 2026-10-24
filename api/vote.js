const crypto = require('crypto');
const polls = require('../polls.json');

const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(cmds) {
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('redis');
  return (await r.json()).map(x => x.result);
}

// صوت واحد لكل شخص: نخزن بصمة مشفرة من الـ IP (ما نحفظ الـ IP نفسه)
function voter(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || '0';
  return crypto.createHash('sha256').update(ip + (process.env.VOTE_SALT || 'elite-state')).digest('hex').slice(0, 24);
}

async function snapshot(p, who) {
  const [flat, mine] = await redis([['HGETALL', `votes:${p.id}`], ['GET', `voted:${p.id}:${who}`]]);
  const raw = {};
  for (let i = 0; i < (flat || []).length; i += 2) raw[flat[i]] = +flat[i + 1];
  const counts = {};
  p.options.forEach(o => (counts[o.id] = raw[o.id] || 0));
  return { id: p.id, counts, mine: mine || null };
}

const isClosed = p => p.closed || (p.endsAt && Date.now() > Date.parse(p.endsAt));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'no_db' });
  try {
    const who = voter(req);
    if (req.method === 'POST') {
      const { poll, option } = req.body || {};
      const p = polls.find(x => x.id === poll);
      if (!p || isClosed(p) || !p.options.some(o => o.id === option)) return res.status(400).json({ error: 'bad_vote' });
      // نسجل الصوت الجديد ونرجع الصوت القديم (لو موجود) عشان ننقل العدّ من خيار لخيار
      const key = `voted:${p.id}:${who}`;
      const [prev] = await redis([['GET', key]]);
      if (prev !== option) {
        await redis([['SET', key, option]]);
        const cmds = [['HINCRBY', `votes:${p.id}`, option, 1]];
        if (prev && p.options.some(o => o.id === prev)) cmds.push(['HINCRBY', `votes:${p.id}`, prev, -1]);
        await redis(cmds);
      }
      return res.json(await snapshot(p, who));
    }
    const out = [];
    for (const p of polls) out.push(await snapshot(p, who));
    res.json({ polls: polls.map(p => ({ ...p, closed: !!isClosed(p) })), results: out, now: Date.now(), v: 4 });
  } catch (e) {
    res.status(500).json({ error: 'server' });
  }
};

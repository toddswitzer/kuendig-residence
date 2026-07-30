import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'kuendig-state.json', limit: 1 });
      if (!blobs.length) return res.status(200).json(null);
      const r = await fetch(blobs[0].url + '?ts=' + Date.now());
      if (!r.ok) return res.status(200).json(null);
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      const parsed = JSON.parse(body);
      await put('kuendig-state.json', JSON.stringify(parsed), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0,
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

export const config = { api: { bodyParser: false } };

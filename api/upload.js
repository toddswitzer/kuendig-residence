import { put } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const filename = (req.query.filename || 'file.pdf').toString();
    const contentType = req.headers['content-type'] || 'application/octet-stream';

    const chunks = [];
    let total = 0;
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB per file
    for await (const chunk of req) {
      total += chunk.length;
      if (total > MAX_BYTES) {
        return res.status(413).json({ error: 'File too large — please keep uploads under 10MB.' });
      }
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = 'bids/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + safeName;

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
    });

    return res.status(200).json({ url: blob.url, fileName: filename, fileSizeKB: Math.round(buffer.length / 1024) });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

export const config = { api: { bodyParser: false } };

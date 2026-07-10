const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    const { contents, generationConfig, model } = await readJsonBody(req);
    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Missing Gemini contents payload.' });
    }

    const selectedModel = model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig,
        }),
      }
    );

    const responseText = await geminiResponse.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { error: responseText || 'Gemini returned an empty response.' };
    }

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json(responseBody);
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error('Gemini proxy request failed:', error);
    return res.status(500).json({ error: 'Gemini proxy request failed.' });
  }
}

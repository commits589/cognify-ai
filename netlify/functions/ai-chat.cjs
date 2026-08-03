// netlify/functions/ai-chat.js
//
// The ONE place the Gemini API key is ever used. The browser never sees it.
// Every request must carry a valid Firebase ID token (the frontend attaches
// it automatically once a user is signed in) — this function verifies that
// token with Firebase Admin before calling Gemini, and applies a per-user
// daily rate limit. Frontend calls this endpoint with { system, messages,
// maxTokens }; this function translates that into Gemini's request shape,
// calls Gemini with the server-held key, and returns { text }. If this
// function is unreachable or errors, the frontend surfaces a real error —
// it never fabricates a response.

const { verifyAuthHeader, checkAndBumpRateLimit } = require('./_firebaseAdmin.cjs');

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;



// Frontend sends "Anthropic-shaped" content blocks for attachments (this app was
// originally wired for Claude); translate them into Gemini's inlineData parts so the
// rest of the frontend code doesn't need to change.
function toGeminiParts(content) {
  if (typeof content === 'string') return [{ text: content }];
  if (!Array.isArray(content)) return [{ text: String(content ?? '') }];

  return content.map((block) => {
    if (block.type === 'text') return { text: block.text };
    if (block.type === 'image' && block.source?.type === 'base64') {
      return { inlineData: { mimeType: block.source.media_type, data: block.source.data } };
    }
    if (block.type === 'document' && block.source?.type === 'base64') {
      return { inlineData: { mimeType: block.source.media_type || 'application/pdf', data: block.source.data } };
    }
    return { text: '' };
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server is missing GEMINI_API_KEY. Set it in your Netlify site\'s environment variables — see README.md.' }),
    };
  }

  // --- Auth: require a valid, signed-in Firebase user ---
  let decodedToken;
  try {
    decodedToken = await verifyAuthHeader(event.headers || {});
  } catch (err) {
    return { statusCode: err.statusCode || 401, body: JSON.stringify({ error: err.message }) };
  }

  // --- Rate limit: per-user daily cap, tracked in Firestore ---
  try {
    await checkAndBumpRateLimit(decodedToken.uid, { limitPerDay: 2000 });
  } catch (err) {
    return { statusCode: err.statusCode || 429, body: JSON.stringify({ error: err.message }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { system, messages, maxTokens } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'messages is required' }) };
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: toGeminiParts(m.content),
  }));

  try {
    const res =
await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: Math.min(Math.max(maxTokens || 1024, 1), 8192),
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: `Gemini API error: ${errText}` }) };
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ??
      '';

    if (!text) {
      // A real (if unhelpful) situation — e.g. the response was blocked by safety
      // filters. Surface that honestly rather than returning empty/fabricated text.
      const blockReason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason;
      return {
        statusCode: 502,
        body: JSON.stringify({ error: blockReason ? `Gemini did not return content (${blockReason}).` : 'Gemini returned an empty response.' }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ text }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: `Could not reach Gemini: ${err.message}` }) };
  }
};

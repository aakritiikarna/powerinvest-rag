// The ONLY file that talks to the Gemini API (embeddings + text generation).
// The API key is read from the environment on the server and sent in a request header.
// It is never logged, never returned to the browser, and never put in a URL.
import { getConfig } from '../config.js';
import { AppError } from './errors.js';

const BATCH_SIZE = 50; // chunks embedded per API request while building the index

// Shared helper: POST JSON to Gemini and translate every kind of failure into an AppError
// with a clear message and a stable error code.
async function callGemini(endpoint, body) {
  const config = getConfig();
  if (!config.apiKey) {
    throw new AppError(
      503,
      'MISSING_API_KEY',
      'The AI assistant is not configured. Set GEMINI_API_KEY in the .env file and restart the server.'
    );
  }

  let response;
  try {
    response = await fetch(`${config.apiBaseUrl}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.requestTimeoutMs)
    });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw new AppError(
      502,
      'LLM_UNREACHABLE',
      timedOut ? 'The Gemini API took too long to respond. Please try again.' : 'Could not reach the Gemini API. Check your internet connection and try again.'
    );
  }

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const providerMessage = details?.error?.message || '';
    if (response.status === 401 || response.status === 403 || /api key/i.test(providerMessage)) {
      throw new AppError(502, 'LLM_AUTH_ERROR', 'Gemini rejected the API key. Check that GEMINI_API_KEY is valid and has access to the Gemini API.');
    }
    if (response.status === 429) {
      throw new AppError(429, 'LLM_RATE_LIMITED', 'The Gemini API rate limit or quota was reached. Please wait a moment and try again.');
    }
    throw new AppError(502, 'LLM_API_ERROR', `The Gemini API returned an error (HTTP ${response.status}).${providerMessage ? ` ${providerMessage}` : ''}`);
  }

  return response.json().catch(() => {
    throw new AppError(502, 'LLM_API_ERROR', 'The Gemini API returned a response that could not be read.');
  });
}

// Scale a vector to length 1. After this, cosine similarity is just a dot product.
function normalize(vector) {
  const length = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return length === 0 ? vector : vector.map((value) => value / length);
}

// RAG step 3 - EMBED: turn texts into vectors (lists of numbers) that capture meaning.
// Texts with similar meaning end up with vectors that point in similar directions.
// The same model must be used for the chunks and for the user's question.
export async function embedTexts(texts) {
  const { embeddingModel } = getConfig();
  const vectors = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const data = await callGemini(`models/${embeddingModel}:batchEmbedContents`, {
      requests: batch.map((text) => ({ model: `models/${embeddingModel}`, content: { parts: [{ text }] } }))
    });

    const embeddings = data?.embeddings;
    if (!Array.isArray(embeddings) || embeddings.length !== batch.length || embeddings.some((item) => !Array.isArray(item?.values) || item.values.length === 0)) {
      throw new AppError(502, 'EMPTY_RESPONSE', 'The Gemini embedding API returned no usable embeddings.');
    }
    vectors.push(...embeddings.map((item) => normalize(item.values)));
  }
  return vectors;
}

// RAG step 6 - GENERATE: ask the LLM to answer using the prompt we built from retrieved chunks.
export async function generateText({ systemPrompt, userPrompt }) {
  const { chatModel } = getConfig();
  const data = await callGemini(`models/${chatModel}:generateContent`, {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    // Low temperature = more factual, less creative. Plenty of room for the answer.
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
  });

  if (data?.promptFeedback?.blockReason) {
    throw new AppError(502, 'LLM_BLOCKED', 'Gemini declined to answer this question. Try rephrasing it.');
  }

  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((part) => part?.text || '').join('').trim() : '';
  if (!text) {
    throw new AppError(502, 'EMPTY_RESPONSE', 'Gemini returned an empty answer. Please try again.');
  }
  return text;
}

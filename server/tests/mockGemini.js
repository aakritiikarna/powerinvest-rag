// TEST TOOLING ONLY - a tiny local stand-in for the Gemini REST API.
//
// It lets the automated tests (and a manual end-to-end run) exercise the REAL backend code -
// chunking, index building, retrieval, prompt building, HTTP calls, error handling - without a
// network connection or an API key. It is NOT used by the app itself: the app only talks to
// this mock when GEMINI_API_BASE_URL points at it.
//
// * "Embeddings" here are hashed bag-of-words vectors (keyword overlap), NOT real semantic embeddings.
// * "LLM answers" are prefixed with [MOCK LLM] so they can never be mistaken for real model output.
//
// Run standalone for a manual test:  node server/tests/mockGemini.js   (optional: MOCK_MODE=http500|http403|http429|empty|insufficient)
import http from 'node:http';

const STOPWORDS = new Set('the and for are but not you all can had her was one our out has have what how does why who which with that this from your about into than then they them their there when where will would should could between before after during each other such more most some any'.split(' '));
const DIMENSIONS = 1024;

function hashToken(token) {
  let hash = 0;
  for (const character of token) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % DIMENSIONS;
}

function fakeEmbedding(text) {
  const vector = new Array(DIMENSIONS).fill(0);
  for (const token of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (token.length >= 3 && !STOPWORDS.has(token)) vector[hashToken(token)] += 1;
  }
  return vector;
}

export function startMockGemini(port = 0) {
  // `state` lets a test choose how the next requests behave and inspect what was received.
  const state = { mode: 'ok', embedRequests: [], generateRequests: [], embeddedTextCount: 0 };

  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (piece) => (raw += piece));
    req.on('end', () => {
      const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
      const body = raw ? JSON.parse(raw) : {};
      const record = { url: req.url, headers: req.headers, body };

      if (state.mode === 'http500') return send(500, { error: { message: 'Internal error' } });
      if (state.mode === 'http403') return send(403, { error: { message: 'Permission denied' } });
      if (state.mode === 'badkey400') return send(400, { error: { message: 'API key not valid. Please pass a valid API key.' } });
      if (state.mode === 'http429') return send(429, { error: { message: 'Quota exceeded' } });
      if (state.mode === 'notjson') { res.writeHead(200); return res.end('<html>oops</html>'); }

      if (req.url.includes(':batchEmbedContents')) {
        state.embedRequests.push(record);
        state.embeddedTextCount += body.requests.length;
        return send(200, { embeddings: body.requests.map((item) => ({ values: fakeEmbedding(item.content.parts[0].text) })) });
      }

      if (req.url.includes(':generateContent')) {
        state.generateRequests.push(record);
        if (state.mode === 'empty') return send(200, { candidates: [] });
        if (state.mode === 'blocked') return send(200, { promptFeedback: { blockReason: 'SAFETY' } });
        if (state.mode === 'insufficient') return send(200, { candidates: [{ content: { parts: [{ text: 'INSUFFICIENT_CONTEXT' }] } }] });

        // Build a deterministic "answer" from the first context passage that was sent.
        const prompt = body.contents[0].parts[0].text;
        const firstPassage = prompt.match(/\[1\] Source: [^\n]*\n([^\n]*)/)?.[1] || '';
        const firstSentence = firstPassage.split(/(?<=[.!?])\s+/)[0];
        return send(200, { candidates: [{ content: { parts: [{ text: `[MOCK LLM] ${firstSentence} [1]` }] } }] });
      }

      send(404, { error: { message: 'unknown mock route' } });
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: actualPort } = server.address();
      resolve({
        server,
        state,
        url: `http://127.0.0.1:${actualPort}/v1beta`,
        close: () => new Promise((done) => server.close(done)),
        reset: () => { state.mode = 'ok'; state.embedRequests.length = 0; state.generateRequests.length = 0; state.embeddedTextCount = 0; }
      });
    });
  });
}

// Standalone mode: `node server/tests/mockGemini.js` -> http://127.0.0.1:8799/v1beta
if (import.meta.url === `file://${process.argv[1]}`) {
  const mock = await startMockGemini(8799);
  if (process.env.MOCK_MODE) mock.state.mode = process.env.MOCK_MODE; // e.g. MOCK_MODE=http500
  console.log(`Mock Gemini API (TEST TOOL, not real) listening on ${mock.url}`);
}

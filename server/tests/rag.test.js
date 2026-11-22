// Run with: npm test
// Uses Node's built-in test runner (no extra dependencies) and the local Gemini stub.
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../app.js';
import { chunkDocument, splitBySentences, splitIntoSections } from '../rag/chunker.js';
import { clearIndexCache, cosineSimilarity, search } from '../rag/vectorStore.js';
import { startMockGemini } from './mockGemini.js';

// ---------- Chunking ----------

describe('chunker', () => {
  it('splits a document at "##" headings and drops the "#" title', () => {
    const sections = splitIntoSections('# Title\n\n## First\nAlpha text.\n\n## Second\nBeta text.');
    assert.deepEqual(sections.map((s) => s.heading), ['First', 'Second']);
    assert.equal(sections[0].body, 'Alpha text.');
  });

  it('keeps a short section as a single chunk', () => {
    assert.deepEqual(splitBySentences('One short sentence.', 500), ['One short sentence.']);
  });

  it('splits a long section into pieces under the limit, with one sentence of overlap', () => {
    const sentences = Array.from({ length: 10 }, (_, i) => `This is sentence number ${i + 1} about investing.`);
    const pieces = splitBySentences(sentences.join(' '), 150);
    assert.ok(pieces.length > 1);
    assert.ok(pieces.every((piece) => piece.length <= 150));
    for (let i = 1; i < pieces.length; i++) {
      const lastSentenceOfPrevious = pieces[i - 1].split(/(?<=[.!?])\s+/).at(-1);
      assert.ok(pieces[i].startsWith(lastSentenceOfPrevious), 'next chunk should start with the previous last sentence');
    }
    assert.ok(sentences.every((sentence) => pieces.some((piece) => piece.includes(sentence))), 'no sentence may be lost');
  });

  it('attaches source metadata to every chunk', () => {
    const chunks = chunkDocument({ id: 'doc', title: 'Doc Title', text: '# Doc Title\n\n## Part A\nSome text here.' }, 500);
    assert.equal(chunks[0].documentTitle, 'Doc Title');
    assert.equal(chunks[0].section, 'Part A');
    assert.match(chunks[0].embedText, /Doc Title - Part A/);
  });
});

// ---------- Vector search ----------

describe('vector search', () => {
  it('computes cosine similarity', () => {
    assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
    assert.ok(Math.abs(cosineSimilarity([1, 1], [1, 0]) - Math.SQRT1_2) < 1e-9);
  });

  it('ranks the closest chunk first and respects topK', () => {
    const index = { chunks: [{ id: 'far', vector: [0, 1] }, { id: 'near', vector: [1, 0.1] }, { id: 'mid', vector: [1, 1] }] };
    const results = search(index, [1, 0], 2);
    assert.deepEqual(results.map((r) => r.chunk.id), ['near', 'mid']);
  });
});

// ---------- Full API (real backend code + local Gemini stub) ----------

describe('POST /api/chat', () => {
  let mock;
  let server;
  let baseUrl;
  let tempDir;

  const ask = (question) => fetch(`${baseUrl}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });

  before(async () => {
    mock = await startMockGemini();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'powerinvest-test-'));
    process.env.GEMINI_API_BASE_URL = mock.url;
    process.env.RAG_INDEX_PATH = path.join(tempDir, 'index.json');
    process.env.RAG_MIN_SIMILARITY = '0.15'; // above the stub's hash-collision noise (~0.07), below its real matches (0.27+)
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  beforeEach(() => {
    mock.reset();
    process.env.GEMINI_API_KEY = 'test-key-123';
    clearIndexCache();
  });

  after(async () => {
    server.close();
    await mock.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('returns a grounded answer with retrieved sources and builds the index on first use', async () => {
    const response = await ask('What is the P/E ratio?');
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.insufficient, false);
    assert.match(body.answer, /^\[MOCK LLM\]/);
    assert.ok(body.sources.length > 0);
    assert.equal(body.sources[0].documentTitle, 'Financial Glossary', 'the glossary P/E entry should be the top hit');
    assert.match(body.sources[0].section, /P\/E/);
    assert.equal(body.sources[0].cited, true);
    assert.ok(mock.state.embeddedTextCount > 50, 'all chunks should have been embedded');
    await fs.access(process.env.RAG_INDEX_PATH); // index file was persisted
  });

  it('sends the retrieved context, the question and grounding rules to the LLM', async () => {
    await ask('What is portfolio diversification?');
    const request = mock.state.generateRequests[0];
    const prompt = request.body.contents[0].parts[0].text;
    assert.match(prompt, /Context passages:/);
    assert.match(prompt, /Source: Portfolio Diversification/);
    assert.match(prompt, /Question: What is portfolio diversification\?/);
    assert.match(request.body.systemInstruction.parts[0].text, /ONLY the numbered context passages/);
  });

  it('retrieves different sources for different questions', async () => {
    const fundamental = await (await ask('What is the difference between fundamental and technical analysis?')).json();
    const risk = await (await ask('How does risk management work with stop-loss orders and position sizing?')).json();
    const titles = (body) => body.sources.map((source) => source.documentTitle);
    assert.ok(titles(fundamental).some((title) => /Technical Analysis|Fundamental Analysis/.test(title)));
    assert.ok(titles(risk).includes('Risk Management in Stock Investing'));
  });

  it('reuses the saved index instead of re-embedding the knowledge base', async () => {
    await ask('What is the P/E ratio?');
    mock.reset();
    clearIndexCache(); // force a reload from the JSON file
    await ask('What is diversification?');
    assert.equal(mock.state.embeddedTextCount, 1, 'only the question should be embedded');
  });

  it('keeps the API key in a header, never in the URL or the response', async () => {
    const response = await ask('What is the P/E ratio?');
    const text = await response.text();
    const request = mock.state.generateRequests[0];
    assert.equal(request.headers['x-goog-api-key'], 'test-key-123');
    assert.ok(!request.url.includes('test-key-123'));
    assert.ok(!text.includes('test-key-123'));
  });

  it('says it does not have enough information when nothing relevant is retrieved (and skips the LLM)', async () => {
    const response = await ask('Who wrote the Odyssey about Greek heroes?');
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.insufficient, true);
    assert.match(body.answer, /don't have enough information/);
    assert.equal(mock.state.generateRequests.length, 0, 'the LLM must not be called');
  });

  it('turns the LLM\'s INSUFFICIENT_CONTEXT reply into an honest "not enough information"', async () => {
    mock.state.mode = 'ok';
    await ask('What is the P/E ratio?'); // build the index first
    mock.state.mode = 'insufficient';
    const body = await (await ask('What is the P/E ratio?')).json();
    assert.equal(body.insufficient, true);
    assert.match(body.answer, /don't have enough information/);
    assert.ok(body.sources.every((source) => source.cited === false));
  });

  it('returns 503 MISSING_API_KEY when no key is configured', async () => {
    process.env.GEMINI_API_KEY = '';
    const response = await ask('What is the P/E ratio?');
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error.code, 'MISSING_API_KEY');
    assert.equal(mock.state.embedRequests.length + mock.state.generateRequests.length, 0, 'no API call may be attempted');
  });

  it('treats the .env.example placeholder as a missing key', async () => {
    process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
    const response = await ask('What is the P/E ratio?');
    assert.equal((await response.json()).error.code, 'MISSING_API_KEY');
  });

  it('maps API failures to clear errors', async () => {
    await ask('What is the P/E ratio?'); // build the index while the stub is healthy
    const cases = [
      ['http500', 502, 'LLM_API_ERROR'],
      ['http403', 502, 'LLM_AUTH_ERROR'],
      ['badkey400', 502, 'LLM_AUTH_ERROR'],
      ['http429', 429, 'LLM_RATE_LIMITED'],
      ['notjson', 502, 'LLM_API_ERROR']
    ];
    for (const [mode, status, code] of cases) {
      mock.state.mode = mode;
      const response = await ask('What is the P/E ratio?');
      const body = await response.json();
      assert.equal(response.status, status, mode);
      assert.equal(body.error.code, code, mode);
      assert.ok(body.error.message.length > 10);
    }
  });

  it('reports an unreachable Gemini API', async () => {
    await ask('What is the P/E ratio?');
    const original = process.env.GEMINI_API_BASE_URL;
    process.env.GEMINI_API_BASE_URL = 'http://127.0.0.1:1/v1beta'; // nothing listens here
    const response = await ask('What is the P/E ratio?');
    process.env.GEMINI_API_BASE_URL = original;
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error.code, 'LLM_UNREACHABLE');
  });

  it('handles empty and blocked LLM responses', async () => {
    await ask('What is the P/E ratio?');
    for (const mode of ['empty', 'blocked']) {
      mock.state.mode = mode;
      const response = await ask('What is the P/E ratio?');
      assert.equal(response.status, 502, mode);
      assert.equal((await response.json()).error.code, mode === 'empty' ? 'EMPTY_RESPONSE' : 'LLM_BLOCKED');
    }
  });

  it('validates the question', async () => {
    for (const bad of ['', '   ', undefined, 42, 'x'.repeat(501)]) {
      const response = await ask(bad);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, 'INVALID_QUESTION');
    }
    const malformed = await fetch(`${baseUrl}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json' });
    assert.equal(malformed.status, 400);
  });
});

describe('GET /api/health', () => {
  it('reports configuration state without exposing the key', async () => {
    const server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/health`;

    process.env.GEMINI_API_KEY = '';
    const unconfigured = await (await fetch(url)).json();
    assert.equal(unconfigured.llmConfigured, false);

    process.env.GEMINI_API_KEY = 'secret-key-xyz';
    const response = await fetch(url);
    const text = await response.text();
    server.close();
    const configured = JSON.parse(text);
    assert.equal(configured.llmConfigured, true);
    assert.ok(configured.knowledge.documents.length >= 8);
    assert.ok(configured.knowledge.chunkCount > 40);
    assert.ok(!text.includes('secret-key-xyz'));
  });
});

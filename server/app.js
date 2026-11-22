// The small HTTP API that the React app talks to.
//   GET  /api/health  -> is the assistant configured, what is in the knowledge base
//   POST /api/chat    -> { question } -> grounded answer + retrieved sources
import express from 'express';
import { getConfig } from './config.js';
import { AppError } from './rag/errors.js';
import { answerQuestion } from './rag/pipeline.js';
import { getKnowledgeStatus } from './rag/vectorStore.js';

// Very small per-IP rate limit so a stray loop cannot burn through your Gemini quota.
function createRateLimiter({ limit, windowMs }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || now > entry.resetAt) {
      hits.set(req.ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > limit) {
      return next(new AppError(429, 'RATE_LIMITED', 'Too many questions in a short time. Please wait a minute and try again.'));
    }
    next();
  };
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', async (req, res) => {
    const config = getConfig();
    res.json({
      status: 'ok',
      llmConfigured: Boolean(config.apiKey), // only true/false - the key itself is never exposed
      models: { chat: config.chatModel, embedding: config.embeddingModel },
      knowledge: await getKnowledgeStatus()
    });
  });

  app.post('/api/chat', createRateLimiter({ limit: 30, windowMs: 60_000 }), async (req, res) => {
    res.json(await answerQuestion(req.body?.question));
  });

  app.use('/api', (req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route.' } });
  });

  // Every error leaves the server as { error: { code, message } } so the UI can show it.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof AppError) {
      return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    }
    if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
      return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'The request body must be valid JSON under 10 KB.' } });
    }
    console.error('Unexpected server error:', error?.message || error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server.' } });
  });

  return app;
}

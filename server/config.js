// Central place where the backend reads its settings from environment variables.
// Values are read when getConfig() is called (not at import time), which keeps the
// code easy to test and means nothing secret is ever hard-coded.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));

// The placeholder shipped in .env.example must NOT count as a real key.
const PLACEHOLDER_KEYS = ['', 'your_gemini_api_key_here'];

export function getConfig() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  return {
    port: Number(process.env.PORT) || 8787,

    // --- Gemini API ---
    apiKey: PLACEHOLDER_KEYS.includes(apiKey) ? '' : apiKey,
    apiBaseUrl: process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-3.7-flash',
    requestTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 30000,

    // --- RAG settings ---
    topK: Number(process.env.RAG_TOP_K) || 4, // how many chunks to retrieve per question
    // Chunks scoring below this cosine similarity are treated as "not relevant".
    // If NO chunk reaches it, the assistant says it lacks information without calling the LLM.
    minSimilarity: process.env.RAG_MIN_SIMILARITY !== undefined ? Number(process.env.RAG_MIN_SIMILARITY) : 0.4,
    maxChunkChars: 800,
    maxQuestionChars: 500,

    // --- Files ---
    knowledgeDir: process.env.RAG_KNOWLEDGE_DIR || path.join(serverDir, 'knowledge'),
    indexPath: process.env.RAG_INDEX_PATH || path.join(serverDir, 'data', 'vector-index.json')
  };
}

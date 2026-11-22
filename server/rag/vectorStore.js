// RAG step 4 - STORE and step 5 - RETRIEVE.
//
// Why not a vector database like Chroma or Pinecone?
//   This knowledge base has only ~60 chunks. Comparing a question against 60 vectors takes
//   microseconds, so a simple in-memory index persisted to one JSON file is enough, adds no
//   extra service to run, and keeps the whole retrieval step readable (see `search` below).
//   For millions of chunks you would swap this file for a real vector database.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getConfig } from '../config.js';
import { loadDocuments } from './loadDocuments.js';
import { chunkDocuments } from './chunker.js';
import { embedTexts } from './gemini.js';

const INDEX_VERSION = 1;
let cachedIndex = null; // the index kept in memory between requests
let buildInProgress = null; // prevents two simultaneous requests from building the index twice

// --- Similarity -----------------------------------------------------------------

// Cosine similarity: 1 = same direction (very similar meaning), 0 = unrelated.
export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// RAG step 5 - RETRIEVE: score every chunk against the question vector and keep the best few.
export function search(index, queryVector, topK) {
  return index.chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryVector, chunk.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// --- Building and loading the index ----------------------------------------------

// A fingerprint of the knowledge content + embedding model. If either changes, the saved
// index is out of date and gets rebuilt automatically.
function fingerprint(chunks, embeddingModel) {
  return crypto.createHash('sha256').update(embeddingModel + '\n' + chunks.map((chunk) => chunk.embedText).join('\n---\n')).digest('hex');
}

async function readIndexFile(indexPath) {
  try {
    return JSON.parse(await fs.readFile(indexPath, 'utf8'));
  } catch {
    return null; // missing or unreadable file -> treated as "no index yet"
  }
}

async function prepareChunks(config) {
  const documents = await loadDocuments(config.knowledgeDir);
  const chunks = chunkDocuments(documents, config.maxChunkChars);
  return { documents, chunks, contentHash: fingerprint(chunks, config.embeddingModel) };
}

async function buildIndex(config, chunks, contentHash) {
  // Embed all chunks (calls the Gemini embedding API - needs GEMINI_API_KEY).
  const vectors = await embedTexts(chunks.map((chunk) => chunk.embedText));

  const index = {
    version: INDEX_VERSION,
    embeddingModel: config.embeddingModel,
    contentHash,
    createdAt: new Date().toISOString(),
    chunks: chunks.map((chunk, i) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      section: chunk.section,
      text: chunk.text,
      vector: vectors[i].map((value) => Number(value.toFixed(5))) // rounded to keep the file small
    }))
  };

  await fs.mkdir(path.dirname(config.indexPath), { recursive: true });
  await fs.writeFile(config.indexPath, JSON.stringify(index));
  return index;
}

// Returns an up-to-date index: from memory, else from disk, else freshly built.
export async function getIndex({ forceRebuild = false } = {}) {
  const config = getConfig();
  const { chunks, contentHash } = await prepareChunks(config);

  if (!forceRebuild && cachedIndex?.contentHash === contentHash) return cachedIndex;

  if (!forceRebuild) {
    const saved = await readIndexFile(config.indexPath);
    if (saved?.version === INDEX_VERSION && saved.contentHash === contentHash) {
      cachedIndex = saved;
      return cachedIndex;
    }
  }

  buildInProgress ??= buildIndex(config, chunks, contentHash)
    .then((index) => (cachedIndex = index))
    .finally(() => { buildInProgress = null; });
  return buildInProgress;
}

// Cheap status report for the UI (no API calls): what is in the knowledge base and is the index built?
export async function getKnowledgeStatus() {
  const config = getConfig();
  const { documents, chunks, contentHash } = await prepareChunks(config);
  const saved = cachedIndex?.contentHash === contentHash ? cachedIndex : await readIndexFile(config.indexPath);
  return {
    documents: documents.map((document) => ({ id: document.id, title: document.title })),
    chunkCount: chunks.length,
    indexReady: saved?.contentHash === contentHash
  };
}

// Test helper: forget the in-memory copy.
export function clearIndexCache() {
  cachedIndex = null;
}

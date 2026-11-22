// `npm run retrieve -- "What is the P/E ratio?"`
// Shows ONLY the retrieval half of RAG (question -> embedding -> most similar chunks),
// without calling the LLM. Handy for understanding and tuning RAG_MIN_SIMILARITY.
import 'dotenv/config';
import { getConfig } from '../config.js';
import { embedTexts } from '../rag/gemini.js';
import { getIndex, search } from '../rag/vectorStore.js';

const question = process.argv.slice(2).join(' ').trim();
if (!question) {
  console.error('Usage: npm run retrieve -- "your question"');
  process.exit(1);
}

try {
  const index = await getIndex();
  const [queryVector] = await embedTexts([question]);
  const { minSimilarity, topK } = getConfig();
  console.log(`Question: ${question}\nMinimum similarity to count as relevant: ${minSimilarity}\n`);
  for (const { chunk, score } of search(index, queryVector, topK)) {
    console.log(`${score.toFixed(3)} ${score >= minSimilarity ? '(relevant)' : '(below threshold)'}  ${chunk.documentTitle} > ${chunk.section}`);
    console.log(`        ${chunk.text.slice(0, 110)}...`);
  }
} catch (error) {
  console.error(`Retrieval failed [${error.code || 'ERROR'}]: ${error.message}`);
  process.exit(1);
}

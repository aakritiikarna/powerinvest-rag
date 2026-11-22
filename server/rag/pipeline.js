// The whole RAG flow for ONE question, from question to grounded answer.
//
//   question -> embed -> retrieve top chunks -> build prompt -> LLM -> answer + sources
//
// (The one-time "load -> chunk -> embed -> store" steps happen in vectorStore.getIndex().)
import { getConfig } from '../config.js';
import { AppError } from './errors.js';
import { embedTexts, generateText } from './gemini.js';
import { getIndex, search } from './vectorStore.js';
import { buildUserPrompt, INSUFFICIENT_MARKER, SYSTEM_PROMPT } from './prompt.js';

const INSUFFICIENT_ANSWER =
  "I don't have enough information in my knowledge base to answer that reliably. " +
  'I can help with investing basics, risk management, portfolio diversification, fundamental and technical analysis, and common financial terms such as the P/E ratio.';

// Find which [n] citations the model actually used in its answer.
function findCitedNumbers(answer, sourceCount) {
  const cited = new Set();
  for (const match of answer.matchAll(/\[(\d+)\]/g)) {
    const n = Number(match[1]);
    if (n >= 1 && n <= sourceCount) cited.add(n);
  }
  return cited;
}

export async function answerQuestion(rawQuestion) {
  const config = getConfig();

  // 0. Validate input
  const question = typeof rawQuestion === 'string' ? rawQuestion.trim() : '';
  if (!question) throw new AppError(400, 'INVALID_QUESTION', 'Please type a question.');
  if (question.length > config.maxQuestionChars) {
    throw new AppError(400, 'INVALID_QUESTION', `Please keep your question under ${config.maxQuestionChars} characters.`);
  }

  // 1. Make sure the vector index exists (builds it on first use)
  const index = await getIndex();

  // 2. EMBED the question with the same model that embedded the chunks
  const [queryVector] = await embedTexts([question]);

  // 3. RETRIEVE the most similar chunks
  const hits = search(index, queryVector, config.topK).map((hit, i) => ({
    n: i + 1,
    id: hit.chunk.id,
    documentId: hit.chunk.documentId,
    documentTitle: hit.chunk.documentTitle,
    section: hit.chunk.section,
    text: hit.chunk.text,
    score: Number(hit.score.toFixed(4))
  }));
  const relevant = hits.filter((hit) => hit.score >= config.minSimilarity).map((hit, i) => ({ ...hit, n: i + 1 }));

  const modelInfo = { chat: config.chatModel, embedding: config.embeddingModel };

  // 4. Nothing relevant found -> be honest and do NOT call the LLM at all.
  if (relevant.length === 0) {
    return { answer: INSUFFICIENT_ANSWER, insufficient: true, sources: hits.map((hit) => ({ ...hit, cited: false })), models: modelInfo };
  }

  // 5. AUGMENT + GENERATE: send question + retrieved passages to the LLM
  const rawAnswer = await generateText({ systemPrompt: SYSTEM_PROMPT, userPrompt: buildUserPrompt(question, relevant) });

  // 6. The LLM itself may decide the passages are not enough
  if (rawAnswer.includes(INSUFFICIENT_MARKER)) {
    return { answer: INSUFFICIENT_ANSWER, insufficient: true, sources: relevant.map((hit) => ({ ...hit, cited: false })), models: modelInfo };
  }

  const cited = findCitedNumbers(rawAnswer, relevant.length);
  return {
    answer: rawAnswer,
    insufficient: false,
    sources: relevant.map((hit) => ({ ...hit, cited: cited.has(hit.n) })),
    models: modelInfo
  };
}

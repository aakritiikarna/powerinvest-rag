// `npm run ingest` - builds the vector index: load -> chunk -> embed -> store.
// You do not have to run this manually (the server builds the index on the first question),
// but it is useful to see the pipeline run and to rebuild after editing the knowledge files.
import 'dotenv/config';
import { getIndex } from '../rag/vectorStore.js';
import { getConfig } from '../config.js';

try {
  console.log('Building the vector index (this calls the Gemini embedding API)...');
  const index = await getIndex({ forceRebuild: true });
  const documents = new Set(index.chunks.map((chunk) => chunk.documentId));
  console.log(`Done: ${documents.size} documents -> ${index.chunks.length} chunks, ${index.chunks[0].vector.length} dimensions each.`);
  console.log(`Saved to ${getConfig().indexPath}`);
} catch (error) {
  console.error(`Ingest failed [${error.code || 'ERROR'}]: ${error.message}`);
  process.exit(1);
}

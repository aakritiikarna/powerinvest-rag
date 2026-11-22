// RAG step 1 - LOAD: read every Markdown file in the knowledge folder.
// Each file is one "document". Its first "# Heading" becomes the document title
// that is later shown to the user as the source name.
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadDocuments(knowledgeDir) {
  const files = (await fs.readdir(knowledgeDir)).filter((file) => file.endsWith('.md')).sort();
  const documents = [];

  for (const file of files) {
    const text = await fs.readFile(path.join(knowledgeDir, file), 'utf8');
    const titleMatch = text.match(/^#\s+(.+)$/m);
    documents.push({
      id: file.replace(/\.md$/, ''),
      title: titleMatch ? titleMatch[1].trim() : file,
      text
    });
  }
  return documents;
}

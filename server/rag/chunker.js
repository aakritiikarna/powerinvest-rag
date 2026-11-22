// RAG step 2 - CHUNK: split each document into small pieces ("chunks").
//
// Why chunk at all?
//   * An embedding represents the meaning of ONE piece of text. A whole document would blur
//     many topics together, so a question about "P/E ratio" could not find the right part.
//   * Small chunks mean we only send the few relevant passages to the LLM, not everything.
//
// Strategy (kept deliberately simple):
//   1. Split a document at its "## Section" headings - each section is usually one idea.
//   2. If a section is longer than `maxChars`, split it by sentences, packing sentences
//      into chunks of at most `maxChars` characters.
//   3. When a long section is split, the next chunk starts with the LAST sentence of the
//      previous chunk ("overlap") so an idea that crosses a boundary is not cut in half.

// Break a document into [{ heading, body }] using "## " headings.
export function splitIntoSections(markdown) {
  const sections = [];
  let current = { heading: 'Overview', lines: [] };

  for (const line of markdown.split('\n')) {
    if (line.startsWith('# ')) continue; // the document title, stored separately
    if (line.startsWith('## ')) {
      sections.push(current);
      current = { heading: line.slice(3).trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  return sections
    .map(({ heading, lines }) => ({ heading, body: lines.join(' ').replace(/\s+/g, ' ').trim() }))
    .filter((section) => section.body.length > 0);
}

// Split one long section into pieces of at most `maxChars`, with one sentence of overlap.
export function splitBySentences(body, maxChars) {
  if (body.length <= maxChars) return [body];

  const sentences = body.split(/(?<=[.!?])\s+/);
  const pieces = [];
  let current = [];

  for (const sentence of sentences) {
    const candidate = [...current, sentence].join(' ');
    if (current.length > 0 && candidate.length > maxChars) {
      pieces.push(current.join(' '));
      current = [current[current.length - 1], sentence]; // overlap: carry over the last sentence
    } else {
      current.push(sentence);
    }
  }
  if (current.length > 0) pieces.push(current.join(' '));
  return pieces;
}

// Turn one document into chunks that carry the metadata we need to show sources later.
export function chunkDocument(document, maxChars) {
  const chunks = [];

  for (const { heading, body } of splitIntoSections(document.text)) {
    for (const piece of splitBySentences(body, maxChars)) {
      chunks.push({
        id: `${document.id}-${chunks.length + 1}`,
        documentId: document.id,
        documentTitle: document.title,
        section: heading,
        text: piece,
        // The text we actually embed includes the title and heading, which gives the
        // embedding model extra context (e.g. a bare "It shows how much..." is ambiguous).
        embedText: `${document.title} - ${heading}\n${piece}`
      });
    }
  }
  return chunks;
}

export function chunkDocuments(documents, maxChars) {
  return documents.flatMap((document) => chunkDocument(document, maxChars));
}

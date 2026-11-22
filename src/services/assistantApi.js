// Thin client for the assistant backend (server/). The browser only ever talks to
// our own /api routes - it never sees the Gemini API key (that lives on the server).
// In development Vite forwards /api/* to the backend (see vite.config.js).

export class AssistantError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const SERVER_DOWN_MESSAGE = 'The assistant server is not responding. Start it in a second terminal with "npm run server".';

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Is the backend running, is the API key configured, what is in the knowledge base?
export async function fetchAssistantStatus() {
  try {
    const response = await fetch('/api/health');
    const data = await readJson(response);
    if (!response.ok || !data) return { online: false };
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
}

// Ask one question. Resolves with { answer, insufficient, sources, models } or throws AssistantError.
export async function askAssistant(question) {
  let response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
  } catch {
    throw new AssistantError('SERVER_UNREACHABLE', SERVER_DOWN_MESSAGE);
  }

  const data = await readJson(response);
  if (!response.ok) {
    // A proxy error with no JSON body means the backend is not running.
    throw new AssistantError(data?.error?.code || 'SERVER_UNREACHABLE', data?.error?.message || SERVER_DOWN_MESSAGE);
  }
  if (!data?.answer) throw new AssistantError('EMPTY_RESPONSE', 'The assistant returned an empty response. Please try again.');
  return data;
}

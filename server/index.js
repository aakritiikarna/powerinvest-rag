// Entry point: `npm run server`
import 'dotenv/config'; // loads GEMINI_API_KEY etc. from the .env file into process.env
import { createApp } from './app.js';
import { getConfig } from './config.js';

const config = getConfig();

// Bind to localhost only: this demo API has no user authentication, so it should not be
// reachable from other machines.
createApp().listen(config.port, '127.0.0.1', () => {
  console.log(`PowerInvest assistant API listening on http://127.0.0.1:${config.port}`);
  console.log(config.apiKey
    ? `Gemini API key: configured (chat model: ${config.chatModel}, embedding model: ${config.embeddingModel})`
    : 'Gemini API key: NOT configured. Copy .env.example to .env and set GEMINI_API_KEY to enable the assistant.');
});

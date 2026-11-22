import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Bot, Info, RotateCcw, Send, Sparkles } from 'lucide-react';
import { PageIntro, SectionHeader } from '../components/shared';
import ChatMessage from '../components/assistant/ChatMessage';
import { askAssistant, fetchAssistantStatus } from '../services/assistantApi';

const SAMPLE_QUESTIONS = [
  'What is portfolio diversification?',
  'What is the difference between fundamental and technical analysis?',
  'How does risk management work in stock investing?',
  'What is the P/E ratio?',
  'What factors should an investor consider before investing in a company?'
];

const PIPELINE_STEPS = [
  { title: 'Embed the question', detail: 'Your question is converted into a vector with a Gemini embedding model.' },
  { title: 'Retrieve passages', detail: 'The most similar chunks of the knowledge base are found by cosine similarity.' },
  { title: 'Generate a grounded answer', detail: 'Gemini answers using only those passages, and cites them.' },
  { title: 'Show the sources', detail: 'Every answer lists the passages it was built from.' }
];

// Banner that tells the truth about whether the assistant can currently answer.
function StatusBanner({ status }) {
  if (!status) return null;
  if (!status.online) {
    return <div className="notice-banner assistant-banner warn"><div className="notice-icon"><AlertTriangle size={16} /></div><div><strong>Assistant server not running</strong><span>Start the backend in a second terminal with <code>npm run server</code>, then reload this page.</span></div></div>;
  }
  if (!status.llmConfigured) {
    return <div className="notice-banner assistant-banner warn"><div className="notice-icon"><AlertTriangle size={16} /></div><div><strong>Gemini API key not configured</strong><span>Copy <code>.env.example</code> to <code>.env</code>, set <code>GEMINI_API_KEY</code>, and restart the server. No answers are generated until then.</span></div></div>;
  }
  return null;
}

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const bottomRef = useRef(null);
  const nextId = useRef(0); // simple message ids (crypto.randomUUID is unavailable on non-HTTPS origins)

  useEffect(() => { fetchAssistantStatus().then(setStatus); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading]);

  async function send(question) {
    const text = question.trim();
    if (!text || loading) return;
    setMessages((current) => [...current, { id: nextId.current++, role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const result = await askAssistant(text);
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', content: result.answer, sources: result.sources, insufficient: result.insufficient }]);
    } catch (error) {
      setMessages((current) => [...current, { id: nextId.current++, role: 'error', content: error.message }]);
    } finally {
      setLoading(false);
      fetchAssistantStatus().then(setStatus); // refresh (e.g. the index is now built)
    }
  }

  const statusLine = !status ? 'Checking assistant…'
    : !status.online ? 'Server offline'
    : !status.llmConfigured ? 'API key missing'
    : `Gemini · ${status.knowledge.chunkCount} chunks${status.knowledge.indexReady ? ' indexed' : ' (index builds on first question)'}`;

  return (
    <div className="assistant-page">
      <PageIntro
        eyebrow="Knowledge assistant"
        title="AI Financial Assistant"
        description="Ask finance questions and get answers grounded in a small educational knowledge base, using retrieval-augmented generation (RAG)."
        actions={<div className="ai-disclaimer"><Sparkles size={15} /> RAG · Google Gemini</div>}
      />
      <StatusBanner status={status} />

      <div className="assistant-layout">
        <section className="panel chat-panel" aria-label="AI Financial Assistant chat">
          <div className="chat-header">
            <div><strong>Ask a question</strong><span className={`chat-status ${status?.online && status.llmConfigured ? 'ready' : ''}`}>{statusLine}</span></div>
            {messages.length > 0 && <button className="button button-secondary chat-reset" onClick={() => setMessages([])}><RotateCcw size={13} /> New chat</button>}
          </div>

          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="chat-empty">
                <div className="empty-icon"><Bot size={22} /></div>
                <h3>What would you like to understand?</h3>
                <p>Try one of these. Each answer shows the passages it was retrieved from.</p>
                <div className="sample-questions">
                  {SAMPLE_QUESTIONS.map((question) => <button key={question} className="sample-question" onClick={() => send(question)}>{question}</button>)}
                </div>
              </div>
            )}
            {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
            {loading && <div className="chat-row"><span className="chat-avatar"><Sparkles size={14} /></span><div className="chat-bubble assistant chat-loading"><span className="spinner" /> Searching the knowledge base…</div></div>}
            <div ref={bottomRef} />
          </div>

          <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); send(input); }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} placeholder="Ask about investing, risk, valuation…" aria-label="Your question" disabled={loading} />
            <button className="button button-primary" type="submit" disabled={loading || !input.trim()}><Send size={14} /> Ask</button>
          </form>
          <div className="chat-footnote"><Info size={12} /> Answers come only from the knowledge base shown on the right. Educational use only, not financial advice.</div>
        </section>

        <aside className="assistant-side">
          <section className="panel">
            <SectionHeader title="How an answer is made" detail="The RAG pipeline" />
            <ol className="pipeline-steps">
              {PIPELINE_STEPS.map((step) => <li key={step.title}><strong>{step.title}</strong><span>{step.detail}</span></li>)}
            </ol>
          </section>
          <section className="panel">
            <SectionHeader title="Knowledge base" detail={status?.knowledge ? `${status.knowledge.documents.length} documents · ${status.knowledge.chunkCount} chunks` : 'Not loaded'} />
            {status?.knowledge ? (
              <ul className="kb-list">{status.knowledge.documents.map((document) => <li key={document.id}><BookOpen size={13} />{document.title}</li>)}</ul>
            ) : (
              <p className="kb-offline">Connect the assistant server to see the documents.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

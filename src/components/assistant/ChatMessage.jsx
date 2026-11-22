import { AlertCircle, BookOpen, Sparkles, User } from 'lucide-react';

// Turn "text [1] more text [2][3]" into text with small numbered citation badges.
function renderInline(text) {
  return text.split(/(\[\d+\])/g).map((part, index) => {
    const match = part.match(/^\[(\d+)\]$/);
    return match ? <sup className="cite" key={index}>{match[1]}</sup> : part;
  });
}

// The model answers in plain text: paragraphs, optionally with "- " bullet lines.
function AnswerText({ text }) {
  return text.split(/\n{2,}/).map((block, blockIndex) => {
    const lines = block.split('\n').filter(Boolean);
    if (lines.length > 0 && lines.every((line) => /^[-*•]\s+/.test(line))) {
      return <ul key={blockIndex}>{lines.map((line, i) => <li key={i}>{renderInline(line.replace(/^[-*•]\s+/, ''))}</li>)}</ul>;
    }
    return <p key={blockIndex}>{renderInline(lines.join(' '))}</p>;
  });
}

// The retrieved chunks the answer was built from - this makes the RAG step visible.
function SourceList({ sources, insufficient }) {
  if (!sources?.length) return null;
  return (
    <div className="source-list">
      <div className="source-heading">
        <BookOpen size={13} />
        <strong>{insufficient ? 'Closest passages searched (not relevant enough to answer)' : 'Retrieved sources'}</strong>
        <small>{sources.length} {sources.length === 1 ? 'passage' : 'passages'}</small>
      </div>
      {sources.map((source) => (
        <details className="source-card" key={source.id}>
          <summary>
            <span className="source-num">{source.n}</span>
            <span className="source-title"><strong>{source.documentTitle}</strong><small>{source.section}</small></span>
            {source.cited && <span className="source-tag">Cited</span>}
            <span className="source-score" title="Cosine similarity between your question and this passage (0 to 1)">similarity {source.score.toFixed(2)}</span>
          </summary>
          <p>{source.text}</p>
        </details>
      ))}
    </div>
  );
}

export default function ChatMessage({ message }) {
  if (message.role === 'user') {
    return <div className="chat-row user"><div className="chat-bubble user"><p>{message.content}</p></div><span className="chat-avatar user"><User size={14} /></span></div>;
  }

  if (message.role === 'error') {
    return <div className="chat-row"><span className="chat-avatar error"><AlertCircle size={14} /></span><div className="chat-bubble error" role="alert"><strong>Couldn’t get an answer</strong><p>{message.content}</p></div></div>;
  }

  return (
    <div className="chat-row">
      <span className="chat-avatar"><Sparkles size={14} /></span>
      <div className={`chat-bubble assistant ${message.insufficient ? 'insufficient' : ''}`}>
        {message.insufficient && <span className="insufficient-tag">Not enough information</span>}
        <AnswerText text={message.content} />
        <SourceList sources={message.sources} insufficient={message.insufficient} />
      </div>
    </div>
  );
}

import { useState } from 'react';

// Logos supplied for the project, keyed by the stock they belong to.
// Every file here was checked against its company (Apple, Amazon, Eli Lilly, Microsoft, NVIDIA).
// A logo is shown ONLY when a verified entry exists in this map. Stocks without one
// (JPM, XOM, TSLA, V, UNH) get a neutral ticker badge instead - never another company's logo.
const logos = {
  AAPL: '/logos/aapl.jpg',
  AMZN: '/logos/amzn.jpg',
  LLY: '/logos/lly.jpg',
  MSFT: '/logos/msft.jpg',
  NVDA: '/logos/nvda.jpg'
};

export default function CompanyLogo({ symbol, name, size = 'default' }) {
  // Remember WHICH file failed (not just "something failed"), so a failure for one
  // company can never leak into another company when this component is re-used.
  const [failedSrc, setFailedSrc] = useState(null);
  const src = logos[symbol];
  const className = size === 'large' ? 'ticker-large' : 'ticker-badge';

  // No logo mapped, or the file failed to load -> clean ticker badge (no broken image icon).
  if (!src || failedSrc === src) {
    const lengthClass = symbol.length > 3 ? 'ticker-long' : '';
    return <span className={`${className} ticker-fallback ${lengthClass}`} role="img" aria-label={name || symbol}>{symbol}</span>;
  }

  return (
    <span className={`${className} company-logo`}>
      <img src={src} alt={`${name || symbol} logo`} loading="lazy" onError={() => setFailedSrc(src)} />
    </span>
  );
}

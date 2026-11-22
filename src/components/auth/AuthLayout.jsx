import { BarChart3, BriefcaseBusiness, Eye } from 'lucide-react';
import Brand from '../Brand';

const highlights = [
  { icon: BriefcaseBusiness, title: 'Track your portfolio', text: 'See holdings, value and profit or loss in one place.' },
  { icon: Eye, title: 'Keep a watchlist', text: 'Save the companies you want to research.' },
  { icon: BarChart3, title: 'Learn from signals', text: 'Rule-based insights built for learning, not advice.' }
];

// Shared two-column frame for the Login and Signup pages.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Brand size="large" />
        <div className="auth-aside-body">
          <h2>Your investing workspace, organised.</h2>
          <ul>{highlights.map(({ icon: Icon, title: itemTitle, text }) => <li key={itemTitle}><span><Icon size={17} /></span><div><strong>{itemTitle}</strong><small>{text}</small></div></li>)}</ul>
        </div>
        <p className="auth-aside-note">Simulated market data for learning. Not financial advice.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-brand"><Brand /></div>
        <div className="auth-card">
          <header><h1>{title}</h1><p>{subtitle}</p></header>
          {children}
        </div>
        <p className="auth-footer">{footer}</p>
      </main>
    </div>
  );
}

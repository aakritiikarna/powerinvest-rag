import { Wallet } from 'lucide-react';

export { AppShell, navItems, navGroups } from './layout/AppShell';

export function PageIntro({ eyebrow, title, description, actions }) {
  return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function SectionHeader({ title, detail, action }) {
  return <div className="section-header"><div><h3>{title}</h3>{detail && <span>{detail}</span>}</div>{action}</div>;
}

export function StatusPill({ value, neutral = false }) {
  return <span className={`status-pill ${neutral ? 'neutral' : value >= 0 ? 'positive' : 'negative'}`}>{neutral ? value : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`}</span>;
}

export function EmptyState({ icon: Icon = Wallet, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

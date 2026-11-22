import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export default function StatCard({ label, value, change, detail, icon: Icon, accent = 'mint' }) {
  const trend = typeof change === 'number' ? change > 0 ? 'up' : change < 0 ? 'down' : 'flat' : '';
  return <article className={`stat-card accent-${accent}`}><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon"><Icon size={17} /></span></div><div className="stat-value">{value}</div><div className="stat-foot">{typeof change === 'number' && <span className={`trend ${trend}`}>{trend === 'up' ? <ArrowUpRight size={14} /> : trend === 'down' ? <ArrowDownRight size={14} /> : <Minus size={14} />}{Math.abs(change).toFixed(2)}%</span>}<span>{detail}</span></div></article>;
}

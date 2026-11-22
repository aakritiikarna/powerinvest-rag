import { Activity, ArrowUpRight, BriefcaseBusiness, DollarSign, Globe2, Plus, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageIntro, SectionHeader, StatusPill } from '../components/shared';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { getFirstName } from '../utils/authHelpers';
import PortfolioChart from '../components/PortfolioChart';
import StockTable from '../components/StockTable';
import { activitySeed, marketTrend, stocks } from '../data/stocks';
import { calculatePortfolio, formatCurrency } from '../utils/calculations';

const defaultHoldings = [{ symbol: 'NVDA', quantity: 8, purchasePrice: 128.4 }, { symbol: 'AAPL', quantity: 12, purchasePrice: 219.3 }, { symbol: 'MSFT', quantity: 5, purchasePrice: 402.7 }, { symbol: 'LLY', quantity: 2, purchasePrice: 784.1 }];

export default function Dashboard({ watchlist, onToggleWatch }) {
  const { user } = useAuth();
  const portfolio = calculatePortfolio(defaultHoldings, stocks);
  const topPerformers = [...stocks].sort((a, b) => b.change - a.change).slice(0, 4);
  return <div className="dashboard-page"><PageIntro eyebrow="Saturday, 21 November 2026" title={`Good morning, ${getFirstName(user.name)}`} description="Here’s the pulse of your simulated portfolio today." actions={<><span className="simulation-badge"><span className="live-dot" /> Simulated market data</span><Link className="button button-primary" to="/portfolio"><Plus size={16} /> Add investment</Link></>} />
    <div className="notice-banner"><div className="notice-icon"><ShieldCheck size={16} /></div><div><strong>Learning workspace</strong><span>Prices and investor signals are illustrative sample data, not financial advice or verified live market prices.</span></div><button>Got it</button></div>
    <div className="stats-grid"><StatCard label="Total portfolio value" value={formatCurrency(portfolio.totalValue)} change={2.84} detail="vs. previous close" icon={Wallet} accent="mint" /><StatCard label="Total investment" value={formatCurrency(portfolio.totalInvestment)} detail="Across 4 positions" icon={DollarSign} accent="blue" /><StatCard label="Total profit / loss" value={formatCurrency(portfolio.profitLoss)} change={portfolio.profitLossPercent} detail="Since inception" icon={TrendingUp} accent="violet" /><StatCard label="Market sentiment" value="Optimistic" change={1.26} detail="Based on sample universe" icon={Activity} accent="amber" /></div>
    <div className="content-grid content-grid-main"><section className="panel chart-panel"><SectionHeader title="Portfolio performance" detail="Growth of your simulated holdings" action={<Link to="/portfolio" className="text-link">View portfolio <ArrowUpRight size={14} /></Link>} /><PortfolioChart /></section><section className="panel market-panel"><SectionHeader title="Market overview" detail="Sample universe · Today" action={<Globe2 size={17} className="section-icon" />} /><div className="market-score"><div><span className="score-label">Market pulse</span><strong>74.8</strong><span className="score-change"><ArrowUpRight size={13} /> 3.2%</span></div><div className="pulse-bars">{marketTrend.map((item, index) => <span key={item.label} style={{ height: `${item.value}%` }} className={index > 4 ? 'highlight' : ''} />)}</div></div><div className="market-stat-row"><span><i className="green-dot" /> Advancing <strong>68%</strong></span><span><i className="red-dot" /> Declining <strong>32%</strong></span></div></section></div>
    <div className="content-grid content-grid-secondary"><section className="panel"><SectionHeader title="Top performers" detail="Strongest sample movers today" action={<Link to="/explorer" className="text-link">Explore market <ArrowUpRight size={14} /></Link>} /><StockTable stocks={topPerformers} watchlist={watchlist} onToggleWatch={onToggleWatch} compact /></section><section className="panel activity-panel"><SectionHeader title="Recent activity" detail="Your latest workspace actions" action={<Link to="/portfolio" className="text-link">See all <ArrowUpRight size={14} /></Link>} /><div className="activity-list">{activitySeed.map((item) => <div className="activity-item" key={item.id}><div className={`activity-icon ${item.type}`}>{item.type === 'buy' ? <Plus size={15} /> : item.type === 'sell' ? <TrendingUp size={15} /> : <BriefcaseBusiness size={15} />}</div><div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div><time>{item.time}</time></div>)}</div></section></div>
  </div>;
}

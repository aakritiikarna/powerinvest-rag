import { useMemo } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shared';
import { useLocalStorage } from './hooks/useLocalStorage';
import Dashboard from './pages/Dashboard';
import StockExplorer from './pages/StockExplorer';
import Portfolio from './pages/Portfolio';
import Insights from './pages/Insights';
import Assistant from './pages/Assistant';
import Watchlist from './pages/Watchlist';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';

const initialHoldings = [
  { id: 'nvda-1', symbol: 'NVDA', quantity: 8, purchasePrice: 128.4 },
  { id: 'aapl-1', symbol: 'AAPL', quantity: 12, purchasePrice: 219.3 },
  { id: 'msft-1', symbol: 'MSFT', quantity: 5, purchasePrice: 402.7 },
  { id: 'lly-1', symbol: 'LLY', quantity: 2, purchasePrice: 784.1 }
];

export default function App() {
  const [watchlist, setWatchlist] = useLocalStorage('powerinvest-watchlist', ['NVDA', 'LLY', 'TSLA', 'AMZN']);
  const [holdings, setHoldings] = useLocalStorage('powerinvest-holdings', initialHoldings);
  const toggleWatch = (symbol) => setWatchlist((current) => current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol]);
  const shared = useMemo(() => ({ watchlist, onToggleWatch: toggleWatch }), [watchlist]);
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route element={<ProtectedRoute><AppShell><Outlet /></AppShell></ProtectedRoute>}>
      <Route path="/" element={<Dashboard {...shared} />} />
      <Route path="/explorer" element={<StockExplorer {...shared} />} />
      <Route path="/portfolio" element={<Portfolio holdings={holdings} setHoldings={setHoldings} />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/watchlist" element={<Watchlist {...shared} />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>;
}

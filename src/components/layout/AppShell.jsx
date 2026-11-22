import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Bell, Bot, BriefcaseBusiness, ChevronDown, ChevronRight, CircleHelp, Database, Eye, Gauge, LayoutDashboard, Lightbulb, LogOut, Menu, Moon, Search, Settings, Sparkles, Sun, TrendingUp, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getFirstName, getInitials } from '../../utils/authHelpers';
import Brand from '../Brand';

export const navGroups = [
  { label: 'Overview', items: [{ to: '/', label: 'Overview', icon: LayoutDashboard, end: true }, { to: '/portfolio', label: 'Portfolio', icon: BriefcaseBusiness }, { to: '/explorer', label: 'Markets', icon: BarChart3 }, { to: '/watchlist', label: 'Watchlist', icon: Eye, count: '4' }] },
  { label: 'Intelligence', items: [{ to: '/analytics', label: 'Analytics', icon: Gauge, comingSoon: true }, { to: '/insights', label: 'AI Insights', icon: Lightbulb }, { to: '/assistant', label: 'AI Assistant', icon: Bot }] },
  { label: 'Operations', items: [{ to: '/transactions', label: 'Transactions', icon: TrendingUp, comingSoon: true }, { to: '/data-management', label: 'Data Management', icon: Database, comingSoon: true }] },
  { label: 'Workspace', items: [{ to: '/settings', label: 'Settings', icon: Settings }] }
];

export const navItems = navGroups.flatMap((group) => group.items);

function Logo() {
  return <Brand />;
}

function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  return <motion.aside className={`sidebar ${open ? 'is-open' : ''}`} initial={false} animate={open ? { x: 0 } : {}} transition={{ duration: .22, ease: 'easeOut' }}>
    <div className="sidebar-top"><Logo /><button className="icon-button mobile-only" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div>
    <div className="workspace-switcher"><div className="workspace-avatar">{getInitials(user.name)}</div><div><strong>{getFirstName(user.name)}’s workspace</strong><span>Personal account</span></div><ChevronRight size={15} /></div>
    <nav className="primary-nav" aria-label="Primary navigation">
      {navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-heading">{group.label}</span>{group.items.map(({ to, label, icon: Icon, end, count, comingSoon }) => comingSoon ? <span key={to} className="nav-link nav-link-disabled" title="Coming in a later phase"><Icon size={17} /><span>{label}</span><small>soon</small></span> : <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={17} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}</NavLink>)}</div>)}
    </nav>
    <div className="sidebar-bottom"><div className="insight-card"><div className="insight-icon"><Sparkles size={16} /></div><strong>Make informed moves</strong><p>Explore educational signals built from your portfolio.</p><NavLink to="/insights" onClick={onClose}>View insights <ChevronRight size={13} /></NavLink></div><div className="sidebar-footer"><CircleHelp size={16} /><span>Help center</span><span className="status-dot" /></div></div>
  </motion.aside>;
}

function Notifications() {
  return <div className="notification-popover"><div className="popover-heading"><strong>Notifications</strong><span>2 new</span></div><div className="notification-item"><span className="notification-dot mint" /><div><strong>Portfolio moved up</strong><small>Your simulated portfolio is up 2.84% today.</small></div></div><div className="notification-item"><span className="notification-dot blue" /><div><strong>New insight available</strong><small>Review the latest diversification prompt.</small></div></div><button className="popover-footer">View all activity <ChevronRight size={13} /></button></div>;
}

function Topbar({ onMenu }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const current = navItems.find((item) => item.to === location.pathname)?.label || 'Overview';
  return <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-only" onClick={onMenu} aria-label="Open navigation"><Menu size={19} /></button><div><span className="eyebrow">Workspace / {current}</span><h1>{current}</h1></div></div><div className="topbar-actions"><button className="search-chip" onClick={() => document.querySelector('.global-search-input')?.focus()} aria-label="Focus global search"><Search size={16} /><input className="global-search-input" placeholder="Search anything" aria-label="Search anything" /><kbd>⌘ K</kbd></button><button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><div className="popover-anchor"><button className="icon-button notification-button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Toggle notifications"><Bell size={18} /><span /></button><AnimatePresence>{notificationsOpen && <motion.div className="popover-motion" initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: .98 }}><Notifications /></motion.div>}</AnimatePresence></div><div className="popover-anchor"><button className="profile-trigger" onClick={() => setProfileOpen((value) => !value)} aria-label="Open profile menu"><span className="top-avatar">{getInitials(user.name)}</span><ChevronDown size={13} /></button><AnimatePresence>{profileOpen && <motion.div className="profile-popover" initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: .98 }}><div className="profile-popover-head"><span className="top-avatar">{getInitials(user.name)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div><button onClick={() => { setProfileOpen(false); navigate('/settings'); }}>Profile & settings <ChevronRight size={13} /></button><button className="logout-button" onClick={() => { setProfileOpen(false); navigate('/login', { replace: true }); logout(); }}>Log out <LogOut size={13} /></button><span className="popover-note">Frontend demo · Local browser storage</span></motion.div>}</AnimatePresence></div></div></header>;
}

export function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  return <div className="app-shell"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="main-shell"><Topbar onMenu={() => setSidebarOpen(true)} /><AnimatePresence mode="wait"><motion.main key={location.pathname} className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .22, ease: 'easeOut' }}>{children}</motion.main></AnimatePresence></div>{sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}</div>;
}

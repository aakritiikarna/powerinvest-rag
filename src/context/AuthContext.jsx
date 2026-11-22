import { createContext, useContext, useMemo, useState } from 'react';

// DEMO AUTHENTICATION ONLY.
// Accounts and sessions live in this browser's storage and passwords are stored as plain text.
// This is fine for a frontend demo but must never be used for a real product.
// A real app would send credentials to a backend that hashes passwords and issues secure sessions.

const USERS_KEY = 'powerinvest-users';
const SESSION_KEY = 'powerinvest-session';

export const DEMO_CREDENTIALS = { name: 'Demo Investor', email: 'demo@powerinvest.com', password: 'Demo@1234' };

const AuthContext = createContext(null);

function read(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked (for example in private mode); the app keeps working for this visit.
  }
}

function remove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

function getStoredUsers() {
  const users = read(window.localStorage, USERS_KEY);
  return Array.isArray(users) ? users : [];
}

function findAccount(email) {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_CREDENTIALS.email) return DEMO_CREDENTIALS;
  return getStoredUsers().find((account) => account.email === normalized);
}

function readSession() {
  const session = read(window.localStorage, SESSION_KEY) || read(window.sessionStorage, SESSION_KEY);
  return session && typeof session.email === 'string' ? session : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const value = useMemo(() => ({
    user,
    login({ email, password, remember }) {
      const account = findAccount(email);
      if (!account || account.password !== password) return { ok: false, error: 'Incorrect email or password. Please try again.' };
      const session = { name: account.name, email: account.email };
      remove(window.localStorage, SESSION_KEY);
      remove(window.sessionStorage, SESSION_KEY);
      // "Remember me" keeps the session across browser restarts; otherwise it ends with the tab.
      write(remember ? window.localStorage : window.sessionStorage, SESSION_KEY, session);
      setUser(session);
      return { ok: true };
    },
    signup({ name, email, password }) {
      if (findAccount(email)) return { ok: false, field: 'email', error: 'An account with this email already exists.' };
      write(window.localStorage, USERS_KEY, [...getStoredUsers(), { name: name.trim(), email: email.trim().toLowerCase(), password }]);
      return { ok: true };
    },
    logout() {
      remove(window.localStorage, SESSION_KEY);
      remove(window.sessionStorage, SESSION_KEY);
      setUser(null);
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

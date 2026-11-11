import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

const DONOR_NAV = [
  { to: '/donor', label: 'Dashboard', end: true },
  { to: '/donor/add-food', label: 'Add Food' },
  { to: '/donor/listings', label: 'My Food Listings' },
  { to: '/donor/requests', label: 'Incoming Requests' },
  { to: '/donor/browse', label: 'Browse Food' },
  { to: '/donor/history', label: 'Donation History' },
  { to: '/donor/profile', label: 'My Profile' },
];

const RECIPIENT_NAV = [
  { to: '/recipient', label: 'Dashboard', end: true },
  { to: '/recipient/requests', label: 'My Requests' },
  { to: '/recipient/history', label: 'Donation History' },
  { to: '/recipient/profile', label: 'My Profile' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = user.role === 'Donor' ? DONOR_NAV : RECIPIENT_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <nav className="flex h-full flex-col bg-brand-900 p-5 text-brand-50" aria-label="Main navigation">
      <Logo to={user.role === 'Donor' ? '/donor' : '/recipient'} light />
      <div className="mt-6 rounded-xl bg-brand-800 p-3">
        <p className="truncate text-sm font-semibold">{user.full_name}</p>
        <p className="text-xs text-brand-200">{user.role}</p>
      </div>
      <ul className="mt-6 flex-1 space-y-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white text-brand-800' : 'text-brand-100 hover:bg-brand-800'}`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <button type="button" onClick={handleLogout} className="mt-4 rounded-xl border border-brand-600 px-3.5 py-2.5 text-left text-sm font-medium text-brand-100 hover:bg-brand-800">
        Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">{sidebar}</div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-sm lg:hidden">
        <Logo to={user.role === 'Donor' ? '/donor' : '/recipient'} />
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-brand-800 hover:bg-brand-50" aria-label="Open menu">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar}</div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1f6f46" />
      <circle cx="32" cy="32" r="17" fill="#fff" />
      <circle cx="32" cy="32" r="11" fill="#1f6f46" />
      <path d="M32 24c4 2 5 6 3 10-4-1-6-5-3-10z" fill="#f4c15a" />
    </svg>
  );
}

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="SharePlate home">
      <LogoMark />
      <span className={`font-display text-xl font-bold ${light ? 'text-white' : 'text-brand-800'}`}>SharePlate</span>
    </Link>
  );
}

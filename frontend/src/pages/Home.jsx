import { Link, useNavigate } from 'react-router-dom';
import Logo, { LogoMark } from '../components/Logo.jsx';
import { homePathFor, useAuth } from '../context/AuthContext.jsx';

function HeroArt() {
  return (
    <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-md" role="img" aria-label="A shared plate of food">
      <circle cx="200" cy="200" r="190" fill="#1a5a3a" />
      <circle cx="200" cy="200" r="160" fill="#2f8a59" opacity=".55" />
      <circle cx="200" cy="200" r="132" fill="#fff" />
      <circle cx="200" cy="200" r="104" fill="#edf7f0" stroke="#d6edde" strokeWidth="4" />
      <path d="M200 120c34 18 42 52 22 84-36-8-52-46-22-84z" fill="#4ca775" />
      <path d="M200 140c4 22 2 44-6 66" stroke="#1a5a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="148" cy="236" r="22" fill="#f0b03a" />
      <circle cx="258" cy="244" r="18" fill="#d8941c" />
      <circle cx="226" cy="262" r="12" fill="#f4c15a" />
      <circle cx="172" cy="170" r="9" fill="#d94f3d" />
      <circle cx="300" cy="86" r="26" fill="#f4c15a" />
      <path d="M288 88l8 8 16-18" stroke="#1a5a3a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEPS = [
  ['Register', 'Create a free account as a donor or a recipient.'],
  ['Share or Find Food', 'Donors post surplus food. Recipients browse what is nearby.'],
  ['Request or Approve', 'Recipients request a quantity and donors approve or reject.'],
  ['Complete Donation', 'Collect the food, mark it complete and keep the record.'],
];

const FEATURES = [
  ['Easy Food Donation', 'Post quantity, pickup address and deadline in under a minute.'],
  ['Find Available Food', 'Search and filter live listings by name, category or location.'],
  ['Simple Request Management', 'Approve, reject and track every request in one dashboard.'],
  ['Reduce Food Waste', 'Edible food reaches people before it expires, not the bin.'],
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const go = (role) => navigate(user ? homePathFor(user) : `/register?role=${role}`);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <nav className="order-3 flex w-full items-center justify-center gap-6 text-sm font-medium text-gray-700 sm:order-none sm:w-auto" aria-label="Primary">
            <Link to="/" className="hover:text-brand-700">Home</Link>
            <a href="#about" className="hover:text-brand-700">About Us</a>
            <a href="#how-it-works" className="hover:text-brand-700">How It Works</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to={homePathFor(user)} className="btn-primary btn-sm">Go to dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-outline btn-sm">Login</Link>
                <Link to="/register" className="btn-primary btn-sm">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="bg-brand-800 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">Share Food, Spread Happiness.</h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">
              Restaurants, shops and households throw away good food every day while people nearby go hungry.
              SharePlate connects the two, so surplus meals reach the people who need them.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => go('Donor')} className="btn bg-saffron-500 px-6 py-3 text-ink hover:bg-saffron-400">Donate Food</button>
              <button type="button" onClick={() => go('Recipient')} className="btn border border-white/70 px-6 py-3 text-white hover:bg-white/10">Find Food</button>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">About SharePlate</h2>
            <p className="mt-4 text-gray-700">
              SharePlate is a web platform that makes surplus food donation organised and transparent. Donors publish
              what they have left, recipients such as NGOs, charities and individuals request what they need, and
              every step is recorded.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              'Less edible food is wasted',
              'Communities get faster access to meals',
              'Donors see exactly where their food went',
            ].map((b) => (
              <li key={b} className="card flex items-center gap-3 p-4">
                <LogoMark className="h-7 w-7 shrink-0" />
                <span className="font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="rounded-2xl border border-gray-200 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-display font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">Step {i + 1}: {title}</h3>
                <p className="mt-1 text-sm text-gray-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">Features</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {FEATURES.map(([title, text]) => (
            <div key={title} className="card p-6">
              <h3 className="text-lg font-semibold text-brand-800">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-brand-900 text-brand-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <Logo light />
            <p className="mt-3 text-sm">Share Food, Spread Happiness. A surplus food donation and redistribution platform.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white">Navigate</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><a href="#about" className="hover:text-white">About Us</a></li>
              <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
              <li><Link to="/register" className="hover:text-white">Register</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white">Contact</h3>
            <p className="mt-3 text-sm">hello@shareplate.example</p>
            <p className="text-sm">+00 000 000 0000</p>
            <p className="mt-3 text-xs text-brand-300">Donors and recipients are responsible for the safety and handling of donated food.</p>
          </div>
        </div>
        <div className="border-t border-brand-800 py-4 text-center text-xs text-brand-300">© {new Date().getFullYear()} SharePlate. All rights reserved.</div>
      </footer>
    </div>
  );
}

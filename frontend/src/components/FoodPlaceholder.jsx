export default function FoodPlaceholder({ className = '' }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="h-2/3 max-h-28 w-2/3 max-w-28">
        <circle cx="60" cy="60" r="48" fill="#fff" stroke="#aedabe" strokeWidth="3" />
        <circle cx="60" cy="60" r="32" fill="#edf7f0" stroke="#d6edde" strokeWidth="2" />
        <path d="M60 40c9 5 11 14 6 22-9-2-13-12-6-22z" fill="#4ca775" />
        <circle cx="46" cy="68" r="6" fill="#f0b03a" />
        <circle cx="74" cy="70" r="5" fill="#d8941c" />
      </svg>
    </div>
  );
}

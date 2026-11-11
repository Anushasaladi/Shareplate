export default function EmptyState({ title, message, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <svg viewBox="0 0 64 64" className="mb-4 h-14 w-14" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="#edf7f0" />
        <circle cx="32" cy="32" r="16" fill="#fff" stroke="#aedabe" strokeWidth="2" />
        <circle cx="32" cy="32" r="9" fill="#d6edde" />
      </svg>
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

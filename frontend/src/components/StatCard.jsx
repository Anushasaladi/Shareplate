export default function StatCard({ label, value, tone = 'brand' }) {
  const tones = {
    brand: 'text-brand-700',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
    ink: 'text-ink',
  };
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${tones[tone]}`}>{value ?? '–'}</p>
    </div>
  );
}

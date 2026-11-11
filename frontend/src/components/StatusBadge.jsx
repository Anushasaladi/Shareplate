const STYLES = {
  Available: 'bg-brand-100 text-brand-800',
  'Partially Reserved': 'bg-amber-100 text-amber-800',
  'Fully Reserved': 'bg-orange-100 text-orange-800',
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-blue-100 text-blue-800',
  Completed: 'bg-brand-100 text-brand-800',
  Rejected: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-200 text-gray-700',
  Expired: 'bg-gray-200 text-gray-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { historyApi } from '../services/api.js';
import { fmtDate, fmtQty } from '../utils/format.js';
import useFetch from '../utils/useFetch.js';

export default function DonationHistory() {
  const { user } = useAuth();
  const isDonor = user.role === 'Donor';
  const { data, loading, error, reload } = useFetch(() => (isDonor ? historyApi.donations() : historyApi.requests()), []);

  return (
    <>
      <PageHeader
        title="Donation History"
        subtitle={isDonor ? 'Donations you have completed.' : 'Your finished requests and the food you received.'}
      />
      <ErrorMessage message={error} onRetry={reload} />
      {loading ? <Spinner /> : data.length === 0 ? (
        <EmptyState title="Nothing here yet" message={isDonor ? 'Completed donations will be recorded here.' : 'Completed, rejected and cancelled requests will be recorded here.'} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Food</th>
                <th className="px-4 py-3">{isDonor ? 'Recipient' : 'Donor'}</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Requested on</th>
                <th className="px-4 py-3">Completed on</th>
                <th className="px-4 py-3">Final status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((r) => (
                <tr key={r.request_id}>
                  <td className="px-4 py-3 font-medium">{r.food_name}</td>
                  <td className="px-4 py-3">{isDonor ? r.recipient_name : r.donor_name}</td>
                  <td className="px-4 py-3">{fmtQty(r.requested_quantity)} {r.unit}</td>
                  <td className="px-4 py-3">{fmtDate(r.request_date)}</td>
                  <td className="px-4 py-3">{r.completed_at ? fmtDate(r.completed_at) : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.request_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

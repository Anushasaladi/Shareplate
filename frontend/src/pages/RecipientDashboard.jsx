import { Link } from 'react-router-dom';
import BrowseFood from '../components/BrowseFood.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardApi, requestsApi } from '../services/api.js';
import { fmtDateTime, fmtQty } from '../utils/format.js';
import useFetch from '../utils/useFetch.js';

export default function RecipientDashboard() {
  const { user } = useAuth();
  const stats = useFetch(dashboardApi.recipient);
  const reqs = useFetch(() => requestsApi.mine(), []);

  return (
    <>
      <PageHeader title={`Welcome, ${user.full_name.split(' ')[0]}`} subtitle="Find surplus food near you and request what you need." />
      <ErrorMessage message={stats.error} onRetry={stats.reload} />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available Food" value={stats.data?.available_food} />
        <StatCard label="Pending Requests" value={stats.data?.pending_requests} tone="amber" />
        <StatCard label="Approved Requests" value={stats.data?.approved_requests} tone="blue" />
        <StatCard label="Completed Donations" value={stats.data?.completed_donations} tone="ink" />
      </div>

      <BrowseFood detailsBase="/recipient/foods" />

      <section className="mt-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">My Requests</h2>
          <Link to="/recipient/requests" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
        </div>
        <ErrorMessage message={reqs.error} onRetry={reqs.reload} />
        {reqs.loading ? <Spinner /> : reqs.data.length === 0 ? (
          <EmptyState title="No requests yet" message="Open a food listing and request the quantity you need." />
        ) : (
          <div className="card divide-y divide-gray-100">
            {reqs.data.slice(0, 5).map((r) => (
              <div key={r.request_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{r.food_name}</p>
                  <p className="text-sm text-gray-500">{fmtQty(r.requested_quantity)} {r.unit} · {fmtDateTime(r.request_date)}</p>
                </div>
                <StatusBadge status={r.request_status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

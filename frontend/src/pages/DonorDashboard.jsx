import { Link } from 'react-router-dom';
import DonorRequestActions from '../components/DonorRequestActions.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FoodPlaceholder from '../components/FoodPlaceholder.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardApi, foodsApi, imageUrl, requestsApi } from '../services/api.js';
import { fmtDateTime, fmtQty } from '../utils/format.js';
import useFetch from '../utils/useFetch.js';

export default function DonorDashboard() {
  const { user } = useAuth();
  const stats = useFetch(dashboardApi.donor);
  const listings = useFetch(() => foodsApi.mine(), []);
  const pending = useFetch(() => requestsApi.incoming({ status: 'Pending' }), []);

  const refreshAll = () => { stats.reload(); listings.reload(); pending.reload(); };

  return (
    <>
      <PageHeader
        title={`Hello, ${user.full_name.split(' ')[0]}`}
        subtitle="Here is what is happening with your donations."
        action={<Link to="/donor/add-food" className="btn-primary">+ Add Food</Link>}
      />
      <ErrorMessage message={stats.error} onRetry={stats.reload} />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Listings" value={stats.data?.total_listings} />
        <StatCard label="Available Food" value={stats.data?.available_listings} tone="brand" />
        <StatCard label="Pending Requests" value={stats.data?.pending_requests} tone="amber" />
        <StatCard label="Completed Donations" value={stats.data?.completed_donations} tone="blue" />
      </div>

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent food listings</h2>
          <Link to="/donor/listings" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
        </div>
        <ErrorMessage message={listings.error} onRetry={listings.reload} />
        {listings.loading ? <Spinner /> : listings.data.length === 0 ? (
          <EmptyState title="No listings yet" message="Post your first surplus food listing so recipients can find it." action={<Link to="/donor/add-food" className="btn-primary">Add Food</Link>} />
        ) : (
          <div className="card divide-y divide-gray-100">
            {listings.data.slice(0, 5).map((f) => (
              <div key={f.food_id} className="flex flex-wrap items-center gap-4 p-4">
                {f.image_url ? <img src={imageUrl(f.image_url)} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <FoodPlaceholder className="h-14 w-14 rounded-xl" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{f.food_name}</p>
                  <p className="truncate text-sm text-gray-500">{fmtQty(f.remaining_quantity)} / {fmtQty(f.quantity)} {f.unit} · {f.pickup_location}</p>
                </div>
                <StatusBadge status={f.listing_status} />
                <Link to={`/donor/foods/${f.food_id}/edit`} className="btn-outline btn-sm">Edit</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent incoming requests</h2>
          <Link to="/donor/requests" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
        </div>
        <ErrorMessage message={pending.error} onRetry={pending.reload} />
        {pending.loading ? <Spinner /> : pending.data.length === 0 ? (
          <EmptyState title="No pending requests" message="When a recipient requests your food it will show up here." />
        ) : (
          <div className="card divide-y divide-gray-100">
            {pending.data.slice(0, 5).map((r) => (
              <div key={r.request_id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.recipient_name} <span className="font-normal text-gray-500">requested</span> {fmtQty(r.requested_quantity)} {r.unit} of {r.food_name}</p>
                  <p className="text-sm text-gray-500">{fmtDateTime(r.request_date)}</p>
                </div>
                <div className="flex gap-2"><DonorRequestActions request={r} onChanged={refreshAll} /></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FoodPlaceholder from '../components/FoodPlaceholder.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { foodsApi, getErrorMessage, imageUrl } from '../services/api.js';
import { LISTING_STATUSES } from '../utils/constants.js';
import { fmtDateTime, fmtQty } from '../utils/format.js';
import useFetch from '../utils/useFetch.js';

export default function MyListings() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const { data, loading, error, reload } = useFetch(() => foodsApi.mine(), []);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = filter ? data.filter((f) => f.listing_status === filter) : data;

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await foodsApi.remove(toDelete.food_id);
      toast.success('Listing cancelled. Pending requests were rejected.');
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      reload();
    }
  };

  return (
    <>
      <PageHeader
        title="My Food Listings"
        subtitle="Manage everything you have posted."
        action={<Link to="/donor/add-food" className="btn-primary">+ Add Food</Link>}
      />
      <div className="mb-4 max-w-xs">
        <label className="label" htmlFor="status-filter">Filter by status</label>
        <select id="status-filter" className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {LISTING_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState title="No listings found" message={filter ? 'No listing has this status.' : 'Post surplus food to get started.'} action={!filter && <Link to="/donor/add-food" className="btn-primary">Add Food</Link>} />
      ) : (
        <div className="space-y-3">
          {rows.map((f) => {
            const editable = !['Completed', 'Expired', 'Cancelled'].includes(f.listing_status);
            return (
              <article key={f.food_id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {f.image_url ? <img src={imageUrl(f.image_url)} alt="" className="h-24 w-full rounded-xl object-cover sm:w-32" /> : <FoodPlaceholder className="h-24 w-full rounded-xl sm:w-32" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{f.food_name}</h3>
                    <StatusBadge status={f.listing_status} />
                    {f.pending_request_count > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{f.pending_request_count} pending</span>}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{f.category} · {fmtQty(f.remaining_quantity)} of {fmtQty(f.quantity)} {f.unit} left</p>
                  <p className="truncate text-sm text-gray-500">{f.pickup_location}</p>
                  <p className="text-sm text-gray-500">Pickup deadline: {fmtDateTime(f.available_until)}</p>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  {editable && <Link to={`/donor/foods/${f.food_id}/edit`} className="btn-outline btn-sm">Edit</Link>}
                  {editable && <button type="button" className="btn-danger-outline btn-sm" onClick={() => setToDelete(f)}>Delete</button>}
                  <Link to={`/donor/foods/${f.food_id}`} className="btn-ghost btn-sm">View</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        busy={busy}
        title="Delete this listing?"
        message={`“${toDelete?.food_name}” will be withdrawn and any pending requests rejected. It stays in your records.`}
        confirmLabel="Delete listing"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

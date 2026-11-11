import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FoodPlaceholder from '../components/FoodPlaceholder.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { foodsApi, getErrorMessage, imageUrl, requestsApi } from '../services/api.js';
import { fmtDateTime, fmtQty, timeLeft } from '../utils/format.js';
import useFetch from '../utils/useFetch.js';

export default function FoodDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: food, loading, error, reload } = useFetch(() => foodsApi.get(id));
  const [qty, setQty] = useState('');
  const [qtyError, setQtyError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRecipient = user.role === 'Recipient';
  const backTo = isRecipient ? '/recipient' : '/donor/browse';

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const img = imageUrl(food.image_url);
  const open = ['Available', 'Partially Reserved'].includes(food.listing_status) && new Date(food.available_until) > new Date();
  const isOwner = user.user_id === food.donor_id;

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(qty);
    if (!(n > 0)) return setQtyError('Enter a quantity greater than zero');
    if (n > food.remaining_quantity) return setQtyError(`Only ${fmtQty(food.remaining_quantity)} ${food.unit} available`);
    setQtyError('');
    setBusy(true);
    try {
      await requestsApi.create({ food_id: food.food_id, requested_quantity: n });
      toast.success('Request submitted. The donor will review it.');
      navigate('/recipient/requests');
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    } finally {
      setBusy(false);
    }
  };

  const info = [
    ['Category', food.category],
    ['Available quantity', `${fmtQty(food.remaining_quantity)} of ${fmtQty(food.quantity)} ${food.unit}`],
    ['Pickup location', food.pickup_location],
    ['Prepared', food.prepared_at ? fmtDateTime(food.prepared_at) : 'Not specified'],
    ['Available from', food.available_from ? fmtDateTime(food.available_from) : 'Now'],
    ['Pickup deadline', `${fmtDateTime(food.available_until)} (${timeLeft(food.available_until)})`],
  ];

  return (
    <>
      <Link to={backTo} className="mb-4 inline-block text-sm font-semibold text-brand-700 hover:underline">← Back</Link>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {img ? <img src={img} alt={food.food_name} className="h-72 w-full rounded-2xl object-cover shadow-card sm:h-96" /> : <FoodPlaceholder className="h-72 w-full rounded-2xl sm:h-96" />}
          <div className="card mt-5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">{food.food_name}</h1>
              <StatusBadge status={food.listing_status} />
            </div>
            <p className="mt-3 whitespace-pre-line text-gray-700">{food.description}</p>
            <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{k}</dt><dd className="mt-0.5 text-sm font-medium">{v}</dd></div>
              ))}
            </dl>
          </div>
        </div>

        <aside className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <h2 className="text-lg font-bold">Donor</h2>
            <p className="mt-2 font-medium">{food.donor_name}</p>
            {food.donor_address && <p className="text-sm text-gray-500">{food.donor_address}</p>}
            <p className="mt-2 text-xs text-gray-500">Contact details are shared once your request is approved.</p>
          </div>

          {isRecipient && (
            <form onSubmit={submit} noValidate className="card p-5">
              <h2 className="text-lg font-bold">Request this food</h2>
              {open ? (
                <>
                  <label className="label mt-3" htmlFor="qty">Request quantity ({food.unit})</label>
                  <input id="qty" type="number" min="0" step="0.01" max={food.remaining_quantity} className={`input ${qtyError ? 'input-error' : ''}`} value={qty} onChange={(e) => setQty(e.target.value)} placeholder={`Up to ${fmtQty(food.remaining_quantity)}`} />
                  {qtyError && <p className="field-error">{qtyError}</p>}
                  <button type="submit" className="btn-primary mt-4 w-full" disabled={busy}>{busy ? 'Submitting…' : 'Request Food'}</button>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-600">This listing is {food.listing_status.toLowerCase()} and no longer accepts requests.</p>
              )}
            </form>
          )}
          {isOwner && (
            <Link to={`/donor/foods/${food.food_id}/edit`} className="btn-outline w-full">Edit this listing</Link>
          )}
        </aside>
      </div>
    </>
  );
}

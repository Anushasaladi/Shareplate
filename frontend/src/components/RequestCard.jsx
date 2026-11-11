import { imageUrl } from '../services/api.js';
import { fmtDateTime, fmtQty } from '../utils/format.js';
import FoodPlaceholder from './FoodPlaceholder.jsx';
import StatusBadge from './StatusBadge.jsx';

/** One request row. `view` is "donor" (listing owner) or "recipient". Actions passed as children. */
export default function RequestCard({ request: r, view, children }) {
  const img = imageUrl(r.food_image_url);
  const collectionVisible = view === 'recipient' && ['Approved', 'Completed'].includes(r.request_status);
  return (
    <article className="card flex flex-col gap-4 p-4 sm:flex-row">
      {img ? (
        <img src={img} alt="" className="h-28 w-full rounded-xl object-cover sm:w-36" />
      ) : (
        <FoodPlaceholder className="h-28 w-full rounded-xl sm:w-36" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">{r.food_name}</h3>
          <StatusBadge status={r.request_status} />
        </div>
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div><dt className="inline text-gray-500">Quantity: </dt><dd className="inline font-semibold">{fmtQty(r.requested_quantity)} {r.unit}</dd></div>
          <div><dt className="inline text-gray-500">Requested: </dt><dd className="inline">{fmtDateTime(r.request_date)}</dd></div>
          {view === 'donor' ? (
            <>
              <div><dt className="inline text-gray-500">Recipient: </dt><dd className="inline font-medium">{r.recipient_name}</dd></div>
              <div><dt className="inline text-gray-500">Contact: </dt><dd className="inline">{r.recipient_phone}{r.recipient_email ? ` · ${r.recipient_email}` : ''}</dd></div>
            </>
          ) : (
            <div><dt className="inline text-gray-500">Donor: </dt><dd className="inline font-medium">{r.donor_name}</dd></div>
          )}
        </dl>
        {collectionVisible && (
          <div className="mt-3 rounded-xl bg-brand-50 p-3 text-sm">
            <p className="font-semibold text-brand-800">Collection details</p>
            <p className="mt-0.5">Pickup address: {r.pickup_location}</p>
            <p>Contact the donor: {r.donor_phone}{r.donor_email ? ` · ${r.donor_email}` : ''}</p>
            {r.request_status === 'Approved' && <p>Collect before: {fmtDateTime(r.available_until)}</p>}
          </div>
        )}
        {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
      </div>
    </article>
  );
}

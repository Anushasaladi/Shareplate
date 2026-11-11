import { Link } from 'react-router-dom';
import { imageUrl } from '../services/api.js';
import { fmtDateTime, fmtQty, timeLeft } from '../utils/format.js';
import FoodPlaceholder from './FoodPlaceholder.jsx';

export default function FoodCard({ food, to }) {
  const img = imageUrl(food.image_url);
  return (
    <article className="card flex flex-col overflow-hidden">
      {img ? (
        <img src={img} alt={food.food_name} loading="lazy" className="h-44 w-full object-cover" />
      ) : (
        <FoodPlaceholder className="h-44 w-full" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-snug">{food.food_name}</h3>
          <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{food.category}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">{food.description}</p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Available</dt>
            <dd className="font-semibold">{fmtQty(food.remaining_quantity)} {food.unit}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Pickup</dt>
            <dd className="truncate text-right" title={food.pickup_location}>{food.pickup_location}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Deadline</dt>
            <dd className="text-right">{fmtDateTime(food.available_until)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs font-semibold text-saffron-600">{timeLeft(food.available_until)}</p>
        <Link to={to} className="btn-primary mt-4 w-full">View Details</Link>
      </div>
    </article>
  );
}

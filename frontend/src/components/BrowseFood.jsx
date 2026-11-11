import { useCallback, useEffect, useState } from 'react';
import { foodsApi, getErrorMessage } from '../services/api.js';
import { CATEGORIES } from '../utils/constants.js';
import EmptyState from './EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import FoodCard from './FoodCard.jsx';
import Spinner from './Spinner.jsx';

/** Search bar + category filters + grid of available food. Used by both roles. */
export default function BrowseFood({ detailsBase }) {
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (location.trim()) params.location = location.trim();
      if (category) params.category = category;
      setFoods(await foodsApi.browse(params));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [q, location, category]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce typing
    return () => clearTimeout(t);
  }, [load]);

  const filtered = Boolean(q || location || category);

  return (
    <section aria-labelledby="browse-heading">
      <h2 id="browse-heading" className="mb-3 text-xl font-bold">Available food</h2>
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2">
        <input className="input" type="search" placeholder="Search food by name…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search food" />
        <input className="input" type="search" placeholder="Filter by pickup location…" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Filter by location" />
      </div>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Category filters">
        {['', ...CATEGORIES].map((c) => (
          <button
            key={c || 'all'}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              category === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-brand-400'
            }`}
          >
            {c || 'All'}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} onRetry={load} />
      {loading ? (
        <Spinner />
      ) : !error && foods.length === 0 ? (
        <EmptyState
          title={filtered ? 'No food matches your search' : 'No food available right now'}
          message={filtered ? 'Try a different name, category or location.' : 'New listings appear here as soon as donors post them. Check back soon.'}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {foods.map((f) => <FoodCard key={f.food_id} food={f} to={`${detailsBase}/${f.food_id}`} />)}
        </div>
      )}
    </section>
  );
}

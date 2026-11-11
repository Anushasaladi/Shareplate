import { useState } from 'react';
import DonorRequestActions from '../components/DonorRequestActions.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import RequestCard from '../components/RequestCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { requestsApi } from '../services/api.js';
import useFetch from '../utils/useFetch.js';

const TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];

export default function IncomingRequests() {
  const { data, loading, error, reload } = useFetch(() => requestsApi.incoming(), []);
  const [tab, setTab] = useState('Pending');
  const rows = tab === 'All' ? data : data.filter((r) => r.request_status === tab);
  const count = (t) => (t === 'All' ? data.length : data.filter((r) => r.request_status === t).length);

  return (
    <>
      <PageHeader title="Incoming Requests" subtitle="Review requests for your food listings." />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${tab === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white hover:border-brand-400'}`}>
            {t} <span className="opacity-70">({count(t)})</span>
          </button>
        ))}
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState title={`No ${tab === 'All' ? '' : tab.toLowerCase() + ' '}requests`} message="Requests from recipients will appear here." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <RequestCard key={r.request_id} request={r} view="donor">
              <DonorRequestActions request={r} onChanged={reload} />
            </RequestCard>
          ))}
        </div>
      )}
    </>
  );
}

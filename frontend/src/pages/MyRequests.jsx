import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import RequestCard from '../components/RequestCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage, requestsApi } from '../services/api.js';
import useFetch from '../utils/useFetch.js';

const TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];

export default function MyRequests() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => requestsApi.mine(), []);
  const [tab, setTab] = useState('All');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = tab === 'All' ? data : data.filter((r) => r.request_status === tab);

  const cancel = async () => {
    setBusy(true);
    try {
      await requestsApi.cancel(target.request_id);
      toast.success('Request cancelled.');
      setTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      reload();
    }
  };

  return (
    <>
      <PageHeader title="My Requests" subtitle="Track the progress of every food request you made." />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${tab === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white hover:border-brand-400'}`}>
            {t}
          </button>
        ))}
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState title="No requests here" message="Browse available food from your dashboard and request what you need." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <RequestCard key={r.request_id} request={r} view="recipient">
              {r.request_status === 'Pending' && (
                <button type="button" className="btn-danger-outline btn-sm" onClick={() => setTarget(r)}>Cancel request</button>
              )}
            </RequestCard>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(target)}
        danger
        busy={busy}
        title="Cancel this request?"
        message={`Your pending request for ${target?.food_name} will be cancelled.`}
        confirmLabel="Cancel request"
        onConfirm={cancel}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}

import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage, requestsApi } from '../services/api.js';
import ConfirmDialog from './ConfirmDialog.jsx';

/** Approve / Reject (pending) and "Mark as collected" (approved) buttons for a donor. */
export default function DonorRequestActions({ request, onChanged }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const run = async (fn, okMessage) => {
    setBusy(true);
    try {
      await fn(request.request_id);
      toast.success(okMessage);
      setConfirmComplete(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      onChanged();   // always refresh: state may have changed on the server
    }
  };

  if (request.request_status === 'Pending') {
    return (
      <>
        <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => run(requestsApi.approve, 'Request approved. Food quantity reserved.')}>Approve</button>
        <button type="button" className="btn-danger-outline btn-sm" disabled={busy} onClick={() => run(requestsApi.reject, 'Request rejected.')}>Reject</button>
      </>
    );
  }
  if (request.request_status === 'Approved') {
    return (
      <>
        <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => setConfirmComplete(true)}>Mark as collected</button>
        <ConfirmDialog
          open={confirmComplete}
          title="Mark donation as completed?"
          message={`Confirm that ${request.recipient_name} has collected ${request.food_name}. This cannot be undone.`}
          confirmLabel="Yes, completed"
          busy={busy}
          onConfirm={() => run(requestsApi.complete, 'Donation marked as completed.')}
          onCancel={() => setConfirmComplete(false)}
        />
      </>
    );
  }
  return null;
}

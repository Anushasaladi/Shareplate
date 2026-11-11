import { useState } from 'react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage, imageUrl, uploadApi, usersApi } from '../services/api.js';
import { PHONE_RE, fmtDate } from '../utils/format.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const startEdit = () => {
    setForm({ full_name: user.full_name, phone: user.phone, address: user.address || '', profile_image_url: user.profile_image_url || '' });
    setErrors({});
    setServerError('');
    setEditing(true);
  };

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadApi.image(file);
      setForm((f) => ({ ...f, profile_image_url: url }));
    } catch (err) {
      setErrors((x) => ({ ...x, image: getErrorMessage(err) }));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.full_name.trim().length < 2) errs.full_name = 'Enter your full name';
    if (!PHONE_RE.test(form.phone.replace(/[\s\-()]/g, ''))) errs.phone = 'Enter a valid phone number';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setServerError('');
    try {
      const updated = await usersApi.update({
        full_name: form.full_name.trim(),
        phone: form.phone,
        address: form.address.trim(),
        profile_image_url: form.profile_image_url,
      });
      setUser(updated);
      setEditing(false);
      toast.success('Profile updated.');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const avatar = imageUrl(editing ? form.profile_image_url : user.profile_image_url);

  return (
    <>
      <PageHeader title="My Profile" action={!editing && <button type="button" className="btn-primary" onClick={startEdit}>Edit Profile</button>} />
      <div className="card max-w-2xl p-6">
        <div className="mb-6 flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 font-display text-3xl font-bold text-brand-700">{user.full_name[0]}</span>
          )}
          <div>
            <p className="text-xl font-bold">{user.full_name}</p>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">{user.role}</span>
            <p className="mt-1 text-xs text-gray-500">Member since {fmtDate(user.created_at)}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={save} noValidate className="space-y-5">
            <ErrorMessage message={serverError} />
            <div>
              <label className="label" htmlFor="pimg">Profile picture <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="pimg" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
              {errors.image && <p className="field-error">{errors.image}</p>}
            </div>
            <div>
              <label className="label" htmlFor="pname">Full name</label>
              <input id="pname" className={`input ${errors.full_name ? 'input-error' : ''}`} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              {errors.full_name && <p className="field-error">{errors.full_name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="pemail">Email address</label>
              <input id="pemail" className="input bg-gray-50" value={user.email} disabled />
            </div>
            <div>
              <label className="label" htmlFor="pphone">Phone number</label>
              <input id="pphone" className={`input ${errors.phone ? 'input-error' : ''}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              {errors.phone && <p className="field-error">{errors.phone}</p>}
            </div>
            <div>
              <label className="label" htmlFor="paddr">Address</label>
              <textarea id="paddr" rows={2} className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-outline" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        ) : (
          <dl className="space-y-4 text-sm">
            {[['Email address', user.email], ['Phone number', user.phone], ['Address', user.address || 'Not provided'], ['Role', user.role]].map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-3"><dt className="text-gray-500">{k}</dt><dd className="font-medium sm:col-span-2">{v}</dd></div>
            ))}
          </dl>
        )}
      </div>
    </>
  );
}

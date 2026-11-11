import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Logo from '../components/Logo.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi, getErrorMessage } from '../services/api.js';
import { EMAIL_RE, PHONE_RE } from '../utils/format.js';

const ROLES = [
  { value: 'Donor', title: 'Donor', text: 'I have surplus food to share' },
  { value: 'Recipient', title: 'Recipient', text: 'I need food or represent an NGO' },
];

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const initialRole = ROLES.some((r) => r.value === params.get('role')) ? params.get('role') : '';
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', address: '', password: '', confirm: '', role: initialRole,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.full_name.trim().length < 2) e.full_name = 'Enter your full name';
    if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address';
    if (!PHONE_RE.test(form.phone.replace(/[\s\-()]/g, ''))) e.phone = 'Enter a valid phone number (7–15 digits)';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'At least 8 characters with a letter and a number';
    }
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    if (!form.role) e.role = 'Choose how you want to use SharePlate';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await authApi.register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        address: form.address.trim() || null,
        password: form.password,
        role: form.role,
      });
      toast.success('Account created! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const text = (key, label, props = {}) => (
    <div>
      <label className="label" htmlFor={key}>{label}</label>
      <input id={key} className={`input ${errors[key] ? 'input-error' : ''}`} value={form[key]} onChange={set(key)} {...props} />
      {errors[key] && <p className="field-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <form onSubmit={submit} noValidate className="card space-y-5 p-7">
          <div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">It takes less than a minute.</p>
          </div>
          <ErrorMessage message={serverError} />
          <fieldset>
            <legend className="label">I am a…</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLES.map((r) => (
                <label key={r.value} className={`cursor-pointer rounded-xl border p-3.5 transition ${form.role === r.value ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200' : 'border-gray-300 hover:border-brand-400'}`}>
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set('role')} className="sr-only" />
                  <span className="block font-semibold">{r.title}</span>
                  <span className="block text-xs text-gray-500">{r.text}</span>
                </label>
              ))}
            </div>
            {errors.role && <p className="field-error">{errors.role}</p>}
          </fieldset>
          {text('full_name', 'Full name', { autoComplete: 'name', maxLength: 100 })}
          <div className="grid gap-5 sm:grid-cols-2">
            {text('email', 'Email address', { type: 'email', autoComplete: 'email' })}
            {text('phone', 'Phone number', { type: 'tel', autoComplete: 'tel', placeholder: '+91 98765 43210' })}
          </div>
          <div>
            <label className="label" htmlFor="address">Address <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea id="address" rows={2} className="input" value={form.address} onChange={set('address')} maxLength={500} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {text('password', 'Password', { type: 'password', autoComplete: 'new-password' })}
            {text('confirm', 'Confirm password', { type: 'password', autoComplete: 'new-password' })}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
          <p className="text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

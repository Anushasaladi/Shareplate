import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Logo from '../components/Logo.jsx';
import { homePathFor, useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { EMAIL_RE } from '../utils/format.js';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = {};
    if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Enter your password';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`);
      const from = location.state?.from;
      const allowed = from && from.startsWith(user.role === 'Donor' ? '/donor' : '/recipient');
      navigate(allowed ? from : homePathFor(user), { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <form onSubmit={submit} noValidate className="card space-y-5 p-7">
          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">Log in to share or find food.</p>
          </div>
          <ErrorMessage message={serverError} />
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" className={`input pr-16 ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute inset-y-0 right-3 text-xs font-semibold text-brand-700" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
          <p className="text-center text-sm text-gray-600">
            New to SharePlate? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

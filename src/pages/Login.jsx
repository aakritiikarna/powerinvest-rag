import { useState } from 'react';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { PasswordField, TextField } from '../components/auth/AuthFields';
import { DEMO_CREDENTIALS, useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/authHelpers';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [form, setForm] = useState({ email: location.state?.email || '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Signed-in visitors skip this page. This also handles the redirect right after a successful login.
  if (user) return <Navigate to={from} replace />;

  const update = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setFormError('');
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    setFormError('');
    setInfo('');
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    // Short delay so the button feedback is visible; there is no server request in this demo.
    setTimeout(() => {
      const result = login(form);
      if (!result.ok) { setFormError(result.error); setLoading(false); }
    }, 450);
  };

  const fillDemoAccount = () => {
    setForm((current) => ({ ...current, email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password }));
    setErrors({});
    setFormError('');
    setInfo('');
  };

  return (
    <AuthLayout title="Sign in to PowerInvest" subtitle="Welcome back. Enter your details to open your workspace." footer={<>New to PowerInvest? <Link to="/signup">Create an account</Link></>}>
      {location.state?.message && !formError && <div className="auth-alert success" role="status"><CheckCircle2 size={17} /><span>{location.state.message}</span></div>}
      {info && <div className="auth-alert info" role="status"><Info size={17} /><span>{info}</span></div>}
      {formError && <div className="auth-alert error" role="alert"><CircleAlert size={17} /><span>{formError}</span></div>}
      <form className="auth-form" onSubmit={submit} noValidate>
        <TextField id="login-email" name="email" type="email" label="Email address" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={update} error={errors.email} />
        <PasswordField id="login-password" name="password" label="Password" autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={update} error={errors.password}
          labelAction={<button type="button" className="auth-link" onClick={() => setInfo('Password reset is not available in this demo. Use the demo account below or create a new account.')}>Forgot password?</button>} />
        <label className="auth-check"><input type="checkbox" name="remember" checked={form.remember} onChange={update} /><span>Remember me</span></label>
        <button type="submit" className="button button-primary auth-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="demo-hint">
        <div><strong>Demo account</strong><span>{DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}</span></div>
        <button type="button" className="auth-link" onClick={fillDemoAccount}>Fill in</button>
      </div>
      <p className="auth-disclaimer">Frontend demo only. Accounts are saved in this browser and no data is sent to a server.</p>
    </AuthLayout>
  );
}

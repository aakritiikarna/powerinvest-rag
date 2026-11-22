import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { PasswordField, TextField } from '../components/auth/AuthFields';
import { useAuth } from '../context/AuthContext';
import { validateSignup } from '../utils/authHelpers';

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setFormError('');
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validateSignup(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    setTimeout(() => {
      const result = signup(form);
      if (!result.ok) {
        if (result.field) setErrors({ [result.field]: result.error }); else setFormError(result.error);
        setLoading(false);
        return;
      }
      navigate('/login', { replace: true, state: { message: 'Account created. Sign in to continue.', email: form.email.trim() } });
    }, 450);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Set up a demo workspace to start tracking your simulated portfolio." footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
      {formError && <div className="auth-alert error" role="alert"><CircleAlert size={17} /><span>{formError}</span></div>}
      <form className="auth-form" onSubmit={submit} noValidate>
        <TextField id="signup-name" name="name" label="Full name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={update} error={errors.name} />
        <TextField id="signup-email" name="email" type="email" label="Email address" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={update} error={errors.email} />
        <PasswordField id="signup-password" name="password" label="Password" autoComplete="new-password" placeholder="Create a password" hint="At least 8 characters, with a letter and a number." value={form.password} onChange={update} error={errors.password} />
        <PasswordField id="signup-confirm" name="confirmPassword" label="Confirm password" autoComplete="new-password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={update} error={errors.confirmPassword} />
        <button type="submit" className="button button-primary auth-submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="auth-disclaimer">Frontend demo only. Your account is saved in this browser and no data is sent to a server.</p>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import Logo from '../components/ui/Logo.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Icon from '../components/ui/Icon.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  useDocumentTitle('Create account');

  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Name is required';
    if (!form.email.trim()) er.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) er.email = 'Please provide a valid email';
    if (!form.password) er.password = 'Password is required';
    else if (form.password.length < 6) er.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) er.confirmPassword = 'Please confirm your password';
    else if (form.confirmPassword !== form.password) er.confirmPassword = 'Passwords do not match';
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = validate();
    if (Object.keys(er).length > 0) {
      setErrors(er);
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast('Account created — you can now log in');
      navigate('/login');
    } catch (err) {
      toast(getErrorMessage(err, 'Registration failed. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="auth-brand__inner">
          <Logo />
          <h1 className="auth-brand__title">Understand your money, effortlessly.</h1>
          <p className="auth-brand__subtitle">
            Track income and expenses, spot spending patterns and stay on top of your budget —
            all in one simple dashboard.
          </p>
          <ul className="auth-brand__features">
            <li>
              <Icon name="check-circle" size={16} /> Real-time income &amp; expense tracking
            </li>
            <li>
              <Icon name="check-circle" size={16} /> Insightful charts and analytics
            </li>
            <li>
              <Icon name="check-circle" size={16} /> Dark mode, CSV export and more
            </li>
          </ul>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-panel__top">
          <ThemeToggle />
        </div>
        <div className="auth-panel__inner">
          <div className="auth-heading">
            <h2 className="auth-heading__title">Create your account</h2>
            <p className="auth-heading__subtitle">
              Start tracking your money in under a minute
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Name"
              name="name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              placeholder="Your full name"
              autoComplete="name"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <div className="field">
              <label className="field__label" htmlFor="password">
                Password
              </label>
              <div className="input-with-icon">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input--error' : ''}`}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="icon-btn input-with-icon__toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
              {errors.password && (
                <p className="field__error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />

            <Button type="submit" loading={loading} size="lg" className="auth-form__submit">
              Create Account
            </Button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

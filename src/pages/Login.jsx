import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import Logo from '../components/ui/Logo.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Icon from '../components/ui/Icon.jsx';

export default function Login() {
  useDocumentTitle('Login');

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.email.trim()) er.email = 'Email is required';
    if (!form.password) er.password = 'Password is required';
    if (Object.keys(er).length > 0) {
      setErrors(er);
      return;
    }
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast(getErrorMessage(err, 'Login failed. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: 'demo@spendly.app', password: 'demo1234' });
    setErrors({});
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
            <h2 className="auth-heading__title">Welcome back</h2>
            <p className="auth-heading__subtitle">
              Log in to continue to your dashboard
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <Button type="submit" loading={loading} size="lg" className="auth-form__submit">
              Log In
            </Button>
          </form>

          <div className="demo-box">
            <div className="demo-box__header">
              <Icon name="user" size={16} />
              <span>Just exploring?</span>
            </div>
            <p className="demo-box__creds">
              demo@spendly.app · demo1234
            </p>
            <button type="button" className="demo-box__fill" onClick={fillDemo}>
              Fill demo credentials
            </button>
          </div>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

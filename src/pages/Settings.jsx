import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { userService } from '../services/userService.js';
import { getErrorMessage } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Icon from '../components/ui/Icon.jsx';

export default function Settings() {
  useDocumentTitle('Settings');
  const { user, logout, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDemo = user?.isDemo;

  // Profile
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passErrors, setPassErrors] = useState({});
  const [savingPass, setSavingPass] = useState(false);

  // Danger zone
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setProfileField = (field) => (e) => {
    const value = e.target.value;
    setProfile((p) => ({ ...p, [field]: value }));
    if (profileErrors[field]) setProfileErrors((er) => ({ ...er, [field]: undefined }));
  };

  const setPassField = (field) => (e) => {
    const value = e.target.value;
    setPass((p) => ({ ...p, [field]: value }));
    if (passErrors[field]) setPassErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!profile.name.trim()) er.name = 'Name is required';
    if (!profile.email.trim()) er.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      er.email = 'Please provide a valid email';
    }
    if (Object.keys(er).length > 0) {
      setProfileErrors(er);
      return;
    }
    setSavingProfile(true);
    try {
      const { data } = await userService.updateProfile({
        name: profile.name.trim(),
        email: profile.email.trim(),
      });
      setUser(data.user);
      toast('Profile updated');
    } catch (err) {
      toast(getErrorMessage(err, 'Could not update profile'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!pass.currentPassword) er.currentPassword = 'Current password is required';
    if (!pass.newPassword) er.newPassword = 'New password is required';
    else if (pass.newPassword.length < 6) er.newPassword = 'New password must be at least 6 characters';
    if (!pass.confirm) er.confirm = 'Please confirm your new password';
    else if (pass.confirm !== pass.newPassword) er.confirm = 'Passwords do not match';
    if (Object.keys(er).length > 0) {
      setPassErrors(er);
      return;
    }
    setSavingPass(true);
    try {
      await userService.changePassword({
        currentPassword: pass.currentPassword,
        newPassword: pass.newPassword,
      });
      toast('Password changed successfully');
      setPass({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast(getErrorMessage(err, 'Could not change password'), 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userService.deleteAccount();
      logout();
      toast('Your account has been deleted', 'info');
      navigate('/login', { replace: true });
    } catch (err) {
      toast(getErrorMessage(err, 'Could not delete your account'), 'error');
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast('You have been logged out', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <div className="page settings-page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Settings</h1>
          <p className="page__subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="card settings-card">
          <h3 className="settings-card__title">Profile</h3>
          <p className="settings-card__description">Update your name and email address.</p>
          {isDemo && (
            <p className="settings-card__description">
              This is a shared demo account — changing the email or password and deleting the
              account are disabled.
            </p>
          )}
          <form className="settings-form" onSubmit={handleProfileSubmit} noValidate>
            <Input
              label="Name"
              name="profile-name"
              value={profile.name}
              onChange={setProfileField('name')}
              error={profileErrors.name}
            />
            <Input
              label="Email"
              name="profile-email"
              type="email"
              value={profile.email}
              onChange={setProfileField('email')}
              error={profileErrors.email}
              disabled={isDemo}
            />
            <div className="settings-form__actions">
              <Button type="submit" loading={savingProfile}>
                Save Profile
              </Button>
            </div>
          </form>
        </section>

        {!isDemo && (
          <section className="card settings-card">
            <h3 className="settings-card__title">Password</h3>
            <p className="settings-card__description">Choose a strong password you don&apos;t use elsewhere.</p>
            <form className="settings-form" onSubmit={handlePasswordSubmit} noValidate>
              <Input
                label="Current Password"
                name="current-password"
                type="password"
                value={pass.currentPassword}
                onChange={setPassField('currentPassword')}
                error={passErrors.currentPassword}
                autoComplete="current-password"
              />
              <Input
                label="New Password"
                name="new-password"
                type="password"
                value={pass.newPassword}
                onChange={setPassField('newPassword')}
                error={passErrors.newPassword}
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                name="confirm-password"
                type="password"
                value={pass.confirm}
                onChange={setPassField('confirm')}
                error={passErrors.confirm}
                autoComplete="new-password"
              />
              <div className="settings-form__actions">
                <Button type="submit" loading={savingPass}>
                  Change Password
                </Button>
              </div>
            </form>
          </section>
        )}

        <section className="card settings-card">
          <h3 className="settings-card__title">Appearance</h3>
          <p className="settings-card__description">
            Choose a theme. Your preference is saved on this device.
          </p>
          <div className="theme-picker" role="group" aria-label="Theme">
            <button
              type="button"
              className={`theme-picker__btn ${theme === 'light' ? 'theme-picker__btn--active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <Icon name="sun" size={18} />
              Light
            </button>
            <button
              type="button"
              className={`theme-picker__btn ${theme === 'dark' ? 'theme-picker__btn--active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Icon name="moon" size={18} />
              Dark
            </button>
          </div>
        </section>

        <section className="card settings-card">
          <h3 className="settings-card__title">Session</h3>
          <p className="settings-card__description">
            You are logged in as <strong>{user?.email}</strong>.
          </p>
          <div className="settings-form__actions">
            <Button variant="secondary" icon="logout" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </section>

        {!isDemo && (
          <section className="card settings-card settings-card--danger">
            <h3 className="settings-card__title">Danger Zone</h3>
            <p className="settings-card__description">
              Permanently delete your account and all of your transactions. This cannot be undone.
            </p>
            <div className="settings-form__actions">
              <Button variant="danger-outline" icon="trash" onClick={() => setDeleteOpen(true)}>
                Delete Account
              </Button>
            </div>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        message="All of your transactions and data will be permanently removed. This action cannot be undone."
        confirmLabel="Delete My Account"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

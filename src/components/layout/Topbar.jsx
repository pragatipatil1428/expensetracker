import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../ui/Logo.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import Icon from '../ui/Icon.jsx';
import { initials } from '../../utils/format.js';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn topbar__menu"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Icon name="menu" size={20} />
      </button>
      <Logo />
      <div className="topbar__right">
        <ThemeToggle />
        <span className="avatar avatar--sm">{initials(user?.name)}</span>
      </div>
    </header>
  );
}

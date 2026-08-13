import Spinner from './Spinner.jsx';
import Icon from './Icon.jsx';

const VARIANTS = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
  'danger-outline': 'btn--danger-outline',
};

const SIZES = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}) {
  return (
    <button
      className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        icon && <Icon name={icon} size={16} />
      )}
      {children && <span>{children}</span>}
    </button>
  );
}

export default function Spinner({ size = 'md', className = '' }) {
  return <span className={`spinner spinner--${size} ${className}`} aria-hidden="true" />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <Spinner size="lg" />
      <p className="page-loader__label">{label}</p>
    </div>
  );
}

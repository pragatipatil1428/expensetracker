export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`card chart-card ${className}`}>
      <div className="chart-card__header">
        <h3 className="chart-card__title">{title}</h3>
        {subtitle && <p className="chart-card__subtitle">{subtitle}</p>}
      </div>
      <div className="chart-card__body">{children}</div>
    </div>
  );
}

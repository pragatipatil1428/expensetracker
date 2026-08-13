import Icon from '../ui/Icon.jsx';

const TONES = ['indigo', 'green', 'red', 'amber', 'sky'];

export default function StatCard({ label, value, sub, icon = 'wallet', tone = 'indigo', change }) {
  const toneClass = TONES.includes(tone) ? tone : 'indigo';
  const up = typeof change === 'number' ? change >= 0 : true;

  return (
    <div className="stat-card card">
      <div className={`stat-card__icon stat-card__icon--${toneClass}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
        <div className="stat-card__footer">
          {typeof change === 'number' && (
            <span
              className={`stat-card__change ${
                up ? 'stat-card__change--up' : 'stat-card__change--down'
              }`}
            >
              <Icon name={up ? 'trend-up' : 'trend-down'} size={14} />
              {Math.abs(change)}%
            </span>
          )}
          {sub && <span className="stat-card__sub">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

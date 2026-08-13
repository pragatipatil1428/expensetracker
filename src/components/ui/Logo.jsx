import Icon from './Icon.jsx';

export default function Logo({ compact = false }) {
  return (
    <span className="logo">
      <span className="logo__mark">
        <Icon name="rupee" size={17} />
      </span>
      {!compact && <span className="logo__text">Spendly</span>}
    </span>
  );
}

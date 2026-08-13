import Icon from './Icon.jsx';
import Button from './Button.jsx';

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}) {
  return (
    <div className="empty-state empty-state--error">
      <div className="empty-state__icon">
        <Icon name="alert-circle" size={26} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__description">{message}</p>}
      {onRetry && (
        <div className="empty-state__action">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

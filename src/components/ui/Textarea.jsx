export default function Textarea({
  label,
  error,
  hint,
  id,
  className = '',
  rows = 3,
  ...rest
}) {
  const textareaId = id || rest.name || label;
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`input textarea ${error ? 'input--error' : ''}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

export default function Input({
  label,
  error,
  hint,
  id,
  className = '',
  ...rest
}) {
  const inputId = id || rest.name || label;
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? 'input--error' : ''}`}
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

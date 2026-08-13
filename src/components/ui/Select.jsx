export default function Select({
  label,
  error,
  hint,
  placeholder,
  id,
  className = '',
  children,
  ...rest
}) {
  const selectId = id || rest.name || label;
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input select ${error ? 'input--error' : ''}`}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
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

import { useState } from 'react';
import Icon from './Icon.jsx';

export default function Input({
  label,
  error,
  hint,
  id,
  className = '',
  type = 'text',
  ...rest
}) {
  const inputId = id || rest.name || label;
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      {isPassword ? (
        <div className="input-with-icon">
          <input
            id={inputId}
            className={`input ${error ? 'input--error' : ''}`}
            type={inputType}
            aria-invalid={Boolean(error)}
            {...rest}
          />
          <button
            type="button"
            className="icon-btn input-with-icon__toggle"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
          </button>
        </div>
      ) : (
        <input
          id={inputId}
          className={`input ${error ? 'input--error' : ''}`}
          type={type}
          aria-invalid={Boolean(error)}
          {...rest}
        />
      )}
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

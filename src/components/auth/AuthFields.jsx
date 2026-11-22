import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function TextField({ id, label, error, ...inputProps }) {
  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

export function PasswordField({ id, label, error, hint, labelAction, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      <div className="auth-label-row"><label htmlFor={id}>{label}</label>{labelAction}</div>
      <div className="input-wrap">
        <input id={id} type={visible ? 'text' : 'password'} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
        <button type="button" className="toggle-visibility" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error ? <span className="field-error" id={`${id}-error`}>{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

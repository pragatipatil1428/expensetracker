// Lightweight, dependency-free request validation middleware.

export const required = (msg = 'This field is required') => (value) =>
  value === undefined || value === null || String(value).trim() === ''
    ? msg
    : null;

export const minLength =
  (n, msg = `Must be at least ${n} characters`) =>
  (value) =>
    value !== undefined && String(value).length < n ? msg : null;

export const isEmail =
  (msg = 'Please provide a valid email') =>
  (value) => {
    if (value === undefined) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? null : msg;
  };

export const isOneOf =
  (values, msg = 'Invalid value') =>
  (value) =>
    value !== undefined && !values.includes(value) ? msg : null;

export const positiveNumber =
  (msg = 'Amount must be greater than 0') =>
  (value) => {
    if (value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? null : msg;
  };

export const isDate =
  (msg = 'Please provide a valid date') =>
  (value) => {
    if (value === undefined) return null;
    return !Number.isNaN(new Date(value).getTime()) ? null : msg;
  };

/**
 * Validates `req.body` against a set of rules.
 * @param {Object} rules  { fieldName: [rule, ...] }
 * @param {Object} options { partial: true } skips validation for missing fields (for PUT/PATCH)
 */
export function validate(rules, options = {}) {
  return (req, res, next) => {
    const errors = {};
    for (const [field, checks] of Object.entries(rules)) {
      const value = req.body[field];
      const missing =
        value === undefined || value === null || value === '';
      if (options.partial && missing) continue;
      for (const check of checks) {
        const error = check(value, req.body);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    next();
  };
}

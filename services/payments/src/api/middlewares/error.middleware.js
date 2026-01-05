import { PAYMENT_STATUSES } from "../constants/enums.constants.js";

/**
 * Enhanced centralized error handler for general errors
 */
/* eslint-disable-next-line no-unused-vars */
export default function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);
  const message = err.message || '';
  const code = err.code || '';
  const details = err.details || '';

  console.log("Error message:", message);
  console.log("Error code:", code);
  console.log("Error details:", details);

  // === ENUM: payment_statuses
  if (message.includes('invalid input value for enum payment_statuses')) {
    const match = message.match(/"(.*?)"/);
    const invalid = match ? match[1] : '[unknown]';
    return res.status(400).json({
      error: `Invalid payment_status: '${invalid}'. Allowed values: ${PAYMENT_STATUSES.join(', ')}`
    });
  }

  // === Foreign key violation (code 23503)
  if (code === '23503') {
    return res.status(400).json({
      error: 'Foreign key constraint failed',
      detail: err.detail || 'One of the referenced IDs does not exist'
    });
  }

  // === Not-null violation (code 23502)
  if (code === '23502') {
    return res.status(400).json({
      error: 'Missing required field',
      column: err.column || 'unknown',
      table: err.table || 'unknown'
    });
  }

  // === Unique constraint violation (code 23505)
  if (code === '23505') {
    return res.status(409).json({
      error: 'Duplicate value',
      detail: err.detail || 'A record with this value already exists'
    });
  }

  // === Manually thrown 404 errors
  if (err.status === 404) {
    return res.status(404).json({
      error: err.message || 'Resource not found',
      code: err.code || 'NOT_FOUND'
    });
  }

  // === Manually thrown 409 Conflict errors
  if (err.status === 409) {
    return res.status(409).json({
      error: err.message || 'Conflict',
      code: err.code || 'CONFLICT'
    });
  }
  // === Manually thrown 401 Unauthorized errors
  if (err.status === 401) {
    return res.status(401).json({
      error: err.message || 'Unauthorized',
      code: err.code || 'UNAUTHORIZED'
    });
  }
  // === Manually thrown 403 Forbidden errors
  if (err.status === 403) {
    return res.status(403).json({
      error: err.message || 'Forbidden',
      code: err.code || 'FORBIDDEN'
    });
  }

  if (err.status === 429) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // if already set the error stuff then use it
  if (err.status && err.message) return res.status(err.status).json({
    error: err.message,
    code: err.code || 'ERROR',
    details: err.details || undefined
  });
  // === Fallback
  return res.status(500).json({
    error: 'Internal Server Error',
    detail: message
  });
}

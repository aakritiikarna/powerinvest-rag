// One small error type used across the backend.
// `code` is a stable machine-readable string the frontend can react to,
// `status` is the HTTP status the API should answer with.
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

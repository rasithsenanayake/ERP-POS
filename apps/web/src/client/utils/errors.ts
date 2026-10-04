export type DomainErrorCode =
'FORBIDDEN' |
'NOT_FOUND' |
'INVALID_STATE' |
'INSUFFICIENT_STOCK' |
'VALIDATION' |
'DUPLICATE' |
'LIMIT_EXCEEDED';

/** A business-rule violation. Mirrors the standardized API error shape (code + message). */
export class DomainError extends Error {
  code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError || typeof error === 'object' && error !== null && (error as {name?: string;}).name === 'DomainError';
}
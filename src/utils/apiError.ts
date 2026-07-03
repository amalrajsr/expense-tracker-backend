export type PublicErrorDetail = {
  field?: string;
  message: string;
};

class APIError extends Error {
  statusCode: number;
  success: boolean;
  details?: PublicErrorDetail[];

  constructor(
    message: string,
    statusCode: number,
    details?: PublicErrorDetail[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.details = details;
  }
}

/** Generates a custom api error with given message and status code. */
const generateAPIError = (
  msg: string,
  httpStatus: number,
  details?: PublicErrorDetail[],
): APIError => {
  return new APIError(msg, httpStatus, details);
};

export { generateAPIError, APIError };

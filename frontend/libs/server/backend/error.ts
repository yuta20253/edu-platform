export class BackendUnauthorizedError extends Error {
  constructor(message = "UNAUTHORIZED") {
    super(message);
    this.name = "BackendUnauthorizedError";
  }
}

export class BackendFetchError extends Error {
  status: number;
  bodyText?: string;

  constructor(status: number, message: string, bodyText?: string) {
    super(message);
    this.name = "BackendFetchError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

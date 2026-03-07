export class RailsUnauthorizedError extends Error {
  constructor(message = "UNAUTHORIZED") {
    super(message);
    this.name = "RailsUnauthorizedError";
  }
}

export class RailsFetchError extends Error {
  status: number;
  bodyText?: string;

  constructor(status: number, message: string, bodyText?: string) {
    super(message);
    this.name = "RailsFetchError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

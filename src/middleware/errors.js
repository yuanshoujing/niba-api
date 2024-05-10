import logger from "../utils/logger";

export class NBError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.code = code;
  }
}

export class BadRequest extends NBError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

export class Unauthorized extends NBError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class Forbidden extends NBError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFound extends NBError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

export class MethodNotAllowed extends NBError {
  constructor(message = "Method Not Allowed") {
    super(message, 405);
  }
}

export class NotAcceptable extends NBError {
  constructor(message = "Not Acceptable") {
    super(message, 406);
  }
}

export class ProxyAuthenticationRequired extends NBError {
  constructor(message = "Proxy Authentication Required") {
    super(message, 407);
  }
}

export class Timeout extends NBError {
  constructor(message = "Time-out") {
    super(message, 408);
  }
}

export class Conflict extends NBError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class InternalServerError extends NBError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}

export class NotImplemented extends NBError {
  constructor(message = "Not Implemented") {
    super(message, 501);
  }
}

export class BadGateway extends NBError {
  constructor(message = "Bad Gateway") {
    super(message, 502);
  }
}

export class ServiceUnavailable extends NBError {
  constructor(message = "Service Unavailable") {
    super(message, 503);
  }
}

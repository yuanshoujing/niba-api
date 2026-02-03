import { test, expect } from "@jest/globals";

import {
  NBError,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  MethodNotAllowed,
  NotAcceptable,
  ProxyAuthenticationRequired,
  Timeout,
  Conflict,
  InternalServerError,
  NotImplemented,
  BadGateway,
  ServiceUnavailable,
} from "../src/middleware/errors";

test("NBError - should create error with message and code", () => {
  const error = new NBError("Test error", 418);
  expect(error.message).toBe("Test error");
  expect(error.code).toBe(418);
  expect(error).toBeInstanceOf(Error);
});

test("NBError - should use default code 500", () => {
  const error = new NBError("Test error");
  expect(error.code).toBe(500);
});

test("BadRequest - should create error with code 400", () => {
  const error = new BadRequest();
  expect(error.message).toBe("Bad Request");
  expect(error.code).toBe(400);
  expect(error).toBeInstanceOf(NBError);
});

test("BadRequest - should accept custom message", () => {
  const error = new BadRequest("Invalid input");
  expect(error.message).toBe("Invalid input");
  expect(error.code).toBe(400);
});

test("Unauthorized - should create error with code 401", () => {
  const error = new Unauthorized();
  expect(error.message).toBe("Unauthorized");
  expect(error.code).toBe(401);
});

test("Unauthorized - should accept custom message", () => {
  const error = new Unauthorized("Please login");
  expect(error.message).toBe("Please login");
  expect(error.code).toBe(401);
});

test("Forbidden - should create error with code 403", () => {
  const error = new Forbidden();
  expect(error.message).toBe("Forbidden");
  expect(error.code).toBe(403);
});

test("Forbidden - should accept custom message", () => {
  const error = new Forbidden("Access denied");
  expect(error.message).toBe("Access denied");
  expect(error.code).toBe(403);
});

test("NotFound - should create error with code 404", () => {
  const error = new NotFound();
  expect(error.message).toBe("Not Found");
  expect(error.code).toBe(404);
});

test("NotFound - should accept custom message", () => {
  const error = new NotFound("Resource not found");
  expect(error.message).toBe("Resource not found");
  expect(error.code).toBe(404);
});

test("MethodNotAllowed - should create error with code 405", () => {
  const error = new MethodNotAllowed();
  expect(error.message).toBe("Method Not Allowed");
  expect(error.code).toBe(405);
});

test("MethodNotAllowed - should accept custom message", () => {
  const error = new MethodNotAllowed("POST not allowed");
  expect(error.message).toBe("POST not allowed");
  expect(error.code).toBe(405);
});

test("NotAcceptable - should create error with code 406", () => {
  const error = new NotAcceptable();
  expect(error.message).toBe("Not Acceptable");
  expect(error.code).toBe(406);
});

test("NotAcceptable - should accept custom message", () => {
  const error = new NotAcceptable("JSON only");
  expect(error.message).toBe("JSON only");
  expect(error.code).toBe(406);
});

test("ProxyAuthenticationRequired - should create error with code 407", () => {
  const error = new ProxyAuthenticationRequired();
  expect(error.message).toBe("Proxy Authentication Required");
  expect(error.code).toBe(407);
});

test("ProxyAuthenticationRequired - should accept custom message", () => {
  const error = new ProxyAuthenticationRequired("Proxy auth needed");
  expect(error.message).toBe("Proxy auth needed");
  expect(error.code).toBe(407);
});

test("Timeout - should create error with code 408", () => {
  const error = new Timeout();
  expect(error.message).toBe("Time-out");
  expect(error.code).toBe(408);
});

test("Timeout - should accept custom message", () => {
  const error = new Timeout("Request timeout");
  expect(error.message).toBe("Request timeout");
  expect(error.code).toBe(408);
});

test("Conflict - should create error with code 409", () => {
  const error = new Conflict();
  expect(error.message).toBe("Conflict");
  expect(error.code).toBe(409);
});

test("Conflict - should accept custom message", () => {
  const error = new Conflict("Resource already exists");
  expect(error.message).toBe("Resource already exists");
  expect(error.code).toBe(409);
});

test("InternalServerError - should create error with code 500", () => {
  const error = new InternalServerError();
  expect(error.message).toBe("Internal Server Error");
  expect(error.code).toBe(500);
});

test("InternalServerError - should accept custom message", () => {
  const error = new InternalServerError("Database error");
  expect(error.message).toBe("Database error");
  expect(error.code).toBe(500);
});

test("NotImplemented - should create error with code 501", () => {
  const error = new NotImplemented();
  expect(error.message).toBe("Not Implemented");
  expect(error.code).toBe(501);
});

test("NotImplemented - should accept custom message", () => {
  const error = new NotImplemented("Feature not implemented");
  expect(error.message).toBe("Feature not implemented");
  expect(error.code).toBe(501);
});

test("BadGateway - should create error with code 502", () => {
  const error = new BadGateway();
  expect(error.message).toBe("Bad Gateway");
  expect(error.code).toBe(502);
});

test("BadGateway - should accept custom message", () => {
  const error = new BadGateway("Upstream error");
  expect(error.message).toBe("Upstream error");
  expect(error.code).toBe(502);
});

test("ServiceUnavailable - should create error with code 503", () => {
  const error = new ServiceUnavailable();
  expect(error.message).toBe("Service Unavailable");
  expect(error.code).toBe(503);
});

test("ServiceUnavailable - should accept custom message", () => {
  const error = new ServiceUnavailable("Maintenance mode");
  expect(error.message).toBe("Maintenance mode");
  expect(error.code).toBe(503);
});

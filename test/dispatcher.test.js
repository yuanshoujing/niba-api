import { test, expect } from "@jest/globals";

import {
  dispatcher,
  enableCache,
  clearCache,
  getCacheStats,
  setCacheMaxSize,
  setCacheTTL,
} from "../src/middleware/dispatcher";
import { NBError } from "../src/middleware/errors";

test("enableCache - should enable caching", () => {
  enableCache(true);
  const stats = getCacheStats();
  expect(stats.config.enabled).toBe(true);
});

test("enableCache - should disable caching", () => {
  enableCache(false);
  const stats = getCacheStats();
  expect(stats.config.enabled).toBe(false);
});

test("setCacheMaxSize - should update max size", () => {
  setCacheMaxSize(500);
  const stats = getCacheStats();
  expect(stats.config.maxSize).toBe(500);
});

test("setCacheTTL - should update TTL", () => {
  setCacheTTL(10 * 60 * 1000);
  const stats = getCacheStats();
  expect(stats.config.ttl).toBe(10 * 60 * 1000);
});

test("clearCache - should clear all caches", () => {
  clearCache();
  const stats = getCacheStats();
  expect(stats.routeRegexCache).toBe(0);
  expect(stats.routeMatchCache).toBe(0);
  expect(stats.paramExtractCache).toBe(0);
});

test("getCacheStats - should return cache statistics", () => {
  const stats = getCacheStats();
  expect(stats).toHaveProperty("routeRegexCache");
  expect(stats).toHaveProperty("routeMatchCache");
  expect(stats).toHaveProperty("paramExtractCache");
  expect(stats).toHaveProperty("config");
  expect(stats.config).toHaveProperty("maxSize");
  expect(stats.config).toHaveProperty("ttl");
  expect(stats.config).toHaveProperty("enabled");
});

test("dispatcher - should return 404 for unknown route", async () => {
  const routes = [
    {
      path: "/users/:id",
      method: "GET",
      handler: async (params) => ({ user: params.id }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/posts/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(404);
  expect(mockCtx.body).toEqual({ error: "Not Found" });
});

test("dispatcher - should match route with parameter", async () => {
  const routes = [
    {
      path: "/users/:id",
      method: "GET",
      handler: async (params) => ({ userId: params.id }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/users/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(200);
  expect(mockCtx.body).toEqual({ userId: "123" });
});

test("dispatcher - should match route with multiple parameters", async () => {
  const routes = [
    {
      path: "/users/:userId/posts/:postId/comments/:commentId",
      method: "GET",
      handler: async (params) => ({
        userId: params.userId,
        postId: params.postId,
        commentId: params.commentId,
      }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/users/123/posts/456/comments/789",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({
    userId: "123",
    postId: "456",
    commentId: "789",
  });
});

test("dispatcher - should match route with optional parameter", async () => {
  const routes = [
    {
      path: "/search/:query(/p:page)",
      method: "GET",
      handler: async (params) => ({ query: params.query, page: params.page }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/search/test/p2",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ query: "test", page: "2" });
});

test("dispatcher - should match route without optional parameter", async () => {
  const routes = [
    {
      path: "/search/:query(/p:page)",
      method: "GET",
      handler: async (params) => ({ query: params.query }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/search/test",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ query: "test" });
});

test("dispatcher - should match route with context", async () => {
  const routes = [
    {
      path: "/users/:id",
      method: "GET",
      handler: async (params) => ({ userId: params.id }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/api/v1/users/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "/api/v1");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ userId: "123" });
});

test("dispatcher - should check method", async () => {
  const routes = [
    {
      path: "/users/:id",
      method: "GET",
      handler: async (params) => ({ method: "GET" }),
    },
  ];

  const mockCtx = {
    method: "POST",
    path: "/users/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(404);
});

test("dispatcher - should support array of methods", async () => {
  const routes = [
    {
      path: "/users/:id",
      method: ["GET", "POST"],
      handler: async (params) => ({ userId: params.id }),
    },
  ];

  const mockCtx1 = {
    method: "GET",
    path: "/users/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockCtx2 = {
    method: "POST",
    path: "/users/456",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  
  await dispatch(mockCtx1, mockNext);
  expect(mockCtx1.body).toEqual({ userId: "123" });

  await dispatch(mockCtx2, mockNext);
  expect(mockCtx2.body).toEqual({ userId: "456" });
});

test("dispatcher - should return 204 for null response", async () => {
  const routes = [
    {
      path: "/delete/:id",
      method: "DELETE",
      handler: async () => null,
    },
  ];

  const mockCtx = {
    method: "DELETE",
    path: "/delete/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(204);
  expect(mockCtx.body).toBeNull();
});

test("dispatcher - should return 500 when handler is missing", async () => {
  const routes = [
    {
      path: "/broken",
      method: "GET",
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/broken",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(500);
  expect(mockCtx.body).toEqual({ error: "The handler cannot be found" });
});

test("dispatcher - should parse query string", async () => {
  const routes = [
    {
      path: "/search",
      method: "GET",
      query: ["q", "page"],
      handler: async (params) => ({ q: params.q, page: params.page }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/search",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { q: "test", page: "2" },
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ q: "test", page: "2" });
});

test("dispatcher - should parse headers", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      header: { authorization: "Authorization", contentType: "Content-Type" },
      handler: async (params) => ({
        authorization: params.authorization,
        contentType: params.contentType,
      }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: {},
      header: { 
        "Authorization": "Bearer token",
        "Content-Type": "application/json"
      } 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body.authorization).toBe("Bearer token");
  expect(mockCtx.body.contentType).toBe("application/json");
});

test("dispatcher - should handle NBError", async () => {
  const routes = [
    {
      path: "/error",
      method: "GET",
      handler: async () => {
        throw new NBError("Custom error", 403);
      },
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/error",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(403);
  expect(mockCtx.body).toEqual({ error: "Custom error" });
});

test("dispatcher - should handle splat parameter", async () => {
  const routes = [
    {
      path: "/files/*path",
      method: "GET",
      handler: async (params) => ({ path: params.path }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/files/documents/report.pdf",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ path: "documents/report.pdf" });
});

test("dispatcher - should handle route with optional params and splat", async () => {
  const routes = [
    {
      path: "/api/*path(/v:num)",
      method: "GET",
      handler: async (params) => ({
        path: params.path,
        version: params.num,
      }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/api/resource/data/v2",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ path: "resource/data", version: "2" });
});

test("dispatcher - should handle complex route", async () => {
  const routes = [
    {
      path: "/api/:version/:resource/:id(/action:action)",
      method: "GET",
      handler: async (params) => ({
        version: params.version,
        resource: params.resource,
        id: params.id,
        action: params.action,
      }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/api/v1/users/123/edit",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({
    version: "v1",
    resource: "users",
    id: "123",
    action: "edit",
  });
});

test("dispatcher - should handle empty query string in path", async () => {
  const routes = [
    {
      path: "/search",
      method: "GET",
      handler: async () => ({ result: "ok" }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/search",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ result: "ok" });
});

test("dispatcher - should decode URL-encoded parameters", async () => {
  const routes = [
    {
      path: "/search/:query",
      method: "GET",
      handler: async (params) => ({ query: params.query }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/search/hello%20world",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ query: "hello world" });
});

test("dispatcher - should handle disabled cache", async () => {
  enableCache(false);
  clearCache();
  
  const routes = [
    {
      path: "/test/:id",
      method: "GET",
      handler: async (params) => ({ id: params.id }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(200);
  expect(mockCtx.body).toEqual({ id: "123" });
  
  enableCache(true);
});

test("dispatcher - should return 204 for 404 with null body", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      handler: async () => null,
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 404,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(204);
  expect(mockCtx.body).toBeNull();
});

test("dispatcher - should handle 3xx status codes", async () => {
  const routes = [
    {
      path: "/redirect",
      method: "GET",
      handler: async () => ({ message: "Redirect" }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/redirect",
    status: 302,
    body: { redirected: false },
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {
    mockCtx.status = 302;
    mockCtx.body = { redirected: true };
  };

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body.redirected).toBe(true);
});

test("dispatcher - should handle POST with body", async () => {
  const routes = [
    {
      path: "/create",
      method: "POST",
      body: "data",
      handler: async (params) => ({ data: params.data }),
    },
  ];

  const mockCtx = {
    method: "POST",
    path: "/create",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: { data: "test data" }, 
      query: {},
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ data: "test data" });
});

test("dispatcher - should handle body as string", async () => {
  const routes = [
    {
      path: "/create",
      method: "POST",
      body: "payload",
      handler: async (params) => ({ payload: params.payload }),
    },
  ];

  const mockCtx = {
    method: "POST",
    path: "/create",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: { payload: "test payload" }, 
      query: {},
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ payload: "test payload" });
});

test("dispatcher - should parse query string with CSV values", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      query: ["ids", "tags"],
      handler: async (params) => ({
        ids: params.ids,
        tags: params.tags,
      }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { 
        ids: "1,2,3",
        tags: "tag1,tag2,tag3"
      }, 
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ ids: ["1", "2", "3"], tags: ["tag1", "tag2", "tag3"] });
});

test("dispatcher - should parse query with numbers", async () => {
  const routes = [
    {
      path: "/api/numbers/:ids",
      method: "GET",
      query: "ids",
      handler: async (params) => ({ ids: params.ids }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/api/numbers/1,2,3,3.14",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { ids: "1.5,2.7,3.14" },
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ ids: [1.5, 2.7, 3.14] });
});

test("dispatcher - should parse query with mixed types", async () => {
  const routes = [
    {
      path: "/api/mixed/:items",
      method: "GET",
      query: ["ids", "tags", "filter"],
      handler: async (params) => ({
        ids: params.ids,
        tags: params.tags,
        filter: params.filter,
      }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/api/mixed/1,2,3/tag1,tag2,tag3?active=true",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { 
        ids: "1,2,3",
        tags: "tag1,tag2,tag3",
        filter: "active=true"
      }, 
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({
    ids: [1, 2, 3],
    tags: ["tag1", "tag2", "tag3"],
    filter: "active=true",
  });
});

test("dispatcher - should handle invalid method type", async () => {
  const routes = [
    {
      path: "/test",
      method: 123, // Invalid method type
      handler: async (params) => ({ result: "ok" }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(404);
  expect(mockCtx.body).toEqual({ error: "Not Found" });
});

test("dispatcher - should route without method", async () => {
  const routes = [
    {
      path: "/test",
      handler: async (params) => ({ result: "ok" }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ result: "ok" });
});

test("dispatcher - should handle route with no named parameters", async () => {
  const routes = [
    {
      path: "/static/path",
      method: "GET",
      handler: async (params) => ({ static: true }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/static/path",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ static: true });
});

test("dispatcher - should handle empty values in query", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      query: ["id1", "id2", "id3"],
      handler: async (params) => ({
        id1: params.id1,
        id2: params.id2,
        id3: params.id3,
      }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { 
        id1: "",  // Empty string
        id2: null, // null value
        id3: "test",  // Valid value
      }, 
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({
    id1: "",
    id2: null,
    id3: "test",
  });
});

test("dispatcher - should throw error for too large input", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      query: ["large"],
      handler: async (params) => ({ large: params.large }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { large: "x".repeat(10001) }, 
      header: {} 
    },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(400);
  expect(mockCtx.body).toEqual({ error: "Input too large" });
});

test("dispatcher - should throw error for too large CSV item", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      query: ["large"],
      handler: async (params) => ({ large: params.large }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { large: "x".repeat(1000) }, 
      header: {} 
    },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(400);
  expect(mockCtx.body).toEqual({ error: "CSV item too large" });
});

test("csv2arr - should handle empty string", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      query: ["tags"],
      handler: async (params) => ({ tags: params.tags }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { tags: "" },
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ tags: "" });
});

test("csv2arr - should handle single value", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      query: ["tag"],
      handler: async (params) => ({ tag: params.tag }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { tag: "single" },
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ tag: "single" });
});

test("csv2arr - should handle values with spaces", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      query: ["tags"],
      handler: async (params) => ({ tags: params.tags }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { tags: "tag1, tag2, tag3" },
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ tags: ["tag1", "tag2", "tag3"] });
});

test("csv2arr - should filter out empty values", async () => {
  const routes = [
    {
      path: "/test",
      method: "GET",
      query: ["items"],
      handler: async (params) => ({ items: params.items }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { 
      body: {}, 
      query: { items: "1,,3,," },
      header: {} 
    },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.body).toEqual({ items: [1, 3] });
});

test("dispatcher - should cache route match results", async () => {
  clearCache();
  
  const routes = [
    {
      path: "/users/:id",
      method: "GET",
      handler: async (params) => ({ userId: params.id }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/users/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  
  let stats = getCacheStats();
  expect(stats.routeMatchCache).toBe(0);

  await dispatch(mockCtx, mockNext);

  stats = getCacheStats();
  expect(stats.routeMatchCache).toBe(1);
  expect(stats.routeRegexCache).toBe(1);
  expect(stats.paramExtractCache).toBe(1);
});

test("dispatcher - should use cached route regex", async () => {
  clearCache();
  
  const routes = [
    {
      path: "/users/:id",
      method: "GET",
      handler: async (params) => ({ userId: params.id }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/users/123",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  
  await dispatch(mockCtx, mockNext);

  let stats = getCacheStats();
  const regexCacheSize = stats.routeRegexCache;

  mockCtx.path = "/users/456";
  await dispatch(mockCtx, mockNext);

  stats = getCacheStats();
  expect(stats.routeRegexCache).toBe(regexCacheSize);
});

test("dispatcher - should handle array method not matching", async () => {
  const routes = [
    {
      path: "/test",
      method: ["POST", "PUT"],
      handler: async (params) => ({ result: "ok" }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(404);
  expect(mockCtx.body).toEqual({ error: "Not Found" });
});

test("dispatcher - should handle invalid method type (object)", async () => {
  const routes = [
    {
      path: "/test",
      method: { type: "GET" },
      handler: async (params) => ({ result: "ok" }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/test",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(404);
  expect(mockCtx.body).toEqual({ error: "Not Found" });
});

test("dispatcher - should require auth when route.auth is true", async () => {
  const routes = [
    {
      path: "/protected",
      method: "GET",
      auth: true,
      handler: async (params) => ({ result: "protected" }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/protected",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(401);
});

test("dispatcher - should check ACL permission", async () => {
  const routes = [
    {
      path: "/admin",
      method: "GET",
      auth: "admin",
      handler: async (params) => ({ result: "admin" }),
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/admin",
    status: 200,
    body: null,
    state: { 
      USER: { id: 1 },
      ACL: ["user"]
    },
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(403);
});

test("dispatcher - should handle plain Error (not NBError)", async () => {
  const routes = [
    {
      path: "/error",
      method: "GET",
      handler: async () => {
        throw new Error("Generic error");
      },
    },
  ];

  const mockCtx = {
    method: "GET",
    path: "/error",
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => {
      mockCtx.status = code;
      mockCtx.body = { error: msg };
    },
  };

  const mockNext = async () => {};

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(mockCtx.status).toBe(500);
  expect(mockCtx.body).toBeNull();
});

test("dispatcher - should call next() for 3xx status", async () => {
  const routes = [
    {
      path: "/redirect",
      method: "GET",
      handler: async () => ({ message: "Redirect" }),
    },
  ];

  let nextCalled = false;
  const mockCtx = {
    method: "GET",
    path: "/redirect",
    status: 302,
    body: { redirected: false },
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
  };

  const mockNext = async () => {
    nextCalled = true;
  };

  const dispatch = dispatcher(routes, "");
  await dispatch(mockCtx, mockNext);

  expect(nextCalled).toBe(true);
});

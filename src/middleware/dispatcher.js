import logger from "../utils/logger";
import { NBError } from "./errors";
import { LRUCache } from "lru-cache";

const optionalParam = /\((.*?)\)/g;
const namedParam = /(\(\?)?:\w+/g;
const splatParam = /\*\w+/g;
const escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

// 缓存配置
const CACHE_CONFIG = {
  maxSize: 1000, // 最大缓存条目数
  ttl: 5 * 60 * 1000, // 缓存存活时间（5分钟）
  enabled: true, // 是否启用缓存
};

// 全局缓存实例
const routeRegexCache = new LRUCache({
  max: CACHE_CONFIG.maxSize,
  ttl: CACHE_CONFIG.ttl,
  updateAgeOnGet: true,
});

const routeMatchCache = new LRUCache({
  max: CACHE_CONFIG.maxSize,
  ttl: CACHE_CONFIG.ttl,
  updateAgeOnGet: true,
});

const paramExtractCache = new LRUCache({
  max: CACHE_CONFIG.maxSize,
  ttl: CACHE_CONFIG.ttl,
  updateAgeOnGet: true,
});

function csv2arr(source) {
  if (typeof source !== "string") {
    return source;
  }
  
  const trimmed = source.trim();
  if (trimmed.length > 10000) {
    throw new NBError("Input too large", 400);
  }
  
  if (trimmed.indexOf(",") < 0) {
    return trimmed;
  }

  return trimmed
    .split(",")
    .map((item) => {
      const itemTrimmed = item.trim();
      if (itemTrimmed.length > 1000) {
        throw new NBError("CSV item too large", 400);
      }
      return /^\d+(\.\d+)?$/g.test(itemTrimmed)
        ? parseFloat(itemTrimmed)
        : itemTrimmed;
    })
    .filter((item) => {
      return item !== undefined && item !== null && item !== "";
    });
}

// 缓存管理函数
export function enableCache(enabled = true) {
  CACHE_CONFIG.enabled = enabled;
}

export function setCacheMaxSize(maxSize) {
  CACHE_CONFIG.maxSize = maxSize;
}

export function setCacheTTL(ttl) {
  CACHE_CONFIG.ttl = ttl;
  routeRegexCache.ttl = ttl;
  routeMatchCache.ttl = ttl;
  paramExtractCache.ttl = ttl;
}

export function clearCache() {
  routeRegexCache.clear();
  routeMatchCache.clear();
  paramExtractCache.clear();
}

function findRoute(routes, method, fragment, context = "") {
  if (!CACHE_CONFIG.enabled) {
    return findRouteUncached(routes, method, fragment, context);
  }
  
  const cacheKey = `${method}:${context}:${fragment}`;
  const cached = routeMatchCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  
  const result = findRouteUncached(routes, method, fragment, context);
  
  if (result !== null) {
    routeMatchCache.set(cacheKey, result);
  }
  
  return result;
}

export function getCacheStats() {
  return {
    routeRegexCache: routeRegexCache.size,
    routeMatchCache: routeMatchCache.size,
    paramExtractCache: paramExtractCache.size,
    config: { ...CACHE_CONFIG },
  };
}

export function routeToRegExp(route) {
  if (!CACHE_CONFIG.enabled) {
    return compileRouteRegex(route);
  }
  
  const cacheKey = route;
  const cached = routeRegexCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  
  const regex = compileRouteRegex(route);
  routeRegexCache.set(cacheKey, regex);
  return regex;
}

function compileRouteRegex(route) {
  const s = route
    .replace(escapeRegExp, "\\$&")
    .replace(optionalParam, function(match, p1) {
      return "(?:" + p1 + ")?";
    })
    .replace(namedParam, function (match, optional) {
      return optional ? match : "([^/?]+)";
    })
    .replace(splatParam, "([^?]*?)");
  return new RegExp("^" + s + "(?:\\?([\\s\\S]*))?$");
}

function extractParameters(route, fragment) {
  if (!CACHE_CONFIG.enabled) {
    return extractParametersUncached(route, fragment);
  }
  
  const cacheKey = `${route.source}:${fragment}`;
  const cached = paramExtractCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  
  const params = extractParametersUncached(route, fragment);
  paramExtractCache.set(cacheKey, params);
  return params;
}

function extractParametersUncached(route, fragment) {
  const params = route.exec(fragment).slice(1);
  return params.map((param, i) => {
    if (i === params.length - 1) return param || null;
    return param ? decodeURIComponent(param) : null;
  });
}

function findRouteUncached(routes, method, fragment, context = "") {
  const methodLower = method.toLowerCase();
  
  for (const route of routes) {
    if (route.method) {
      if (Array.isArray(route.method)) {
        const methodMatches = route.method.some(m => 
          m.toLowerCase() === methodLower
        );
        if (!methodMatches) {
          continue;
        }
      } else if (typeof route.method === "string") {
        if (route.method.toLowerCase() !== methodLower) {
          continue;
        }
      } else {
        continue;
      }
    }

    const pathWithContext = `${context}${route.path}`;
    const reg = routeToRegExp(pathWithContext);
    if (!reg.test(fragment)) {
      continue;
    }

    const patterns = {};
    const names = pathWithContext.match(namedParam);
    if (!names) {
      return { route, patterns };
    }

    const params = extractParameters(reg, fragment);
    names.forEach((n, i) => {
      Object.assign(patterns, {
        [n.slice(1)]: csv2arr(params[i]),
      });
    });

    return { route, patterns };
  }

  return null;
}

function reformParams(source, rules) {
  const result = {};

  const mapping = {};
  if (Array.isArray(rules)) {
    rules.forEach(v => {
      mapping[v] = v;
    });
  } else if (rules && typeof rules === "object") {
    Object.assign(mapping, rules);
  }

  const reverseMapping = {};
  Object.entries(mapping).forEach(([key, value]) => {
    reverseMapping[value] = key;
  });

  for (const [k, v] of Object.entries(source)) {
    const value = csv2arr(v);
    const name = reverseMapping[k] || k;
    result[name] = value;
  }

  return result;
}

export function dispatcher(routes, context = "") {
  return async function (ctx, next) {
    const fragment = ctx.path;

    const rp = findRoute(routes, ctx.method, fragment, context);
    if (!rp) {
      ctx.status = 404;
      ctx.body = { error: "Not Found" };
      return;
    }

    const { route, patterns } = rp;
    logger.debug("--> route %o, patterns: %o", route, patterns);

    const handler = route["handler"];
    logger.debug("--> handler: %o, type: %o", handler, typeof handler);
    if (!handler || typeof handler !== "function") {
      ctx.throw(500, "The handler cannot be found");
      return;
    }

    const user = ctx.state.USER;
    logger.debug("--> current user: %o", user);
    if (route.auth && !user) {
      ctx.throw(401);
      return;
    }

    const acl = ctx.state.ACL ?? [];
    if (typeof route.auth === "string" && !acl.includes(route.auth)) {
      ctx.throw(403);
      return;
    }

    const params = {
      request: ctx.request,
      response: ctx.response,
      ...patterns,
      _user: user,
    };

    if (typeof route.body === "string") {
      Object.assign(params, {
        [route.body]: ctx.request.body,
      });
    } else {
      Object.assign(params, {
        body: ctx.request.body,
      });
    }

    if (route.header) {
      Object.assign(params, reformParams(ctx.request.header, route.header));
    }

    if (route.query) {
      Object.assign(params, reformParams(ctx.request.query, route.query));
    }

    let result = {};

    try {
      result = await handler(params);
    } catch (e) {
      logger.error("Handler error: %s", e.message, { stack: e.stack });
      if (e instanceof NBError) {
        ctx.throw(e.code, e.message);
      } else {
        ctx.throw(500, "Internal Server Error");
      }
    }

    if (ctx.status >= 300 && ctx.status < 400) {
      await next();
      return;
    }

    if (result !== undefined && result !== null) {
      ctx.body = result;
    } else {
      ctx.body = null;
      // Handler 没有返回数据，返回 204 No Content
      if (ctx.status === 200 || ctx.status === 404) {
        ctx.status = 204;
      }
    }

    await next();
  };
}



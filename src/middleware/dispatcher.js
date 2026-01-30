import logger from "../utils/logger";
import { NBError } from "./errors";

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

// LRU缓存类（支持TTL）
class LRUCache {
  constructor(maxSize = CACHE_CONFIG.maxSize, ttl = CACHE_CONFIG.ttl) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map(); // 存储 { value, timestamp }
    this.accessOrder = [];
    this.lastCleanup = Date.now();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const entry = this.cache.get(key);
    
    // 检查是否过期
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }
    
    // 更新访问顺序
    this.updateAccessOrder(key);
    
    return entry.value;
  }

  set(key, value) {
    // 定期清理过期条目
    this.cleanupIfNeeded();
    
    // 如果缓存已满，移除最久未使用的条目
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // 更新访问顺序
    this.updateAccessOrder(key);
    
    return value;
  }

  delete(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.lastCleanup = Date.now();
  }

  size() {
    return this.cache.size;
  }

  // 私有方法
  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  evictOldest() {
    while (this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift();
      if (this.cache.has(oldestKey)) {
        this.cache.delete(oldestKey);
        break;
      }
    }
  }

  cleanupIfNeeded() {
    // 每100次操作清理一次，或者距离上次清理超过1分钟
    if (this.ttl <= 0 || 
        (this.cache.size < 100 && Date.now() - this.lastCleanup < 60000)) {
      return;
    }
    
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.delete(key);
        cleaned++;
      }
    }
    
    this.lastCleanup = now;
    
    if (cleaned > 0) {
      logger.debug(`清理了 ${cleaned} 个过期缓存条目`);
    }
  }
}

// 全局缓存实例
const routeRegexCache = new LRUCache(); // 路由正则表达式缓存
const routeMatchCache = new LRUCache(); // 路由匹配结果缓存
const paramExtractCache = new LRUCache(); // 参数提取缓存

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
  routeRegexCache.maxSize = maxSize;
  routeMatchCache.maxSize = maxSize;
  paramExtractCache.maxSize = maxSize;
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

export function getCacheStats() {
  return {
    routeRegexCache: routeRegexCache.size(),
    routeMatchCache: routeMatchCache.size(),
    paramExtractCache: paramExtractCache.size(),
    config: { ...CACHE_CONFIG },
  };
}

export function routeToRegExp(route) {
  if (!CACHE_CONFIG.enabled) {
    return compileRouteRegex(route);
  }
  
  const cacheKey = route;
  const cached = routeRegexCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  const regex = compileRouteRegex(route);
  return routeRegexCache.set(cacheKey, regex);
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
  if (cached) {
    return cached;
  }
  
  const params = extractParametersUncached(route, fragment);
  return paramExtractCache.set(cacheKey, params);
}

function extractParametersUncached(route, fragment) {
  const params = route.exec(fragment).slice(1);
  return params.map((param, i) => {
    if (i === params.length - 1) return param || null;
    return param ? decodeURIComponent(param) : null;
  });
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
  return routeMatchCache.set(cacheKey, result);
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



import logger from "../utils/logger";

const optionalParam = /\((.*?)\)/g;
const namedParam = /(\(\?)?:\w+/g;
const splatParam = /\*\w+/g;
const escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

function csv2arr(source) {
  if (typeof source !== "string") {
    return source;
  } else if (source.indexOf(",") < 0) {
    return source.trim();
  }

  return source
    .split(",")
    .map((item) => {
      return /^\d+(\.\d+)?$/g.test(item.trim())
        ? parseFloat(item.trim())
        : item.trim();
    })
    .filter((item) => {
      return item;
    });
}

export function routeToRegExp(route) {
  const s = route
    .replace(escapeRegExp, "\\$&")
    .replace(optionalParam, "(?:$1)?")
    .replace(namedParam, function (match, optional) {
      return optional ? match : "([^/?]+)";
    })
    .replace(splatParam, "([^?]*?)");
  return new RegExp("^" + s + "(?:\\?([\\s\\S]*))?$");
}

function extractParameters(route, fragment) {
  const params = route.exec(fragment).slice(1);
  return params.map((param, i) => {
    if (i === params.length - 1) return param || null;
    return param ? decodeURIComponent(param) : null;
  });
}

function findRoute(routes, fragment) {
  for (const route of routes) {
    const reg = routeToRegExp(route.path);
    if (!reg.test(fragment)) {
      continue;
    }

    const patterns = {};
    const names = route.path.match(namedParam);
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

  const hkv = {};
  if (rules instanceof Array) {
    rules.forEach((v) => {
      Object.assign(hkv, {
        [v]: v,
      });
    });
  } else {
    Object.assign(hkv, rules);
  }

  for (const [k, v] of Object.entries(source)) {
    const value = csv2arr(v);

    for (const [hk, hv] of Object.entries(hkv)) {
      if (k === hv) {
        Object.assign(result, {
          [hk]: value,
        });
      }
      break;
    }
  }

  return result;
}

export function dispatcher(routes) {
  return async function (ctx, next) {
    const fragment = ctx.path;

    const rp = findRoute(routes, fragment);
    if (!rp) {
      return;
    }

    const { route, patterns } = rp;
    logger.debug("route %o, patterns: %o", route, patterns);

    if (
      typeof route.method === "string" &&
      ctx.method.toLowerCase() !== route.method.toLowerCase()
    ) {
      ctx.throw(405);
      return;
    }

    const handler = route["handler"];
    logger.debug("handler: %o, type: %o", handler, typeof handler);
    if (!handler || typeof handler !== "function") {
      ctx.throw(500, "The handler cannot be found");
      return;
    }

    const user = ctx.state.USER;
    // logger.debug("user: %o", user);
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
    }

    if (route.header) {
      Object.assign(params, reformParams(ctx.request.header, route.header));
    }

    if (route.query) {
      Object.assign(params, reformParams(ctx.request.query, route.query));
    }

    const result = await handler(params);
    ctx.body = result ?? null;

    await next();
  };
}
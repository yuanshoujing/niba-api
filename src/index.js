import http from "http";
import Koa from "koa";
import bodyParser from "koa-bodyparser";

import { authentication, dispatcher, rjson, parseToken } from "./middleware";
import { setLogger, default as log } from "./utils/logger";

export * from "./middleware";
export * as cache from "./utils/cache";
export * from "./utils/aes";
export { setLogger, default as logger } from "./utils/logger";

export function createServer({
  context = "",
  routes = [],
  plugins = [],
  userGetter = null,
  ACLGetter = null,
  tokenParser = null,
  logger = null,
}) {
  if (logger) {
    setLogger(logger);
  }

  const app = new Koa();

  app.use(
    bodyParser({
      enableTypes: ["json", "form", "text"],
    })
  );

  app.use(authentication({ userGetter, ACLGetter, tokenParser }));
  app.use(dispatcher(routes, context));
  app.use(rjson());

  plugins.forEach((p) => {
    app.use(p);
  });

  return http.createServer(app.callback());
}

/**
 * @param {object} params
 * @param {object[]} params.routes - 路由表
 * @param {object[]} params.plugins - 插件
 * @param {string} params.hostname - 监听地址
 * @param {integer} params.port - 监听端口
 * @param {function} [params.userGetter] - 当前用户读取器
 * @param {function} [params.ACLGetter] - 当前用户访问控制列表读取器
 * @param {function} [params.tokenParser] - token 解释器
 */
export function serve({
  context = "",
  routes = [],
  plugins = [],
  hostname = "localhost",
  port = 9090,
  userGetter = null,
  ACLGetter = null,
  tokenParser = null,
  logger = null,
}) {
  const s = createServer({
    context,
    routes,
    plugins,
    logger,
    userGetter,
    ACLGetter,
    tokenParser,
  });

  log.info(`--> niba is listening at http://${hostname}:${port}`);
  s.listen(port, hostname);
}

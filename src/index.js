import Koa from "koa";
import bodyParser from "koa-bodyparser";

import { authentication, dispatcher, rjson } from "./middleware";
import { setLogger, default as log } from "./utils/logger";

/**
 * @param {object} params
 * @param {object[]} params.routes - 路由表
 * @param {string} params.hostname - 监听地址
 * @param {integer} params.port - 监听端口
 * @param {function} [params.userGetter] - 当前用户读取器
 * @param {function} [params.aclGetter] - 当前用户访问控制列表读取器
 * @param {string} [params.tokenKey] - Token 密钥
 */
export function serve({
  routes = [],
  hostname = "localhost",
  port = 9090,
  userGetter = null,
  aclGetter = null,
  tokenKey = null,
  logger = null,
}) {
  if (logger) {
    setLogger(logger);
  }

  const app = new Koa();

  app.use(
    bodyParser({
      enableTypes: ["json", "form", "text"],
    }),
  );

  app.use(authentication({ getUser: userGetter, getACL: aclGetter, tokenKey }));
  app.use(dispatcher(routes));
  app.use(rjson());

  log.info(`--> niba is listening at http://${hostname}:${port}`);
  app.listen(port, hostname);
}

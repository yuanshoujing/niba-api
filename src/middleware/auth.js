import logger from "../utils/logger";
import { parseToken } from "./token";

export function authentication({
  userGetter,
  ACLGetter,
  tokenParser = parseToken,
}) {
  return async function (ctx, next) {
    let token = null;
    if (!token) {
      const authorization = ctx.headers?.authorization;
      token = authorization?.substring(7).trim();
    }

    if (!token) {
      token = ctx.query?.token;
    }

    logger.debug("--> token: %s", token);
    if (!token) {
      await next();
      return;
    }

    try {
      const { uid, device } = await tokenParser({ token });
      logger.debug("uid: %s, device: %s", uid, device);

      if (userGetter && typeof userGetter === "function") {
        const user = await userGetter({ uid, device });
        ctx.state.USER = user;
      }

      if (ACLGetter && typeof ACLGetter === "function") {
        const acl = await ACLGetter({ uid, device });
        ctx.state.ACL = acl;
      }
    } catch (e) {
      ctx.throw(401);
    }

    await next();
  };
}

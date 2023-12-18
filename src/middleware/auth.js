import logger from "../utils/logger";
import { parseToken } from "./token";

export const TOKEN_NAME = "zwat-id";

export function authentication({ getUser, getACL, tokenKey }) {
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
      const { uid, device } = await parseToken({
        token,
        key: tokenKey ?? undefined,
      });
      logger.debug("uid: %s, device: %s", uid, device);

      if (getUser && typeof getUser === "function") {
        const user = await getUser({ uid, device });
        ctx.state.USER = user;
      }

      if (getACL && typeof getACL === "function") {
        const acl = await getACL({ uid, device });
        ctx.state.ACL = acl;
      }
    } catch (e) {
      ctx.throw(401);
    }

    await next();
  };
}

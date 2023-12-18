import logger from "../../src/utils/logger";

export default async function ({ body }) {
  logger.debug("body: %o", body);
  return { x: "ok" };
}

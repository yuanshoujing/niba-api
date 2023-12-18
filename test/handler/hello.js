import logger from "../../src/utils/logger";

export default async function hello(params) {
  logger.info("--> params: %O", params);
  return params;
}

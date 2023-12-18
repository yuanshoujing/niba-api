import { serve } from "../src";
import routes from "./routes";
import logger from "./logger";

async function userGetter({ uid, device }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: uid, device, name: "test" });
    }, 1000);
  });
}

async function aclGetter({ uid, device }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(["readable", "writable"]);
    }, 1000);
  });
}

serve({
  routes,
  hostname: "127.0.0.1",
  port: 8080,
  logger,
  userGetter,
  aclGetter,
  tokenKey: "Y43xcJNHPQ",
});

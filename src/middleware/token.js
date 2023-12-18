import { promisify } from "node:util";
import { randomBytes } from "node:crypto";

import { encrypt, decrypt } from "../utils/aes";
import * as cache from "../utils/cache";

const DEFAULT_TOKEN_KEY = "eD300Ezu9r4Q3CPM7XQt-Q";

export async function createToken({
  uid,
  device = "unknow",
  key = DEFAULT_TOKEN_KEY,
  timeout = 30,
}) {
  const sn = new Date().getTime();
  const mixBuf = await promisify(randomBytes)(16);
  const expire = Buffer.from(sn + timeout * 60 * 1000 + "", "ascii");
  const buffer = Buffer.concat([
    expire,
    Buffer.from(`${uid}<=>${device}<=>${sn}`),
    mixBuf,
  ]);

  const encrypted = await encrypt(buffer, key);
  await cache.setText(`${uid}@${device}`, sn);
  return encrypted.toString("base64url");
}

export async function parseToken({ token, key = DEFAULT_TOKEN_KEY }) {
  const encrypted = Buffer.from(token, "base64url");
  const buffer = await decrypt(encrypted, key);
  const valuable = buffer.subarray(0, buffer.length - 16).toString("utf8");

  const expire = parseInt(valuable.slice(0, 13));
  if (expire < new Date().getTime()) {
    return null;
  }

  const [uid, device, sn] = valuable.slice(13).split("<=>");
  const lastSN = await cache.getText(`${uid}@${device}`);
  if (parseInt(sn) < parseInt(lastSN)) {
    return null;
  }

  return { uid, device };
}

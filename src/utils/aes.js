import { promisify } from "node:util";
import { scrypt, createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const algorithm = "aes-192-cbc";
const salt = "bmliYW5pYmFsYW5uaWJhIQ==";
const KEY_CACHE = new Map();

async function getKey(password) {
  if (KEY_CACHE.has(password)) {
    return KEY_CACHE.get(password);
  }
  
  const key = await promisify(scrypt)(password, salt, 24);
  KEY_CACHE.set(password, key);
  return key;
}

export async function encrypt(buffer, password) {
  const key = await getKey(password);
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  const ubuf = cipher.update(buffer);
  const fbuf = cipher.final();
  return Buffer.concat([iv, ubuf, fbuf]);
}

export async function decrypt(buffer, password) {
  const key = await getKey(password);
  const iv = buffer.subarray(0, 16);
  const data = buffer.subarray(16);
  const decipher = createDecipheriv(algorithm, key, iv);
  const ubuf = decipher.update(data);
  const fbuf = decipher.final();
  return Buffer.concat([ubuf, fbuf]);
}

export async function encryptText(text, password) {
  const buffer = await encrypt(Buffer.from(text, "utf8"), password);
  return buffer.toString("base64url");
}

export async function decryptText(base64, password) {
  const buffer = await decrypt(Buffer.from(base64, "base64url"), password);
  return buffer.toString("utf8");
}

export function encryptSync(buffer, password) {
  const key = scryptSync(password, salt, 24);
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  const ubuf = cipher.update(buffer);
  const fbuf = cipher.final();
  return Buffer.concat([iv, ubuf, fbuf]);
}

export function decryptSync(buffer, password) {
  const key = scryptSync(password, salt, 24);
  const iv = buffer.subarray(0, 16);
  const data = buffer.subarray(16);
  const decipher = createDecipheriv(algorithm, key, iv);
  const ubuf = decipher.update(data);
  const fbuf = decipher.final();
  return Buffer.concat([ubuf, fbuf]);
}

export async function clearKeyCache() {
  KEY_CACHE.clear();
}

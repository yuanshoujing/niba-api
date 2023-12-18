import { promisify } from "node:util";
import { scrypt, createCipheriv, createDecipheriv } from "node:crypto";

const algorithm = "aes-192-cbc";
const slat = "bmliYW5pYmFsYW5uaWJhIQ==";
const ivstr = "bmliYW5pYmFjaG91bmliYQ==";

export async function encrypt(buffer, password) {
  const key = await promisify(scrypt)(password, slat, 24);
  const iv = Buffer.from(ivstr, "base64");
  const cipher = createCipheriv(algorithm, key, iv);
  const ubuf = cipher.update(buffer);
  const fbuf = cipher.final();
  return Buffer.concat([ubuf, fbuf]);
}

export async function decrypt(buffer, password) {
  const key = await promisify(scrypt)(password, slat, 24);
  const iv = Buffer.from(ivstr, "base64");
  const decipher = createDecipheriv(algorithm, key, iv);
  const ubuf = decipher.update(buffer);
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

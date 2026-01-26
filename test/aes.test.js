import { test, expect } from "@jest/globals";

import { encryptText, decryptText } from "../src/utils/aes";

test("aes-test", async () => {
  const a = "hello world xxx 12434 %##@1298327&";
  const x = await encryptText(a, "abc");
  console.log("--> encrypted: %s", x);
  const y = await decryptText(x, "abc");
  expect(y).toBe(a);
  const x1 = await encryptText(a, "abc");
  expect(x).not.toBe(x1);
  const y1 = await decryptText(x1, "abc");
  expect(y1).toBe(a);
});

test("aes-niba", async () => {
  const r = await encryptText("niba", "niba");
  console.log(r);
});

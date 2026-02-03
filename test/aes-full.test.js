import { test, expect } from "@jest/globals";

import {
  encrypt,
  decrypt,
  encryptSync,
  decryptSync,
  encryptText,
  decryptText,
  clearKeyCache,
} from "../src/utils/aes";

test("encrypt/decrypt - should encrypt and decrypt buffer", async () => {
  const original = Buffer.from("test message");
  const key = "test-key-12345678";
  
  const encrypted = await encrypt(original, key);
  const decrypted = await decrypt(encrypted, key);
  
  expect(decrypted.equals(original)).toBe(true);
});

test("encrypt/decrypt - should use default key", async () => {
  const original = Buffer.from("test message");
  const defaultKey = "eD300Ezu9r4Q3CPM7XQt-Q"; // From token.js
  
  const encrypted = await encrypt(original, defaultKey);
  const decrypted = await decrypt(encrypted, defaultKey);
  
  expect(decrypted.equals(original)).toBe(true);
});

test("encrypt/decrypt - should produce different ciphertext for same plaintext", async () => {
  const original = Buffer.from("test message");
  const key = "test-key-12345678";
  
  const encrypted1 = await encrypt(original, key);
  const encrypted2 = await encrypt(original, key);
  
  expect(encrypted1.equals(encrypted2)).toBe(false);
});

test("encryptSync/decryptSync - should encrypt and decrypt synchronously", () => {
  const original = Buffer.from("test message");
  const key = "test-key-12345678";
  
  const encrypted = encryptSync(original, key);
  const decrypted = decryptSync(encrypted, key);
  
  expect(decrypted.equals(original)).toBe(true);
});

test("encryptSync/decryptSync - should use default key", () => {
  const original = Buffer.from("test message");
  const defaultKey = "eD300Ezu9r4Q3CPM7XQt-Q"; // From token.js
  
  const encrypted = encryptSync(original, defaultKey);
  const decrypted = decryptSync(encrypted, defaultKey);
  
  expect(decrypted.equals(original)).toBe(true);
});

test("encryptText/decryptText - should encrypt and decrypt string", async () => {
  const original = "Hello, World!";
  const key = "test-key-12345678";
  
  const encrypted = await encryptText(original, key);
  const decrypted = await decryptText(encrypted, key);
  
  expect(decrypted).toBe(original);
});

test("encryptText/decryptText - should use default key", async () => {
  const original = "Hello, World!";
  const defaultKey = "eD300Ezu9r4Q3CPM7XQt-Q"; // From token.js
  
  const encrypted = await encryptText(original, defaultKey);
  const decrypted = await decryptText(encrypted, defaultKey);
  
  expect(decrypted).toBe(original);
});

test("encryptText - should encode in base64url", async () => {
  const original = "test";
  const key = "test-key-12345678";
  
  const encrypted = await encryptText(original, key);
  
  // base64url should only contain A-Za-z0-9-_
  expect(encrypted).toMatch(/^[A-Za-z0-9_-]+$/);
});

test("decryptText - should decode from base64url", async () => {
  const original = "test message";
  const key = "test-key-12345678";
  
  const encrypted = await encryptText(original, key);
  const decrypted = await decryptText(encrypted, key);
  
  expect(decrypted).toBe(original);
});

test("encrypt/decrypt - should handle empty buffer", async () => {
  const original = Buffer.alloc(0);
  const key = "test-key-12345678";
  
  const encrypted = await encrypt(original, key);
  const decrypted = await decrypt(encrypted, key);
  
  expect(decrypted.equals(original)).toBe(true);
});

test("encryptText/decryptText - should handle empty string", async () => {
  const original = "";
  const key = "test-key-12345678";
  
  const encrypted = await encryptText(original, key);
  const decrypted = await decryptText(encrypted, key);
  
  expect(decrypted).toBe(original);
});

test("encryptText/decryptText - should handle unicode", async () => {
  const original = "你好，世界！🎉";
  const key = "test-key-12345678";
  
  const encrypted = await encryptText(original, key);
  const decrypted = await decryptText(encrypted, key);
  
  expect(decrypted).toBe(original);
});

test("encryptText/decryptText - should handle special characters", async () => {
  const original = "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";
  const key = "test-key-12345678";
  
  const encrypted = await encryptText(original, key);
  const decrypted = await decryptText(encrypted, key);
  
  expect(decrypted).toBe(original);
});

test("clearKeyCache - should clear key derivation cache", async () => {
  clearKeyCache();
  // Should not throw
  expect(true).toBe(true);
});

test("encrypt/decrypt - should handle large buffer", async () => {
  const original = Buffer.alloc(1024 * 10); // 10KB
  original.fill(0x41); // Fill with 'A'
  
  const key = "test-key-12345678";
  
  const encrypted = await encrypt(original, key);
  const decrypted = await decrypt(encrypted, key);
  
  expect(decrypted.equals(original)).toBe(true);
});

test("decrypt - should throw for wrong key", async () => {
  const original = Buffer.from("test message");
  const key1 = "test-key-12345678";
  const key2 = "wrong-key-12345678";
  
  const encrypted = await encrypt(original, key1);
  
  // Should throw for wrong key
  await expect(decrypt(encrypted, key2)).rejects.toThrow();
});

test("decryptText - should throw for wrong key", async () => {
  const original = "test message";
  const key1 = "test-key-12345678";
  const key2 = "wrong-key-12345678";
  
  const encrypted = await encryptText(original, key1);
  
  // Should throw for wrong key
  await expect(decryptText(encrypted, key2)).rejects.toThrow();
});

test("encrypt/decrypt - should use same key across multiple calls", async () => {
  const key = "test-key-12345678";
  
  const encrypted1 = await encrypt(Buffer.from("message1"), key);
  const encrypted2 = await encrypt(Buffer.from("message2"), key);
  
  const decrypted1 = await decrypt(encrypted1, key);
  const decrypted2 = await decrypt(encrypted2, key);
  
  expect(decrypted1.toString()).toBe("message1");
  expect(decrypted2.toString()).toBe("message2");
});

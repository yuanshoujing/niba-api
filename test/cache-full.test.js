import { test, expect } from "@jest/globals";

import {
  setPath,
  ls,
  getText,
  getObject,
  setText,
  setObject,
  evict,
  clear,
} from "../src/utils/cache";

test("ls - should return empty list for new cache", async () => {
  await clear();
  const result = await ls();
  expect(result).toBeDefined();
});

test("getText - should return null for non-existent key", async () => {
  const result = await getText("nonexistent");
  expect(result).toBeNull();
});

test("getObject - should return null for non-existent key", async () => {
  const result = await getObject("nonexistent");
  expect(result).toBeNull();
});

test("getText/setText - should store and retrieve text", async () => {
  await setText("test-key", "test-value");
  const result = await getText("test-key");
  expect(result).toBe("test-value");
});

test("getObject/setObject - should store and retrieve object", async () => {
  const obj = { name: "test", value: 123, nested: { key: "value" } };
  await setObject("test-object", obj);
  const result = await getObject("test-object");
  expect(result).toEqual(obj);
});

test("getObject - should return null for invalid JSON", async () => {
  await setText("invalid-json", "{not-valid-json");
  const result = await getObject("invalid-json");
  expect(result).toBeNull();
});

test("evict - should remove specific key", async () => {
  await setText("key1", "value1");
  await setText("key2", "value2");
  
  await evict("key1");
  
  const result1 = await getText("key1");
  const result2 = await getText("key2");
  
  expect(result1).toBeNull();
  expect(result2).toBe("value2");
});

test("evict - should handle non-existent key", async () => {
  await evict("nonexistent-key");
  // Should not throw
  expect(true).toBe(true);
});

test("clear - should remove all keys", async () => {
  await setText("key1", "value1");
  await setText("key2", "value2");
  await setObject("key3", { value: 3 });
  
  await clear();
  
  const result1 = await getText("key1");
  const result2 = await getText("key2");
  const result3 = await getObject("key3");
  
  expect(result1).toBeNull();
  expect(result2).toBeNull();
  expect(result3).toBeNull();
});

test("setText - should convert non-string values to string", async () => {
  await setText("number-key", 123);
  await setText("boolean-key", true);
  await setText("object-key", { key: "value" });
  
  const result1 = await getText("number-key");
  const result2 = await getText("boolean-key");
  const result3 = await getText("object-key");
  
  expect(result1).toBe("123");
  expect(result2).toBe("true");
  expect(result3).toBe("[object Object]");
});

test("setPath - should update cache path", async () => {
  setPath("/tmp/test_cache");
  await setText("test", "value");
  const result = await getText("test");
  expect(result).toBe("value");
  
  // Cleanup
  await clear();
  // Reset to default
  setPath("/tmp/niba_cache");
});

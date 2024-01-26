import cacache from "cacache";
import path from "path";
import os from "os";

let cachePath = path.resolve(os.tmpdir(), "niba_cache");

export function setPath(p) {
  cachePath = p;
}

export async function ls() {
  try {
    return await cacache.ls(cachePath);
  } catch {
    // pass
  }
}

export async function getText(key) {
  try {
    const { data } = await cacache.get(cachePath, key);
    return data.toString("utf-8");
  } catch {
    return null;
  }
}

export async function getObject(key) {
  const s = await getText(key);
  return s && JSON.parse(s);
}

export async function setText(key, value) {
  try {
    await cacache.put(cachePath, key, value + "");
  } catch {
    // pass
  }
}

export async function setObject(key, value) {
  setText(key, JSON.stringify(value));
}

export async function evict(key) {
  try {
    await cacache.rm.entry(cachePath, key);
  } catch {
    // pass
  }
}

export async function clear() {
  try {
    await cacache.rm.all(cachePath);
  } catch {
    // pass
  }
}

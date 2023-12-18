import { test, expect } from "@jest/globals";

import { createToken, parseToken } from "../src/middleware/token";

test("token-test", async () => {
  const _uid = "c8539e40-0005-465e-89ee-314dd0b15fb6";
  const token = await createToken({ uid: _uid });
  const { uid, device } = await parseToken({ token });
  expect(uid).toBe(_uid);
  expect(device).toBe("unknow");

  const token1 = await createToken({ uid: _uid });
  console.log("--> token: %s", token1);
  const t = await parseToken({ token });
  expect(t).toBeNull();
});

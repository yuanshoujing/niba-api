import { setText, setObject, getText, getObject } from "../src/utils/cache";

test("cache-test", async () => {
  await setText("abc", "abc");
  let s = await getText("abc");
  expect(s).toBe("abc");

  await setObject("o", {
    abc: "abc",
    n: 1,
    b: true,
  });

  let o = await getObject("o");
  expect(o).toEqual({
    abc: "abc",
    n: 1,
    b: true,
  });
});

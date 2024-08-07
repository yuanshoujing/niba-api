import { test, expect } from "@jest/globals";

import { routeToRegExp } from "../src/middleware/dispatcher";

test("route-test", () => {
  let route = routeToRegExp("search/:query(/p:num)");
  expect(route.test("search/abcs/pxyz")).toBeTruthy();

  let params = route.exec("search/abc/p12?abc=1");
  console.log("%O", params);
  expect(params.slice(1)).toStrictEqual(["abc", "12", "abc=1"]);
  let params1 = route.exec("search/abc");
  expect(params1[1]).toBe("abc");
});

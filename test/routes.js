import hello from "./handler/hello";
import post from "./handler/post";
import { redirect } from "./handler/redirect";

export default [
  {
    path: "/search/:px(/p:num)",
    method: "GET",
    auth: "ww.medicalgroup.view",
    handler: hello,
    query: ["x"],
  },
  { path: "/post-test", method: "POST", handler: post },
  { path: "/redirect", method: "GET", handler: redirect },
];

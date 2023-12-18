import hello from "./handler/hello";
import post from "./handler/post";

export default [
  {
    path: "/search/:px(/p:num)",
    method: "GET",
    auth: "ww.medicalgroup.view",
    handler: hello,
    query: ["x"],
  },
  { path: "/post-test", method: "POST", handler: post },
];

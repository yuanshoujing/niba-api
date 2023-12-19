export async function redirect({ response }) {
  console.log("--> response: %O", response);
  response.redirect("http://www.baidu.com");
}

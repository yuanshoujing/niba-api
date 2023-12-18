export function rjson() {
  return async function (ctx, next) {
    await next();

    const a = ctx.accepts("*/*", "text/*", "application/json");
    if (a) {
      ctx.type = `${a}; charset=utf-8`;
    }
  };
}

import { dispatcher, enableCache, clearCache, getCacheStats, setLogger } from "../../dist/index.js";

// 禁用日志
setLogger({
  info: () => {},
  debug: () => {},
  error: () => {},
  warn: () => {}
});

// 创建大量路由用于测试
const routes = [];
for (let i = 0; i < 1000; i++) {
  routes.push({
    path: `/api/resource${i}/:id`,
    method: "GET",
    handler: async (params) => ({ resource: params.id, index: i }),
  });
  routes.push({
    path: `/api/users/${i}/posts/:postId/comments/:commentId`,
    method: "GET",
    handler: async (params) => ({ 
      userId: i,
      postId: params.postId,
      commentId: params.commentId
    }),
  });
}

const testPaths = [
  "/api/resource500/123",
  "/api/resource500/456",
  "/api/resource500/789",
  "/api/users/10/posts/20/comments/30",
  "/api/users/10/posts/25/comments/35",
  "/api/users/15/posts/30/comments/40",
];

async function createMockCtx(method, path) {
  return {
    method,
    path,
    status: 200,
    body: null,
    state: {},
    request: { body: {}, query: {}, header: {} },
    response: {},
    throw: (code, msg) => { throw new Error(msg); },
  };
}

async function mockNext() {
  // do nothing
}

async function runTest(enabled, iterations = 10000) {
  enableCache(enabled);
  clearCache();

  const startTime = Date.now();
  
  const dispatch = dispatcher(routes, "");
  for (let i = 0; i < iterations; i++) {
    const path = testPaths[i % testPaths.length];
    const ctx = await createMockCtx("GET", path);
    await dispatch(ctx, mockNext);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const stats = getCacheStats();
  
  return {
    enabled,
    iterations,
    duration,
    avgPerRequest: duration / iterations,
    requestsPerSecond: Math.round(iterations / (duration / 1000)),
    cacheStats: stats
  };
}

async function main() {
  console.log("🚀 路由缓存性能测试");
  console.log(`📊 测试配置：${routes.length} 条路由，${testPaths.length} 个测试路径\n`);

  // 预热
  console.log("🔥 预热中...");
  await runTest(false, 100);

  // 测试不启用缓存
  console.log("\n📈 测试 1: 不启用缓存");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const resultDisabled = await runTest(false, 10000);
  console.log(`迭代次数: ${resultDisabled.iterations}`);
  console.log(`总耗时: ${resultDisabled.duration}ms`);
  console.log(`平均每请求: ${resultDisabled.avgPerRequest.toFixed(3)}ms`);
  console.log(`吞吐量: ${resultDisabled.requestsPerSecond} 请求/秒`);

  // 测试启用缓存
  console.log("\n📈 测试 2: 启用缓存");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const resultEnabled = await runTest(true, 10000);
  console.log(`迭代次数: ${resultEnabled.iterations}`);
  console.log(`总耗时: ${resultEnabled.duration}ms`);
  console.log(`平均每请求: ${resultEnabled.avgPerRequest.toFixed(3)}ms`);
  console.log(`吞吐量: ${resultEnabled.requestsPerSecond} 请求/秒`);

  // 对比结果
  console.log("\n📊 性能对比");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const speedup = resultDisabled.duration / resultEnabled.duration;
  const improvement = ((resultDisabled.avgPerRequest - resultEnabled.avgPerRequest) / resultDisabled.avgPerRequest * 100).toFixed(2);
  
  console.log(`启用缓存后性能提升: ${speedup.toFixed(2)}x`);
  console.log(`平均响应时间减少: ${improvement}%`);
  console.log(`不启用缓存: ${resultDisabled.avgPerRequest.toFixed(3)}ms/请求`);
  console.log(`启用缓存: ${resultEnabled.avgPerRequest.toFixed(3)}ms/请求`);
  console.log(`节省时间: ${(resultDisabled.avgPerRequest - resultEnabled.avgPerRequest).toFixed(3)}ms/请求`);
  
  const timeSave = resultDisabled.duration - resultEnabled.duration;
  console.log(`\n10000 次请求节省总时间: ${timeSave}ms (${(timeSave/1000).toFixed(2)}秒)`);
}

main().catch(console.error);

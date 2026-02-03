import { enableCache, clearCache, getCacheStats, setLogger } from "../../dist/index.js";

// 禁用日志
setLogger({
  info: () => {},
  debug: () => {},
  error: () => {},
  warn: () => {}
});

// 创建测试路由
const routes = [];
for (let i = 0; i < 100; i++) {
  routes.push({
    path: `/api/resource${i}/:id`,
    method: "GET",
    handler: async (params) => ({ resource: params.id, index: i }),
  });
}

const testPaths = [
  "/api/resource50/123",
  "/api/resource50/456",
  "/api/resource50/789",
];

async function testRouteMatching(enabled, iterations = 10000) {
  enableCache(enabled);
  clearCache();
  
  const { routeToRegExp } = await import("../../dist/index.js");
  
  const startTime = Date.now();
  let matchCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const path = testPaths[i % testPaths.length];
    
    // 测试正则编译和匹配
    const regex = routeToRegExp(`/api/resource50/:id`);
    if (regex.test(path)) {
      matchCount++;
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const stats = getCacheStats();
  
  return {
    enabled,
    iterations,
    matchCount,
    duration,
    avgPerRequest: duration / iterations,
    requestsPerSecond: Math.round(iterations / (duration / 1000)),
    cacheStats: stats
  };
}

async function main() {
  console.log("🚀 路由正则编译性能测试");
  console.log(`📊 测试配置：${routes.length} 条路由，${testPaths.length} 个测试路径\n`);

  // 预热
  console.log("🔥 预热中...");
  await testRouteMatching(false, 1000);
  clearCache();

  // 测试不启用缓存
  console.log("\n📈 测试 1: 不启用缓存");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const resultDisabled = await testRouteMatching(false, 10000);
  console.log(`迭代次数: ${resultDisabled.iterations}`);
  console.log(`匹配次数: ${resultDisabled.matchCount}`);
  console.log(`总耗时: ${resultDisabled.duration}ms`);
  console.log(`平均每请求: ${resultDisabled.avgPerRequest.toFixed(3)}ms`);
  console.log(`吞吐量: ${resultDisabled.requestsPerSecond} 请求/秒`);

  // 测试启用缓存
  console.log("\n📈 测试 2: 启用缓存");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const resultEnabled = await testRouteMatching(true, 10000);
  console.log(`迭代次数: ${resultEnabled.iterations}`);
  console.log(`匹配次数: ${resultEnabled.matchCount}`);
  console.log(`总耗时: ${resultEnabled.duration}ms`);
  console.log(`平均每请求: ${resultEnabled.avgPerRequest.toFixed(3)}ms`);
  console.log(`吞吐量: ${resultEnabled.requestsPerSecond} 请求/秒`);
  console.log(`\n缓存统计:`);
  console.log(`  路由正则缓存: ${resultEnabled.cacheStats.routeRegexCache} 条目`);

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

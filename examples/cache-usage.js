// 路由缓存使用示例
import { serve } from "../src/index.js";
import { enableCache, setCacheMaxSize, setCacheTTL, clearCache, getCacheStats } from "../src/middleware/index.js";

// 示例路由
const routes = [
  {
    path: "/users/:id",
    method: "GET",
    handler: async (params) => {
      return { user: { id: params.id, name: "Test User" } };
    }
  },
  {
    path: "/posts/:year/:month/:day",
    method: "GET",
    handler: async (params) => {
      return { 
        posts: [
          { title: "Post 1", date: `${params.year}-${params.month}-${params.day}` }
        ]
      };
    }
  },
  {
    path: "/search/:query(/p:num)",
    method: "GET",
    handler: async (params) => {
      return { 
        query: params.query,
        page: params.num || 1,
        results: ["result1", "result2", "result3"]
      };
    }
  }
];

// 配置缓存
console.log("🔧 配置路由缓存...");

// 启用缓存（默认已启用）
enableCache(true);

// 设置缓存最大条目数（默认1000）
setCacheMaxSize(500);

// 设置缓存TTL（生存时间，默认5分钟）
setCacheTTL(10 * 60 * 1000); // 10分钟

// 清空缓存（可选）
clearCache();

// 启动服务器
serve({
  routes,
  hostname: "127.0.0.1",
  port: 8080,
  logger: {
    info: (...args) => console.log("[INFO]", ...args),
    debug: (...args) => console.log("[DEBUG]", ...args),
    error: (...args) => console.error("[ERROR]", ...args),
  },
});

// 定时打印缓存统计信息
setInterval(() => {
  const stats = getCacheStats();
  console.log("\n📊 缓存统计:");
  console.log(`   路由正则缓存: ${stats.routeRegexCache} 条目`);
  console.log(`   路由匹配缓存: ${stats.routeMatchCache} 条目`);
  console.log(`   参数提取缓存: ${stats.paramExtractCache} 条目`);
  console.log(`   总缓存条目: ${stats.routeRegexCache + stats.routeMatchCache + stats.paramExtractCache}`);
  console.log(`   配置: 最大 ${stats.config.maxSize} 条目, TTL: ${stats.config.ttl}ms`);
}, 30000); // 每30秒打印一次

console.log("\n🚀 服务器已启动: http://127.0.0.1:8080");
console.log("   测试端点:");
console.log("   - GET /users/123");
console.log("   - GET /posts/2023/12/25");
console.log("   - GET /search/hello");
console.log("   - GET /search/hello/p2");
console.log("\n💡 提示: 重复请求相同路径可以看到缓存效果");
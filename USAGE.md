# niba-api 使用说明

niba-api 是一个基于 Koa 的轻量级 RESTful API 开发框架，提供路由分发、中间件、认证、缓存等核心功能。

## 快速开始

### 安装

```bash
npm install niba-api
# 或
pnpm add niba-api
```

### 基础示例

```javascript
import { serve } from 'niba-api';

const routes = [
  {
    path: '/hello',
    method: 'GET',
    handler: async () => {
      return { message: 'Hello World!' };
    }
  },
  {
    path: '/users/:id',
    method: 'GET',
    handler: async (params) => {
      return { user: { id: params.id, name: 'Test User' } };
    }
  }
];

serve({
  routes,
  hostname: 'localhost',
  port: 3000
});
```

## 核心功能

### 1. 路由定义

路由支持路径参数和正则表达式：

```javascript
const routes = [
  // 简单路径
  { path: '/api/users', method: 'GET', handler: getUsers },
  
  // 路径参数
  { path: '/users/:id', method: 'GET', handler: getUser },
  
  // 可选参数
  { path: '/search/:query(/p:num)', method: 'GET', handler: search },
  
  // 多段参数
  { path: '/posts/:year/:month/:day', method: 'GET', handler: getPosts }
];
```

### 2. 中间件系统

框架内置多个中间件：

```javascript
import { authentication, dispatcher, rjson } from 'niba-api';

// 自定义中间件
const customMiddleware = async (ctx, next) => {
  console.log(`Request: ${ctx.method} ${ctx.path}`);
  await next();
};
```

### 3. 认证与授权

```javascript
serve({
  routes,
  userGetter: async (token) => {
    // 根据 token 获取用户信息
    return { id: 1, name: 'John Doe', roles: ['admin'] };
  },
  ACLGetter: async (user) => {
    // 获取用户访问控制列表
    return ['/api/*', '/users/*'];
  },
  tokenParser: (ctx) => {
    // 自定义 token 解析逻辑
    return ctx.headers.authorization?.replace('Bearer ', '');
  }
});
```

### 4. 缓存功能

```javascript
import { enableCache, setCacheMaxSize, setCacheTTL } from 'niba-api';

// 配置缓存
enableCache(true);
setCacheMaxSize(1000);      // 最大缓存条目数
setCacheTTL(5 * 60 * 1000); // 5分钟TTL

// 获取缓存统计
import { getCacheStats } from 'niba-api';
const stats = getCacheStats();
```

### 5. 日志系统

```javascript
import { setLogger } from 'niba-api';

// 自定义日志器
setLogger({
  info: (...args) => console.log('[INFO]', ...args),
  debug: (...args) => console.log('[DEBUG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args)
});
```

## 高级用法

### 自定义服务器创建

```javascript
import { createServer } from 'niba-api';

const server = createServer({
  routes,
  context: '/api/v1',  // API 前缀
  plugins: [customMiddleware],
  userGetter,
  ACLGetter
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 错误处理

框架内置错误处理中间件，支持自定义错误响应：

```javascript
const routes = [
  {
    path: '/error',
    method: 'GET',
    handler: async () => {
      throw new Error('Something went wrong');
    }
  }
];
```

### 加密工具

```javascript
import { encrypt, decrypt } from 'niba-api';

const encrypted = encrypt('secret data', 'password');
const decrypted = decrypt(encrypted, 'password');
```

## 配置选项

`serve()` 函数支持以下配置：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `routes` | Array | `[]` | 路由定义数组 |
| `context` | String | `''` | API 上下文路径前缀 |
| `plugins` | Array | `[]` | 自定义 Koa 中间件 |
| `hostname` | String | `'localhost'` | 监听主机名 |
| `port` | Number | `9090` | 监听端口 |
| `userGetter` | Function | `null` | 用户信息获取函数 |
| `ACLGetter` | Function | `null` | 访问控制列表获取函数 |
| `tokenParser` | Function | `null` | Token 解析函数 |
| `logger` | Object | `null` | 自定义日志器 |

## 开发脚本

```bash
# 运行测试
npm test

# 构建项目
npm run build

# 开发模式（监听文件变化）
npm start
```

## 示例

查看 `examples/` 目录获取更多使用示例：

```bash
node examples/cache-usage.js
```

## 许可证

Apache-2.0 License
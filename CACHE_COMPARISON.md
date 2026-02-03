# 项目中缓存框架对比分析

## 两个缓存框架

### 1. lru-cache (内存缓存)
**位置**: `src/middleware/dispatcher.js`
**用途**: 路由缓存（正则表达式、路由匹配、参数提取）

```javascript
import { LRUCache } from "lru-cache";

const routeRegexCache = new LRUCache({
  max: 1000,
  ttl: 5 * 60 * 1000,
  updateAgeOnGet: true,
});
```

**特点**:
- ✅ 纯内存存储，速度极快
- ✅ O(1) 时间复杂度
- ✅ 支持 TTL（生存时间）
- ✅ LRU 淘汰策略
- ❌ 进程重启后数据丢失
- ❌ 不支持跨进程共享

---

### 2. cacache (持久化缓存)
**位置**: `src/utils/cache.js`
**用途**: Token 认证缓存（防止 token 重放攻击）

```javascript
import cacache from "cacache";

export async function setText(key, value) {
  await cacache.put(cachePath, key, value + "");
}

export async function getText(key) {
  const { data } = await cacache.get(cachePath, key);
  return data.toString("utf-8");
}
```

**特点**:
- ✅ 持久化存储在磁盘
- ✅ 进程重启后数据保留
- ✅ 支持跨进程共享
- ✅ 自动压缩和去重
- ✅ 完整性和校验
- ❌ 速度比内存缓存慢
- ❌ 占用磁盘空间
- ❌ 需要 I/O 操作

---

## 使用场景分析

### cacache 的使用场景 - Token 认证

**代码** (`src/middleware/token.js`):
```javascript
// 创建 token 时，保存 SN
await cache.setText(`${uid}@${device}`, sn);

// 解析 token 时，验证 SN 是否过期
const lastSN = await cache.getText(`${uid}@${device}`);
if (parseInt(sn) < parseInt(lastSN)) {
  return null; // Token 已被使用
}
```

**为什么使用 cacache?**
1. **防止 token 重放攻击** - 需要持久化存储 SN
2. **进程重启不影响** - 服务重启后仍然有记录
3. **多进程/多实例** - 支持负载均衡场景
4. **长期存储** - TTL 可能很长（如 token 有效期）

---

## 能否用 lru-cache 替代？

### ❌ **不能完全替代**

原因：

1. **内存缓存不适合 token 场景**
   - Token 需要长期存储（可能数天或更久）
   - 服务重启后，所有 token 都会失效（用户体验差）
   - 多实例部署时，每个实例有自己的缓存

2. **cacache 的独特优势**
   - 持久化存储
   - 跨进程共享
   - 数据完整性校验
   - 自动压缩和去重

3. **lru-cache 的局限性**
   - 受限于内存大小
   - 进程重启数据丢失
   - 不适合长期存储

---

## 建议方案

### 方案 1: 保持现状（推荐） ✅

```
lru-cache  → 用于路由缓存（高频、短期）
cacache    → 用于 token 认证（低频、长期）
```

**优点**:
- 各自发挥优势
- 性能最优
- 适合不同场景

---

### 方案 2: 使用 Redis 统一缓存（可选）

如果项目需要：
- 多实例部署
- 分布式缓存
- 统一的缓存管理

可以考虑引入 Redis，将两者都迁移到 Redis：

```javascript
// 路由缓存（内存+Redis 二级缓存）
// Token 缓存（Redis 持久化）
```

**优点**:
- 统一管理
- 支持分布式
- 数据持久化

**缺点**:
- 增加外部依赖
- 复杂度提高
- 网络开销

---

### 方案 3: 混合方案（优化）

对 token 认证使用混合策略：

```javascript
// 一级缓存：lru-cache（最近访问的 token）
const recentTokens = new LRUCache({ max: 1000, ttl: 300000 });

// 二级缓存：cacache（所有 token）
await cacache.put(cachePath, key, value);

// 读取时先查 lru-cache
let value = recentTokens.get(key);
if (!value) {
  value = await cacache.get(cachePath, key);
  recentTokens.set(key, value);
}
```

**优点**:
- 热 token 响应更快
- 冷 token 仍然持久化
- 兼顾性能和可靠性

---

## 结论

**不建议用 lru-cache 完全替代 cacache**

理由：
1. 两者服务不同的场景
2. cacache 的持久化特性是必需的
3. lru-cache 不适合 token 认证场景

**最佳实践**:
- ✅ lru-cache 用于路由缓存（已完成）
- ✅ cacache 用于 token 认证（保持不变）
- 🔄 考虑引入 Redis（如果有分布式需求）

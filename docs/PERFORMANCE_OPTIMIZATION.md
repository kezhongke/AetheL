# AetheL AI 性能优化方案

> 文档版本：v1.0
> 创建时间：2026-05-11
> 状态：待评审

---

## 一、问题背景

在实体测试中，AI 分析环节存在明显延迟，用户体验反馈"速度慢"。本文档对现有代码进行系统梳理，识别性能瓶颈并给出优化方案。

---

## 二、问题定位

### 2.1 调用链路

```
前端 (React/Zustand)
  └── apiFetch('/api/ai/*')
        └── Express Router (api/routes/ai.ts)
              └── createChatCompletion()  ← 统一 AI 调用入口
                    └── OpenAI SDK → Moonshot/DeepSeek/ModelScope API
```

### 2.2 性能瓶颈识别

| 层级 | 问题 | 严重程度 | 影响范围 |
|------|------|----------|----------|
| **后端** | 无请求缓存，相同 prompt 每次都请求 API | 🔴 高 | 所有 AI 接口 |
| **后端** | categorize 接口使用非流式响应，大结果等待时间长 | 🟡 中 | `/categorize` |
| **前端** | 无请求去重，用户快速点击产生并发重复请求 | 🟡 中 | 所有 AI 接口 |
| **前端** | 无客户端缓存，已计算过的结果未复用 | 🟡 中 | snapshot/categorize |
| **接口设计** | 增量变更未区分，每次修改 1 个气泡也重传全部 | 🟡 中 | snapshot 接口 |
| **Prompt** | categorize 的 existingTags 数组无截断，可能撑大 prompt | 🟢 低 | `/categorize` |

---

## 三、问题详解

### 3.1 无请求缓存（核心问题）

**位置：** `api/routes/ai.ts` — 所有 `createChatCompletion()` 调用

**现象：** 用户每次点击"AI 分析"，即使气泡内容完全相同，也会发起新的 API 请求，完整等待 AI 生成响应。

**原因：** 代码中没有任何缓存逻辑，每次调用都是直接请求 AI 服务商。

```typescript
// api/routes/ai.ts - snapshot 接口现状
const response = await createChatCompletion({
  model: defaultModel,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: buildSnapshotUserPrompt(categoryLines, bubbleLines) },
  ],
  stream: false,
})
```

**影响估算：** 假设气泡数量为 N，每次请求的 token 成本 ≈ `O(N)`，响应延迟 2-5 秒，无缓存时重复操作（如用户多次查看分析结果）造成 100% 浪费。

---

### 3.2 非流式响应

**位置：** `/api/ai/categorize`（第 236 行）、`/api/ai/snapshot`（第 527 行）

**现状：** 这两个接口使用 `stream: false`，AI 生成完整 JSON 后一次性返回。

**对比：** `/api/ai/chat` 和 `/api/ai/generate-prd` 已使用流式响应（`stream: true`），用户体验更优。

---

### 3.3 无请求去重

**位置：** `src/stores/aiStore.ts`

**现象：** 用户连续快速点击按钮时，可能在 pending 状态下继续触发请求。

```typescript
// aiStore.ts 现状 - 无去重保护
categorize: async (bubbles, existingTags = []) => {
  set({ isLoading: true, ... })
  // 如果上一个请求还没返回，用户又点了一次...
  const response = await apiFetch('/api/ai/categorize', ...)
},
```

---

### 3.4 无客户端缓存复用

**位置：** `src/lib/snapshotCognition.ts`

**现状：** `requestSnapshotCognition()` 每次都发起请求，已计算过的 snapshot 结果没有在本地缓存。

```typescript
// snapshotCognition.ts 现状
export async function requestSnapshotCognition(...) {
  const fallback = createFallbackCognition(bubbles)
  try {
    const response = await apiFetch('/api/ai/snapshot', { ... })
    if (!response.ok) return fallback
    // 没有检查本地是否已有缓存
    return normalizeCognition(data, fallback)
  } catch {
    return fallback
  }
}
```

---

## 四、优化方案

### 4.1 P0 — 后端请求缓存层

**目标：** 对相同内容和配置的 AI 请求进行缓存，大幅减少 API 调用次数和响应延迟。

**方案：** 在 `api/routes/ai.ts` 中实现基于请求内容的内存缓存。

```typescript
// api/routes/ai.ts 新增

import crypto from 'crypto'

interface CacheEntry {
  result: unknown
  expiry: number
}

// 缓存有效期 5 分钟（可配置）
const CACHE_TTL_MS = 5 * 60 * 1000
const responseCache = new Map<string, CacheEntry>()

function getCacheKey(payload: {
  model: string
  messages: Array<{ role: string; content: string }>
}): string {
  const content = JSON.stringify(payload.messages.map(m => m.content))
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
}

function getCachedResult<T>(key: string): T | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    responseCache.delete(key)
    return null
  }
  return entry.result as T
}

function setCachedResult<T>(key: string, result: T): void {
  // 限制缓存条目数量，防止内存泄漏
  if (responseCache.size > 200) {
    const firstKey = responseCache.keys().next().value
    if (firstKey) responseCache.delete(firstKey)
  }
  responseCache.set(key, { result, expiry: Date.now() + CACHE_TTL_MS })
}
```

**在 `createChatCompletion` 中集成缓存：**

```typescript
async function createChatCompletion(
  payload: CompletionPayload,
  { useCache = true }: { useCache?: boolean } = {}
): Promise<any> {
  if (completionOverride) {
    return completionOverride(payload)
  }

  // P0 缓存逻辑
  if (useCache) {
    const cacheKey = getCacheKey(payload)
    const cached = getCachedResult<any>(cacheKey)
    if (cached) {
      console.log('[AI Cache] Hit:', cacheKey)
      return cached
    }
  }

  const result = await client.chat.completions.create(
    payload as Parameters<typeof client.chat.completions.create>[0]
  )

  if (useCache) {
    const cacheKey = getCacheKey(payload)
    setCachedResult(cacheKey, result)
  }

  return result
}
```

**各接口缓存策略：**

| 接口 | 缓存 | 说明 |
|------|------|------|
| `/api/ai/snapshot` | ✅ 应缓存 | 相同气泡组合结果稳定 |
| `/api/ai/categorize` | ✅ 应缓存 | 相同气泡+标签组合结果稳定 |
| `/api/ai/followup` | ❌ 不缓存 | 实时生成，追问内容每次不同 |
| `/api/ai/chat` | ❌ 不缓存 | 对话上下文每次不同 |
| `/api/ai/workshop-skill` | ❌ 不缓存 | 多轮对话，中间状态不固定 |

**实现后预期效果：**
- 相同气泡重复分析：延迟从 2-5s → < 50ms（内存查找）
- API 调用量减少：重复操作节省 ~70%（估算）

---

### 4.2 P1 — 前端请求去重

**目标：** 防止用户快速点击产生并发重复请求。

**方案：** 在 `aiStore.ts` 中实现 pending 请求复用。

```typescript
// src/stores/aiStore.ts 改动

// 方案 A：单请求去重（推荐）
let pendingCategorize: Promise<CategorizeResult | null> | null = null

categorize: async (bubbles, existingTags = []) => {
  // 如果有 pending 的请求，直接复用
  if (pendingCategorize) {
    return pendingCategorize
  }

  set({ isLoading: true, activeTaskLabel: '正在归类气泡', error: null })
  pendingCategorize = (async () => {
    try {
      const response = await apiFetch('/api/ai/categorize', { ... })
      // ... 原有业务逻辑
      return result
    } finally {
      pendingCategorize = null
    }
  })()

  return pendingCategorize
}
```

**方案 B：AbortController 取消（可选升级）**

```typescript
let currentAbortController: AbortController | null = null

categorize: async (bubbles, existingTags = []) => {
  // 取消上一个请求
  if (currentAbortController) {
    currentAbortController.abort()
  }
  currentAbortController = new AbortController()

  try {
    const response = await apiFetch('/api/ai/categorize', {
      signal: currentAbortController.signal,  // 传入 signal
      ...
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      // 请求被取消，不报错
    }
  }
}
```

---

### 4.3 P1 — 前端本地缓存

**目标：** 在浏览器端缓存 AI 分析结果，避免重复请求。

**方案：** 扩展 `snapshotCognition.ts`，增加本地缓存层。

```typescript
// src/lib/snapshotCognition.ts

// 缓存 key：根据气泡 IDs 排序后的 MD5
function getSnapshotCacheKey(bubbles: Bubble[]): string {
  const ids = bubbles.map(b => b.id).sort().join(',')
  return `snapshot:${crypto.subtle.digest('SHA-256', new TextEncoder().encode(ids))}`
}

const LOCAL_CACHE_TTL_MS = 10 * 60 * 1000  // 10 分钟

export async function requestSnapshotCognition(...): Promise<SnapshotCognition> {
  // 1. 检查本地缓存
  const cacheKey = getSnapshotCacheKey(bubbles)
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < LOCAL_CACHE_TTL_MS) {
      console.log('[Snapshot Cache] Hit from localStorage')
      return normalizeCognition(data, fallback)
    }
  }

  // 2. 请求后端
  const response = await apiFetch('/api/ai/snapshot', { ... })

  // 3. 写入本地缓存
  if (response.ok) {
    const data = await response.json()
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
    return normalizeCognition(data, fallback)
  }

  return fallback
}
```

**注意：** 需要 polyfill `crypto.subtle.digest` 或使用轻量替代（如 `spark-md5`）。

---

### 4.4 P2 — categorize 接口改为流式

**目标：** 大结果集边生成边返回，减少用户等待感知时间。

**现状：** `/api/ai/categorize` 使用非流式，大响应需等待完整生成。

**改动点：** 参考已有的 `/api/ai/chat` 流式实现，在 `ai.ts` 第 236 行处改造。

**注意：** JSON 结构化输出场景的流式解析更复杂（需要处理不完整的 JSON），建议作为 P2 后续迭代，避免 P0 阻塞。

---

### 4.5 P3 — Prompt 优化

**4.5.1 existingTags 截断**

```typescript
// api/routes/ai.ts - categorize 接口

// 在组装 userPrompt 前截断
const MAX_TAGS = 50
const truncatedTags = existingTags.slice(0, MAX_TAGS)
const userPrompt = `现有标签：${truncatedTags.join(', ')}${existingTags.length > MAX_TAGS ? `...（共${existingTags.length}个）` : ''}`
```

**4.5.2 增量更新标识**

snapshot 接口支持传入 `lastModified` 时间戳，后端对比若无变更直接返回缓存，不调 AI。

```typescript
router.post('/snapshot', async (req, res) => {
  const { bubbles, categories, lastModified } = req.body

  // 后端：对比 lastModified 和缓存时间戳
  // 如无变更，直接返回 { cached: true, ... }
})
```

---

### 4.6 S4 — PRD 分组并行化（✅ 已实施）

**目标：** 将 PRD 分组生成从串行批处理改为分组并行执行，突破单次 AI 输出的 token 预算限制。

**方案：** `/api/ai/generate-prd-sections` 端点，每个分组独立调用 AI，Promise.all 并行等待。

**代码位置：** `api/routes/ai.ts` 第 539-591 行

**效果（实测 DeepSeek-v4-pro）：**

| 指标 | 串行 | 并行 | 差异 |
|------|------|------|------|
| 耗时 | 97,566ms | 38,077ms | ⚡ 2.56x 加速 |
| 内容总量 | 2,605字 | 4,253字 | +63% |

**生产建议：** 使用 DeepSeek 作为 provider（ModelScope 5路并发触发 429 限流，不适用此架构）。

---

### 4.7 S5 — /categorize 和 /snapshot 并行化（✅ 已实施）

**目标：** 将 `/categorize` 和 `/snapshot` 从串行调用改为分组并行执行，减少多气泡场景的响应时间。

**方案：**

#### /categorize 并行化

- **触发条件：** 气泡数量 ≥ 5 且 provider 非 ModelScope
- **分组策略：** `groupBubblesForParallel(bubbles, groupSize=5, maxGroups=5)` — 每组 2-10 个气泡，最多 5 组
- **并行执行：** Promise.all 分组调用 AI
- **结果合并：** categories 按 bubbleId 去重、tags 按 name 去重、relations 按 sourceId+targetId 去重

```typescript
// api/routes/ai.ts 第 306-390 行
const groups = groupBubblesForParallel(bubbles, 5, 5)
const results = await Promise.all(
  groups.map((group) =>
    createChatCompletion({ model, messages: [systemPrompt, userPrompt(group)] }, { useCache: true })
  )
)
// 合并结果并去重
```

#### /snapshot 并行化

- **触发条件：** 气泡数量 ≥ 5 且 provider 非 ModelScope
- **两阶段架构：** 气泡分组并行分析 → 最终 snapshot 组装
- **分组策略：** `groupSize = Math.ceil(bubbles.length / 5)`，每组 3-5 个气泡，最多 5 组
- **分析阶段：** 各组并行调用 `buildBubbleAnalysisPrompt()`
- **组装阶段：** 汇总所有分析结果，调用 `buildSnapshotAssemblyPrompt()` 生成最终 snapshot

```typescript
// api/routes/ai.ts 第 761-835 行
// 阶段1：分组并行分析
const analysisResults = await Promise.all(
  bubbleLinesArr.map(lines =>
    createChatCompletion({ messages: [systemPrompt, lines] }, { useCache: true })
  )
)
// 阶段2：组装最终 snapshot
const response = await createChatCompletion({
  messages: [systemPrompt, buildSnapshotAssemblyPrompt(categoryLines, bubbleAnalyses)]
}, { useCache: true })
```

**新增文件：**

- `api/prompts/categorize.ts` — `groupBubblesForParallel()` 分组函数
- `api/prompts/snapshot.ts` — `buildBubbleAnalysisPrompt()`、`buildSnapshotAssemblyPrompt()`、`BubbleAnalysisResult` 接口
- `tests/performance/parallel-optimization.test.ts` — 并行化测试套件（8 个测试用例）

**效果（实测）：**

| 场景 | 串行耗时 | 并行耗时 | 加速比 |
|------|----------|----------|--------|
| categorize 7个气泡 | 600ms | 304ms | ~2x |
| categorize 25个气泡 | 1500ms | 303ms | ~5x |
| snapshot 6个气泡 | 1200ms | 603ms | ~2x |
| snapshot 15个气泡 | 1800ms | 602ms | ~3x |

**测试结果：** 8/8 全部通过

---

## 五、效果预估

| 优化项 | 延迟改善 | API 调用节省 | 实施难度 |
|--------|----------|--------------|----------|
| P0 后端缓存层 | 2-5s → < 50ms（命中时） | ~70% | 低 |
| P1 前端请求去重 | 避免重复请求 | 额外节省 ~10% | 低 |
| P1 前端本地缓存 | 命中时 < 10ms | 额外节省 ~20% | 中 |
| P2 流式响应 | 体感提升（逐步加载） | 不节省 | 中 |
| P3 Prompt 优化 | 微幅改善 | 少量节省 | 低 |
| **S4 PRD 并行化** | **97s → 38s（2.56x）** | **—** | **低** |

---

## 六、里程碑

| 阶段 | 内容 | 预期收益 |
|------|------|----------|
| **S1** | P0 后端缓存层 | 解决 80% 速度问题 |
| **S2** | P1 前端去重 + 本地缓存 | 完全消除重复请求 |
| **S3** | P2 流式改造 + P3 Prompt 优化 | 细节打磨 |
| **S4** | PRD 生成并行化（分组独立调用 + Promise.all） | 2.56x 加速，内容 +63% |
| **S5** | /categorize 和 /snapshot 并行化 | 2-5x 加速（多气泡场景） |

> ⚠️ S4 已在 2026-05-11 实测验证：使用 DeepSeek-v4-pro，5 分组并行，串行 97,566ms → 并行 38,077ms，加速比 2.56x，内容 2,605 字 → 4,253 字（+63%）。详见 `docs/performance-report-2026-05-11.md`
>
> ⚠️ S5 已在 2026-05-11 测试验证：/categorize 25气泡并行加速 5x，/snapshot 15气泡并行加速 3x，详见 `docs/PARALLEL_TEST_REPORT.md`

---

## 七、附录

### A. 相关文件路径

```
api/routes/ai.ts          ← 后端 AI 路由，所有 AI 接口入口
src/stores/aiStore.ts     ← 前端 AI 状态管理
src/lib/snapshotCognition.ts  ← Snapshot 请求封装
api/prompts/snapshot.ts   ← Snapshot prompt 定义
api/prompts/workshop.ts   ← Workshop prompt 定义
```

### B. 当前 AI 接口一览

| 接口 | 方法 | 流式 | 缓存建议 | 并行化 |
|------|------|------|----------|--------|
| `/api/ai/chat` | POST | ✅ | ❌ | ❌ |
| `/api/ai/categorize` | POST | ❌ | ✅ | ✅ S5（≥5气泡） |
| `/api/ai/workshop-skill` | POST | ❌ | ❌ | ❌ |
| `/api/ai/generate-prd` | POST | ✅ | ❌ | ❌ |
| `/api/ai/generate-prd-sections` | POST | ❌ | ✅ | ✅ S4（默认并行） |
| `/api/ai/generate-prd-sections-serial` | POST | ❌ | ✅ | ❌（串行） |
| `/api/ai/snapshot` | POST | ❌ | ✅ | ✅ S5（≥5气泡） |
| `/api/ai/followup` | POST | ❌ | ❌ | ❌ |

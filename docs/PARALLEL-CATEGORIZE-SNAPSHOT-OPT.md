# PRD Sections 并行化优化总结

> 目标：将气泡按语义分成小组，每组并行调用 AI，最后合并结果
> 效果：N 组气泡时间从 `N × T` → `max(T_i)`

## 实现方案

### 核心策略

1. **分组并行**：将气泡按语义分成小组（每组 3-5 个气泡）
2. **并发执行**：每组独立调用 AI，`Promise.all` 并行等待
3. **结果合并**：按原始顺序合并各组结果
4. **ModelScope 降级**：检测到 ModelScope 时自动降级为串行（避免 429）

### 代码实现

```typescript
// 分组策略：按标签语义分组，每组不超过 5 个气泡
function groupBubblesForCategorize(bubbles, targetGroupCount = 5) {
  const groups: Array<Array<typeof bubbles[0]>> = []
  const groupSize = Math.ceil(bubbles.length / targetGroupCount)
  
  for (let i = 0; i < bubbles.length; i += groupSize) {
    groups.push(bubbles.slice(i, i + groupSize))
  }
  
  return groups
}

// 并行执行
const results = await Promise.all(
  groups.map(group => createChatCompletion({...}, { useCache: true }))
)

// 合并结果
const allCategories = results.flatMap(r => r.categories)
const allTags = results.flatMap(r => r.suggestedTags)
const allRelations = results.flatMap(r => r.relations)
```

### 关键细节

| 细节 | 处理方式 |
|------|---------|
| **分组大小** | 每组 3-5 个气泡，避免单组 prompt 过长 |
| **并行数量** | 最多 5 组并发（与 generate-prd-sections 一致） |
| **缓存策略** | 每组结果独立缓存，key 基于 group 内容 |
| **结果合并** | 直接 concat + 去重（按 bubbleId） |
| **异常处理** | `Promise.allSettled` 避免一个失败导致整体失败 |
| **降级条件** | ModelScope provider 时自动串行执行 |

### 性能预期

| 指标 | 串行 | 并行（5组） | 提升 |
|------|------|------------|------|
| 10 个气泡 | 10 × T | max(T_i) | ~10x |
| 20 个气泡 | 20 × T | max(T_i) | ~20x |
| Token 消耗 | 1x | ~1.2x（多组 system prompt） | -20% |

---

# Snapshot 并行化优化规划

## 当前状态

`/api/ai/snapshot` 当前为串行处理：
1. 气泡格式化 → 单次 AI 调用 → 解析结果

问题：多气泡时等待时间长，无法利用 AI 并行能力。

## 优化策略

### 方案：气泡级并行 + 结构组装

将 snapshot 处理分为两阶段：

**阶段 1：气泡并行解析**
- 每个气泡独立调用 AI（或每 3 个气泡为一组并行）
- `Promise.all` 并行执行，结果各自缓存

**阶段 2：结构化组装**
- 将所有气泡解析结果合并
- 生成 `statusSnapshot`、`logicFlow`、`cognitiveGaps`
- 生成 `semanticAnchors`、`level2`、`level3`

```typescript
// 阶段 1：气泡并行解析
const bubbleResults = await Promise.all(
  bubbles.map(bubble => analyzeBubble(bubble)) // 每气泡独立 AI 调用
)

// 阶段 2：组装 snapshot
const snapshotPrompt = buildSnapshotAssemblyPrompt(bubbleResults)
const snapshot = await createChatCompletion({...}, { useCache: false })
```

### 分组策略

| 气泡数量 | 分组方式 | 并行数 |
|---------|---------|--------|
| 1-5 | 每气泡独立 | 5 |
| 6-10 | 每 2 个气泡一组 | 5 |
| 11-20 | 每 3-4 个气泡一组 | 5 |

### 异常处理

使用 `Promise.allSettled`，单个气泡失败不影响整体：

```typescript
const results = await Promise.allSettled(
  groups.map(group => analyzeGroup(group))
)

const fulfilled = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value)
```

### 降级策略

- **ModelScope**：串行执行（避免 429）
- **气泡 ≤ 3**：串行（并行开销不划算）
- **超时处理**：设置 30s 超时，超时后使用 fallback

### 性能预期

| 场景 | 串行 | 并行（5组） | 提升 |
|------|------|------------|------|
| 10 个气泡 | 10 × T | max(T_i) + 组装 | ~8x |
| 20 个气泡 | 20 × T | max(T_i) + 组装 | ~15x |
| Token 消耗 | 1x | ~1.1x（组装 prompt） | -10% |

---

# 实施计划

## Phase 1: `/categorize` 并行化

**文件**: `api/routes/ai.ts`

**修改**:
1. 新增 `groupBubblesForCategorize()` 辅助函数
2. 新增 `/categorize-parallel` 端点（可选，保留原接口作为 fallback）
3. 原 `/categorize` 改为检测气泡数量，自动选择串行/并行

**验证**:
- [ ] 5 组气泡并行调用成功
- [ ] 结果与串行一致
- [ ] ModelScope 降级正常

## Phase 2: `/snapshot` 并行化

**文件**: `api/routes/ai.ts`, `api/prompts/snapshot.ts`

**修改**:
1. 新增 `analyzeBubbleGroup()` 函数
2. 新增 `buildSnapshotAssemblyPrompt()` 组装 prompt
3. 原 `/snapshot` 逻辑拆分为两阶段

**验证**:
- [ ] 气泡级并行执行成功
- [ ] snapshot 结果结构完整
- [ ] 失败时 graceful degradation

## Phase 3: 文档更新

- 更新 `docs/PERFORMANCE_OPTIMIZATION.md`
- 更新 `docs/MULTI-API-INTEGRATION.md`
- 补充性能测试数据

---

# 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| ModelScope 429 | 中 | 中 | 自动降级串行 |
| 并行结果不一致 | 低 | 高 | 合并时按 bubbleId 去重 |
| 单气泡失败影响全局 | 低 | 中 | Promise.allSettled + fallback |
| Token 消耗增加 | 中 | 低 | 监控并优化分组策略 |
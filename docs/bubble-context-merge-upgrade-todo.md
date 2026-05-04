# 灵感气泡与上下文管理合并升级 TODO

## 目标结论

将产品形态明确为“面向产品构思的 AI 认知工作区 / AI cognitive workspace for product thinking”，并将“上下文管理”从独立主模块调整为“灵感气泡”的核心能力之一。

合并后的产品心智：

- 灵感气泡是主工作区，负责捕捉、组织、联想、沉淀与恢复产品构思现场。
- 上下文管理成为工作区的“记忆层”“快照层”“语义压缩层”。
- 独立的上下文页面保留为“快照历史库”，用于批量浏览、恢复、删除、回顾。
- 目标用户是产品经理、创业者、设计师、独立开发者和需要把模糊想法推进为产品方案的构建者。

不建议直接删除上下文模块，而是采用“主体验合并，历史库保留”的渐进式方案。

## 设计原则

- 工作流不跳页：用户在气泡空间内即可创建快照、查看语义脉络、恢复上下文。
- 渐进式披露：默认只展示 Level 1，用户主动展开后才进入 Level 2/3。
- 语义优先：快照不是时间归档，而是围绕语义锚点、逻辑脉络、认知缺口组织。
- 可回退：AI 不可用时，仍能用本地 fallback 创建基础快照。
- 低认知噪音：快照能力应像工具层一样嵌入，不抢占画布主体验。

## 2026-05-05 当前实现记录

本轮重点从“新增快照能力”转向“统一气泡工作区交互心智”：

- [x] 将气泡空间、快照库、PRD 页面统一到同一套 liquid glass / warm red UI 语言。
- [x] 将左右浮窗、顶部菜单、底部 AI 输入框统一为悬浮工具层，画布保持底层主工作区。
- [x] 将“标签 / AI 归类 / 快照”调整为右侧浮窗入口，快照创建在工作区内完成。
- [x] 认知快照面板支持从画布选区直接带入气泡集合，默认打开创建态。
- [x] 底部 AI 输入框显示当前气泡上下文，支持改写、追加补充、继续追问。
- [x] 底部 AI 输入框显示已选气泡条，气泡条支持边界淡出、隐藏滚动条、单个 `x` 移出。
- [x] 取消气泡条 hover 上浮弹动，仅保留轻量颜色/阴影反馈。
- [x] 初步合并“选中交互”和“编辑交互”：单击气泡会同步成为底部 AI 处理对象，并进入同一组选中上下文；选区模式继续负责多选和框选。
- [x] 快照卡片在右侧窄面板内使用 compact 布局，避免文字挤压和纵向断裂。
- [x] AI 归类后分类颜色同步到气泡、标签和分类，不同类别使用不同颜色。

当前交互结论：

- 单个气泡：点击即进入“当前处理对象”，底部 AI 输入框切换为改写/补充/追问。
- 多个气泡：选区工具负责多选，底部显示气泡条，右侧快照面板自动使用该集合。
- 气泡条中的某个气泡：点击可切换主处理对象，点 `x` 仅移出当前选区。
- 仍保留拖拽、编辑、选区三个工具按钮，但它们应被视为同一上下文系统下的不同操作方式，而不是三套独立状态。

下一步建议：

- [ ] 把选中集合提升到 Zustand store，而不是由 `BubbleCanvas` 本地 state 与 `BubbleSpace` 透传维护。
- [ ] 为“主处理气泡”和“多选集合”建立明确命名，例如 `activeBubbleId` 与 `selectedBubbleIds`。
- [ ] 将当前画布双击顶部编辑框弱化或并入底部 AI 输入框，避免“顶部保存”和“底部改写”形成重复编辑入口。
- [ ] 补充针对选区、气泡条移除、快照预选集合的组件或集成测试。

## 阶段 0：现状收敛

- [x] 确认当前所有相关改动通过 `npm run check`。
- [x] 确认本地后端端口策略，避免 `3000` 占用导致 AI 快照接口不可用。
- [x] 确认 `vite.config.ts` 代理目标与后端实际端口一致。
- [x] 梳理现有未提交改动，区分 bugfix、AI 能力、UI 合并三类。

验收标准：

- [x] `灵感气泡` 添加气泡后画布正常显示。
- [x] 追问弹窗从页面中心缩放弹出。
- [x] PRD 生成能读取所选气泡内容、标签和追问补充。
- [x] 上下文页面能创建带语义结构的快照。

## 阶段 1：信息架构调整

- [x] 将导航里的“上下文”重新命名为“快照库”或“历史快照”。
- [x] 保留 `/context` 路由，但降低其主导航权重。
- [x] 在 `灵感气泡` 页面加入快照入口，作为主工作区工具。
- [x] 明确两个入口的职责：
  - `灵感气泡`：日常创建、快速恢复、查看当前工作区语义状态。
  - `快照库`：历史浏览、深度回顾、批量管理、删除/重命名。

建议 UI：

- [x] 在画布工具栏增加“创建快照”按钮。
- [ ] 在右侧 AI 面板增加“当前上下文”折叠区。
- [x] 在气泡详情侧栏中显示该气泡参与过的快照数量和权重。
- [x] 在画布底部状态栏显示最近快照名称与恢复入口。

验收标准：

- [x] 用户不离开 `灵感气泡` 页面也能完成快照创建。
- [x] 用户可以从 `灵感气泡` 页面恢复最近快照。
- [x] `/context` 页面仍能管理所有历史快照。

## 阶段 2：工作区内快照能力

- [x] 新增 `SnapshotPanel` 组件。
- [x] 新增 `SnapshotCreateDialog` 或轻量 popover。
- [x] 支持选择当前工作区内的气泡集合。
- [x] 默认选择全部可见气泡。
- [x] 支持按标签、分类、选区过滤快照范围。
- [x] 快照创建时传入：
  - 气泡 ID
  - 气泡内容
  - 标签
  - 分类
  - 追问补充
  - 关系线
  - 视口位置
  - 交互权重

组件建议：

```text
src/components/snapshot/
├─ SnapshotPanel.tsx
├─ SnapshotCreateDialog.tsx
├─ SnapshotCard.tsx
├─ SnapshotWakeTrigger.tsx
└─ SnapshotLevelDisclosure.tsx
```

验收标准：

- [x] 创建快照时不需要跳转页面。
- [x] 快照能正确保存当前 viewport。
- [x] 快照能保存所选气泡集合，而不是强制保存全部气泡。
- [x] AI 失败时仍创建 fallback 快照。

## 阶段 3：渐进式披露模型

- [x] 将 Level 1/2/3 展示能力抽成通用组件。
- [ ] Level 1 展示：
  - 快照名
  - 一句话状态快照
  - 3-5 个语义锚点
  - 气泡/标签/分类数量
- [ ] Level 2 展示：
  - 逻辑脉络
  - 语义锚点说明
  - 认知待办/缺口
  - 唤醒指令
- [ ] Level 3 展示：
  - 原始气泡内容
  - 追问补充
  - 关系线依据
  - 深层因果或历史变更记录

交互约束：

- [x] Level 2 严禁默认展示 Level 3 的原始长文本。
- [x] Level 3 必须由显式点击“深入探查”触发。
- [x] 快照卡片展开状态保持在本地 UI state，不污染快照数据。

验收标准：

- [x] 快照列表默认信息密度轻。
- [x] 展开 Level 2 后能理解该快照为什么重要。
- [x] Level 3 能追溯到具体气泡和补充信息。

## 阶段 4：权重机制升级

当前已具备轻量 `interactionWeight`，后续升级为多维权重。

- [ ] 新增 `BubbleInteractionStats` 数据结构。
- [ ] 记录以下行为：
  - 被点击查看次数
  - 被编辑次数
  - 被纳入快照次数
  - 被用于 PRD 次数
  - 被 AI 归类命中次数
  - 被恢复快照带回次数
- [ ] 计算综合权重：

```text
score =
  viewCount * 1
  + editCount * 2
  + snapshotCount * 3
  + prdUsageCount * 4
  + relationCount * 2
```

- [x] 快照摘要中优先考虑高权重气泡。
- [x] Level 3 默认优先展示高权重气泡。
- [ ] 在 UI 中避免过度暴露数字，只显示“高频线索”或“核心气泡”。

验收标准：

- [ ] 高频气泡更容易进入语义锚点。
- [ ] 高频气泡在 Level 3 中置顶。
- [ ] 权重机制不影响普通气泡的可见性。

## 阶段 5：AI 提示词与接口整理

- [ ] 将快照提示词从路由文件中抽离。
- [ ] 新增 prompt 模块：

```text
api/prompts/
├─ snapshot.ts
├─ prd.ts
├─ categorize.ts
└─ followup.ts
```

- [ ] 快照接口继续使用 `POST /api/ai/snapshot`。
- [ ] 输入结构标准化：

```ts
interface SnapshotInput {
  bubbles: Array<{
    id: string
    content: string
    tag?: string
    categoryName?: string
    interactionWeight?: number
    extensions?: string[]
  }>
  categories: Array<{
    id: string
    name: string
    description?: string
  }>
  relations: Array<{
    sourceId: string
    targetId: string
    type: string
    reason: string
  }>
}
```

- [ ] 输出结构标准化：

```ts
interface SnapshotCognition {
  statusSnapshot: string
  logicFlow: string
  cognitiveGaps: string[]
  semanticAnchors: SnapshotAnchor[]
  wakeTrigger: string
  level2: SnapshotDetailLayer[]
  level3: SnapshotDeepLayer[]
}
```

- [ ] 对 AI JSON 结果做运行时校验和容错。
- [ ] 对过长气泡内容做截断或分批压缩。

验收标准：

- [ ] 路由文件不再堆大量 prompt 文本。
- [ ] AI 返回不规范 JSON 时有 fallback。
- [ ] 快照生成 prompt 能读取内容、标签、补充、关系、权重。

## 阶段 6：状态管理与数据持久化

当前 Zustand store 没有持久化，刷新后数据会丢失。合并后快照价值更高，需要补齐持久化。

- [x] 为 `bubbleStore` 增加 localStorage 持久化。
- [x] 为 `snapshotStore` 增加 localStorage 持久化。
- [x] 设计数据版本号：

```ts
interface PersistedState {
  version: number
  bubbles: Bubble[]
  snapshots: Snapshot[]
}
```

- [x] 提供旧数据迁移：
  - 无 `interactionWeight` 的气泡补 0。
  - 无 `cognition` 的快照生成 fallback。
- [x] 避免存储大型 canvas 截图或过大 AI 输出。

验收标准：

- [x] 刷新页面后气泡仍在。
- [x] 刷新页面后快照仍在。
- [x] 老快照不会导致页面崩溃。

## 阶段 7：Markdown 知识原子持久层

目标：将每个气泡升级为一个独立 Markdown 文档，使气泡从前端 UI 状态变成可版本化、可迁移、可长期演化的知识原子。

核心判断：

- 这个方向合理，适合 Aethel 的“认知工作区”定位。
- 不建议把 Markdown 当高频 UI 数据库使用。
- 推荐采用双层架构：
  - Zustand 负责前端交互和即时渲染。
  - Markdown 负责气泡内容、语义元数据和长期存储。
  - JSON 负责高频画布布局、视口、拖拽位置等运行时状态。

推荐文件结构：

```text
data/
├─ bubbles/
│  ├─ bubble_abc.md
│  ├─ bubble_def.md
│  └─ bubble_xyz.md
├─ snapshots/
│  ├─ snapshot_001.md
│  └─ snapshot_002.md
└─ workspace.json
```

职责划分：

- `data/bubbles/*.md`：每个气泡一个文档，保存内容、标签、分类、追问补充、语义关系和低频元数据。
- `data/workspace.json`：保存高频画布状态，如坐标、缩放、当前筛选、当前选中、面板状态。
- `data/snapshots/*.md`：保存快照摘要、语义锚点、唤醒指令，并引用一组 bubble IDs。

气泡 Markdown schema 草案：

```md
---
id: bubble_abc
title: AI 辅助内容生产
tag: 人机分工边界
categoryId: category_xxx
color: "#246a52"
interactionWeight: 3
createdAt: 2026-05-04T08:00:00.000Z
updatedAt: 2026-05-04T08:30:00.000Z
---

# AI 辅助内容生产

原始气泡内容……

## 追问补充

- 追问：目标用户是谁？
  回答：新手内容编辑、运营同学……

## 关系

- related: bubble_def，因为……
- contradictory: bubble_xyz，因为……
```

快照 Markdown schema 草案：

```md
---
id: snapshot_001
name: 新手内容生产工作区
createdAt: 2026-05-04T08:40:00.000Z
bubbleIds:
  - bubble_abc
  - bubble_def
semanticAnchors:
  - 人机分工
  - 内容生成
---

# 当前状态快照

一句话定义该工作区的核心议题。

## 逻辑脉络

从……出发，我们穿过……，最终汇聚于……

## 认知待办/缺口

- 需要明确……

## 唤醒指令

你上次在这里讨论到……
```

后端文件 API 规划：

- [ ] 新增 `api/routes/bubbles.ts`。
- [ ] 新增 `api/routes/snapshots.ts` 或合并到 `api/routes/workspace.ts`。
- [ ] 新增 Markdown 读写工具模块：

```text
api/storage/
├─ markdown.ts
├─ bubbleFiles.ts
├─ snapshotFiles.ts
└─ workspaceFile.ts
```

- [ ] API 设计：

```text
GET    /api/bubbles
GET    /api/bubbles/:id
POST   /api/bubbles
PATCH  /api/bubbles/:id
DELETE /api/bubbles/:id

GET    /api/workspace
PATCH  /api/workspace

GET    /api/snapshots
POST   /api/snapshots
PATCH  /api/snapshots/:id
DELETE /api/snapshots/:id
```

- [ ] 依赖选择：
  - 使用 `gray-matter` 解析 frontmatter。
  - 使用 Node `fs/promises` 读写文件。
  - 文件名使用 `id`，不要使用用户输入标题直接作为文件名。

前端迁移策略：

- [ ] 页面启动时调用 `GET /api/bubbles` 和 `GET /api/workspace`，恢复 Zustand。
- [ ] 创建气泡时先更新 Zustand，再异步 `POST /api/bubbles`。
- [ ] 编辑气泡内容、标签、追问补充时 debounce 后 `PATCH /api/bubbles/:id`。
- [ ] 拖拽、缩放、筛选等高频状态只写 `workspace.json`，不要频繁改 Markdown。
- [ ] 快照创建时写 `data/snapshots/*.md`，快照引用 bubble IDs，不复制大量气泡正文。

写入节流与冲突控制：

- [ ] 气泡正文和标签编辑使用 500-1000ms debounce。
- [ ] 拖拽位置只在 drag end 或定时批量保存。
- [ ] 后端写文件时使用临时文件 + rename，降低半写入风险。
- [ ] 同一个气泡的并发写入排队处理。
- [ ] 文件写入失败时 UI 显示轻量保存失败状态，Zustand 不立即回滚。

Git 友好策略：

- [ ] Markdown 文档保持稳定字段顺序，减少 diff 噪音。
- [ ] 高频坐标不写入 bubble md，避免每次拖拽都产生文档 diff。
- [ ] `workspace.json` 可选择纳入 Git，也可加入 `.gitignore`，根据产品定位决定。
- [ ] 为导入/导出预留 `Export Markdown Vault` 能力。

安全与路径约束：

- [ ] 所有文件写入限制在项目内 `data/` 目录。
- [ ] 后端 API 禁止接收任意文件路径。
- [ ] 删除气泡时先移动到 `data/.trash/`，二次确认后再物理删除。
- [ ] Markdown 正文允许用户内容，但 frontmatter 字段必须经过白名单序列化。

验收标准：

- [ ] 每创建一个气泡，`data/bubbles/` 下生成一个对应 `.md` 文件。
- [ ] 刷新页面后，气泡从 Markdown + workspace JSON 恢复。
- [ ] 编辑气泡内容后，对应 `.md` 文件更新。
- [ ] 追问补充写回对应气泡 `.md`。
- [ ] 创建快照后，`data/snapshots/` 下生成对应 `.md` 文件。
- [ ] 快照通过 bubble IDs 引用气泡文档。
- [ ] 拖拽气泡不会频繁改写 Markdown 文件。
- [ ] `npm run check` 通过。
- [ ] `npm run build` 通过。

## 阶段 8：视觉整合

- [x] 气泡空间主页面保持画布优先，快照功能作为轻量工具层出现。
- [x] 避免新增大型说明卡片或营销式布局。
- [x] 快照卡片使用紧凑结构，默认只展示 Level 1。
- [x] 语义锚点使用小标签样式。
- [x] 唤醒指令用轻量引用块。
- [ ] Level 3 使用更低对比度的溯源区域。
- [ ] 移动端或窄屏下，快照面板改为底部抽屉。

验收标准：

- [x] 画布主体验不被快照面板压迫。
- [x] 快照展开后文本不溢出。
- [x] 窄屏下按钮和标签不重叠。

## 阶段 9：路由与导航收敛

- [x] 第一阶段保留当前导航：

```text
灵感气泡
快照库
PRD
```

- [ ] 第二阶段评估是否将“快照库”移入灵感气泡二级入口。
- [x] 若保留独立入口，页面标题改为“快照库”而非“认知上下文管理”。
- [x] Navigation 图标和 tooltip 同步调整。

验收标准：

- [ ] 用户能清楚理解快照库是气泡工作区的历史档案。
- [ ] 不再产生“上下文是另一个独立业务模块”的误解。

## 阶段 10：测试清单

- [ ] 创建 0 个气泡时，快照按钮禁用或提示。
- [ ] 创建 1 个气泡时，生成基础快照。
- [ ] 创建多个带标签气泡时，AI 能抽取 3-5 个锚点。
- [ ] 带追问补充的气泡能进入快照上下文。
- [ ] 高频点击气泡后，权重增加。
- [ ] 高频气泡在快照摘要或 Level 3 中优先出现。
- [ ] 恢复快照后，画布气泡、分类和 viewport 正确恢复。
- [ ] 删除快照不影响当前工作区。
- [ ] AI 接口失败时 fallback 生效。
- [ ] 刷新页面后持久化数据可恢复。
- [ ] `npm run check` 通过。
- [ ] `npm run build` 通过。

## 建议实施顺序

1. 先完成工作区内快照入口，不动导航。
2. 抽出快照组件，复用到 `/context` 页面。
3. 加入持久化，保护用户数据。
4. 引入 Markdown 知识原子持久层，让气泡成为可版本化文档。
5. 抽离 AI prompt 文件，降低后端维护成本。
6. 升级多维权重机制。
7. 最后再调整导航命名和模块定位。

## 风险与取舍

- AI 快照会增加等待时间：需要 loading、fallback 和局部失败处理。
- 快照数据会变大：需要持久化版本和大小控制。
- Markdown 文件适合保存知识内容，不适合承载拖拽坐标等高频 UI 状态。
- 文件写入会引入异步失败和并发冲突，需要 debounce、写入队列和失败提示。
- 合并后页面可能过载：必须坚持默认 Level 1，不主动展开长内容。
- 权重机制可能让旧想法被过度置顶：需要保留“最近气泡”和“高频气泡”的平衡。

## 最终验收叙事

用户在灵感气泡页面记录想法，随着点击、追问和归类逐渐形成思考现场。任何时刻，用户都可以在当前页面创建认知快照。快照会自动压缩为一句状态、几个语义锚点、一段逻辑脉络和一条唤醒指令。用户回来后，不需要重新阅读所有气泡，只要点击最近快照，即可恢复画布和当时的思维状态；需要更多信息时，再逐级展开到 Level 2 或 Level 3。

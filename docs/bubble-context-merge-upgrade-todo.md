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

## 2026-05-09 当前总览

当前已完成的主干能力：

- [x] 灵感气泡主工作区、快照库、创意工坊、PRD 输出中心已经形成完整产品链路。
- [x] 创意工坊支持一句话设想与文本型 PRD 文件气泡化，并接入真实 AI skill runner。
- [x] PRD 输出支持按标签 / 分类分束、可编辑 section draft、Markdown / PDF 导出。
- [x] 快照能力已嵌入工作区，并保留独立快照库作为历史管理入口。
- [x] 多 AI 服务商配置、设置中心和右上角全局辅助菜单已完成当前 MVP 收敛。
- [x] Markdown 知识原子持久层已落地，运行数据默认写入本地 `data/`。
- [x] P0 工程稳定性已完成：mock AI 集成测试、prompt 抽离、运行数据 Git 隔离和 onboarding seed 规划。

当前最优先的后续开发：

1. **P1 输入增强**：PRD 上传支持 PDF / DOCX，增加拖拽上传、内容预览摘要和 `sourceFileName` 来源元信息。
2. **P1 测试补齐**：补 UI / 组件级集成测试，覆盖工坊文件上传、工坊到 PRD 接力、PRD 导出、选区和气泡条移除。
3. **P1 prompt / 接口收尾**：继续拆 `categorize` / `followup` prompt，补运行时 schema 校验与过长内容截断。
4. **P2 PRD Skill / Prompt Pack**：不要开放底层 prompt 全量编辑，而是把不同 PRD 类型做成可装载、可配置、可测试的 skill。
5. **P2 体验稳定**：PRD section 增加轻量保存状态或最近编辑时间，低性能模式真正作用到 blur / 彩色层 / 动画。
6. **P3 新能力**：在前面来源元信息与测试基础完成后，再推进联网产品研究 skill。

## 2026-05-05 当前实现记录

本轮重点从“新增快照能力”转向“统一气泡工作区交互心智”：

- [x] 将气泡空间、快照库、PRD 页面统一到同一套 liquid glass / warm red UI 语言。
- [x] 新增创意工坊页面，用于管理本地 skill / 能力扩展，并从设想或 PRD 草稿生成气泡。
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

- [x] 把选中集合提升到 Zustand store，而不是由 `BubbleCanvas` 本地 state 与 `BubbleSpace` 透传维护。
- [x] 为“主处理气泡”和“多选集合”建立明确命名，例如 `activeBubbleId` 与 `selectedBubbleIds`。
- [x] 将当前画布双击顶部编辑框弱化或并入底部 AI 输入框，避免“顶部保存”和“底部改写”形成重复编辑入口。
- [ ] 补充针对选区、气泡条移除、快照预选集合的组件或集成测试。

## 2026-05-06 当前实现记录

本轮重点从“页面功能存在”推进到“创意工坊 / PRD / 灵感气泡形成连续产品工作流”：

- [x] 创意工坊定位从“skill 管理页”收敛为“产品思考能力面板 / 输入变换层”，管理能力保持轻量。
- [x] 创意工坊 skill runner 接入真实 AI 能力，支持分析摘要、澄清问题、用户补充确认与候选气泡生成。
- [x] 一句话生成模块气泡时，仅第一个气泡保留用户初始输入，其余气泡写入 AI 分析后的独立内容。
- [x] PRD 草稿拆解 skill 支持把已有 PRD / Markdown 草稿转为可追问的产品气泡。
- [x] 工坊生成气泡后可以直接回到画布继续整理，或进入 PRD 输出中心承接刚生成的气泡集合。
- [x] PRD 页按气泡标签 / 分类归束展示选择区，支持整组选中与单个气泡微调。
- [x] PRD 生成前展示章节骨架，生成后展示多个可编辑 section draft，而不是单块不可编辑 Markdown。
- [x] PRD section 使用与气泡标签一致的细窄彩色边框 / 标识，避免厚色块破坏灵感气泡页的轻盈 UI 语言。
- [x] PRD Markdown / PDF 导出改为合并用户编辑后的 section drafts。
- [x] AI 归类后的气泡布局改为紧凑分组，降低“分类后过度分散”的画布噪音。
- [x] 顶部工具栏增加删除所选气泡入口，并在删除前弹出确认交互。
- [x] 修复新增或归类气泡因筛选状态残留导致无法在画布正常显示的问题。

当前产品主链路：

```text
粗糙想法 / PRD 草稿 / 外部资料
  -> 创意工坊 AI skill 分析
  -> 候选气泡与用户确认补充
  -> 写入灵感气泡画布
  -> 画布整理、追问、归类、快照
  -> PRD 输出中心按标签/分类分束
  -> 可编辑章节草稿
  -> Markdown / PDF 导出
```

下一步建议：

- [ ] 补齐创意工坊到 PRD 的端到端集成测试，覆盖“生成气泡 -> 自动选中 -> PRD 分束 -> 导出”。
- [ ] 为 PRD section 编辑区增加轻量保存状态或最近编辑时间，避免用户误解编辑是否进入导出内容。
- [ ] 继续收敛 PRD 页顶部工具与左侧分组卡片视觉，让它们更接近灵感气泡页的悬浮工具层。
- [x] 将 AI skill / PRD / snapshot 的长提示词逐步抽离到 `api/prompts/`，降低路由文件维护成本。

## 2026-05-08 当前实现记录

本轮重点从“主流程打通”推进到“品牌、AI 状态反馈、文件导入和视觉性能收敛”：

- [x] 新增产品品牌 Logo 资源：
  - `public/aethel-logo.png` 用于 README / 品牌展示。
  - `public/aethel-logo-icon.png` 用于导航、输入区头像和 favicon。
- [x] README 顶部更新产品 Logo，并同步远端仓库地址为 `https://github.com/SuTang-vain/AetheL.git`。
- [x] 创意工坊「PRD 文档拆分气泡」skill 支持直接上传文本型文件：
  - `.md`
  - `.markdown`
  - `.txt`
  - `.text`
  - `.html`
  - `.json`
  - `.csv`
- [x] 上传文件会读取文本并写入 PRD 拆分输入框，用户仍可继续编辑，再运行真实 AI skill。
- [x] 文件上传增加格式限制、2MB 大小限制、读取中状态、文件名展示和错误提示。
- [x] 新增全页面 AI 全局动效，用于明确提示 AI 正在运行；保留其作为“任务状态反馈”，不作为常驻装饰。
- [x] 新增 `apiClient` fallback：同源 `/api` 不可用、HTML/404/5xx 时回退到本地 `localhost:3000` / `127.0.0.1:3000`。
- [x] 修复 AI API 调用链路，工坊 skill、快照认知和 PRD 生成可重新调用真实 AI。
- [x] 快照库卡片、工坊 skill 卡片阴影改为轻量内嵌阴影，避免模块之间出现不自然断层。
- [x] PRD 页面和工坊页面的未选中气泡增加细彩边与浅底，提高边界可见性。
- [x] 降低窗口常驻色彩渲染存在感：
  - 降低 `liquid-vessel` 多层彩色径向渐变透明度。
  - 移除常驻背景漂移动画。
  - 降低大玻璃容器的饱和度与 blur 强度。
  - 保持底层网点背景与灵感气泡页一致。
- [x] 本地预览已验证可启动：前端 `5173`，后端 API `3000`。
- [x] `npm run check` 通过。
- [x] `npm run build` 通过。

当前产品判断：

- 彩色渲染应作为低存在感品牌氛围，而不是长期阅读/编辑页面的主视觉。
- 全局 AI 流光适合作为 AI 运行反馈，可以保留；常驻窗口色彩层应静态、低饱和、低透明。
- 创意工坊的价值不在“skill 管理”，而在输入变换和 AI 交互确认，因此文件上传应直接进入 skill 流程，而不是做成后台式资料库。
- README、favicon、导航头像和输入区品牌头像已形成统一品牌入口。

下一步建议：

- [ ] 为 PRD 文档上传增加 PDF / DOCX 解析能力，优先采用按需动态导入，避免主包继续变重。
- [ ] 为上传文件入口增加拖拽上传区域和文件内容预览摘要。
- [ ] 将工坊上传文件后的 AI 拆解结果与原文件名建立轻量来源元信息，例如 `sourceFileName`。
- [ ] 在创意工坊新增「联网产品研究」skill，作为 Aethel 的外部证据层。
- [x] 继续抽离 AI prompt 到 `api/prompts/`，优先拆 `workshop` / `prd` / `snapshot` 三类。
- [x] 为 AI API fallback、AI skill、PRD 分束、snapshot 和文件持久层补充 P0 API 集成测试。
- [x] 完成 `data/workspace.json` 和运行样例数据的 Git 策略决策：运行态不纳入 Git，引导种子放入 `data/onboarding/`。
- [ ] 继续补充工坊文件上传与 PRD 导出 UI 级集成测试。
- [ ] 增加低性能模式：关闭大面积 backdrop blur、彩色窗口层和非关键动画。

## 2026-05-09 当前规划记录

本轮重点从“多 AI 服务商配置可用”推进到“设置中心和全局辅助入口符合 Aethel 产品气质”：

- [x] 接受多 AI 服务商配置方向，保留 Moonshot / DeepSeek / ModelScope 的功能逻辑。
- [x] 明确设置页不应只是 AI 引擎后台表单，而应升级为轻量设置中心。
- [x] 明确 Logo 点击应回到灵感气泡，不再作为隐藏设置入口。
- [x] 明确导航右侧不宜长期堆叠“状态图标 + AI 引擎配置”两个强按钮。
- [x] 确定全局辅助入口应承载：AI 状态、活动记录、帮助、反馈、论坛、设置。
- [x] 倾向采用可展开的圆形 `...` 更多入口，展开后向右或向下延展为轻量操作带；状态只作为小圆点或首个菜单项，不单独抢占导航。
- [x] 设置页默认进入 `AI 引擎`，页面结构承载内部系统项：`数据与存储`、`外观与性能`、`活动记录`、`关于` 等。

当前产品判断：

- 设置页应定位为“设置中心 / 系统工作台”，而不是“AI 配置页面”。
- AI 引擎配置仍是 MVP 阶段最重要的设置分区，但不应占据整个设置页心智。
- 活动记录适合承载保存、AI 调用、导入、导出、快照创建等系统事件，帮助用户理解“系统刚刚做了什么”。
- 帮助、反馈、论坛应放在全局辅助入口里，而不是成为主导航一级页面。
- 帮助、反馈、论坛属于外部支持 / 社区生态入口，不应归属在“设置中心”内部，否则会和设置子菜单形成心智重复。
- 短期在外部支持页面未完成前，`帮助`、`反馈`、`论坛` 可统一跳转到 `https://kezhongke.cn/`；后续再拆分为独立 URL，例如 `/help`、`/feedback`、`/forum`、`/docs`。
- 全局辅助入口要低存在感、可收起、可触达，避免破坏灵感气泡 / 快照 / PRD / 工坊的主链路。

下一步建议：

- [x] 将 `/settings` 重构为设置中心，采用左侧分区导航 + 右侧内容区。
- [x] 将现有 AI 引擎配置迁移为设置中心的 `AI 引擎` 分区，并压缩空白，提高信息密度。
- [x] 增加 `数据与存储` 分区，展示本地 Markdown 原子、workspace JSON、导入导出和数据位置说明。
- [x] 增加 `外观与性能` 分区，预留低性能模式、减少动效、降低彩色渲染等开关。
- [x] 增加 `活动记录` 分区，先展示 AI 配置保存、连接测试、最近保存状态等轻量事件。
- [x] 从设置中心移除或弱化 `帮助` 分区，将帮助入口改为全局辅助菜单中的外部链接。
- [x] 从设置中心移除或弱化 `反馈` 分区，将反馈入口改为全局辅助菜单中的外部链接。
- [x] 增加 `关于` 分区，展示产品名、版本、许可证、仓库地址和本地运行信息。
- [x] 将主导航右侧设置入口改为可收起的圆形 `...` 更多菜单。
- [x] 更多菜单展开后包含：状态、活动记录、帮助、反馈、论坛、设置。
- [x] `帮助`、`反馈`、`论坛` 短期统一跳转到 `https://kezhongke.cn/`，并以新标签页打开。
- [x] `活动记录` 继续进入 `/settings?section=activity`，`设置` 进入 `/settings?section=ai`，避免外部支持入口和内部设置入口混淆。
- [x] 优化 `...` 下拉菜单窗口样式，使其透明度、圆角、阴影和菜单项形态更接近顶部胶囊导航。
- [x] AI 调用失败或保存异常时，在提示中提供“前往设置中心 / AI 引擎”的明确入口。
- [x] 更新 `docs/MULTI-API-INTEGRATION.md` 中“点击 Logo 进入配置页”的过时描述。

## 2026-05-09 P0 开发记录

本轮重点完成 P0 工程稳定性收敛：

- [x] 新增 `tests/integration/p0.test.ts`，覆盖文件持久层、AI skill、PRD 分束、snapshot 生成和 `apiClient` 本地 fallback。
- [x] 新增 `npm run test:integration`，使用 mock AI completion 运行，不依赖真实 AI 服务或联网。
- [x] `npm run check`、`npm run test:integration`、`npm run build` 均已通过；build 仍保留既有大 chunk 警告。
- [x] 支持通过 `AETHEL_DATA_DIR` 覆盖运行数据目录，集成测试写入临时目录，不污染本地 `data/`。
- [x] 将 `workshop` / `prd` / `snapshot` 长提示词抽离到 `api/prompts/`，路由文件只保留校验、调用和结果归一化。
- [x] 将 `data/bubbles/*`、`data/snapshots/*`、`data/.trash/*`、`data/workspace.json` 作为本地运行态加入 Git 忽略，并从版本跟踪中移除。
- [x] 新增 `data/onboarding/README.md`，为后续首次使用引导数据预留版本化种子目录，避免示例数据与用户运行数据混杂。

本轮未完成且顺延的测试边界：

- [ ] 工坊文件上传的浏览器级测试：Markdown / TXT 自动填充输入框、不支持文件类型错误提示。
- [ ] 工坊到 PRD 的 UI 级接力测试：生成气泡 -> 自动选中 -> 进入 PRD -> 导出。
- [ ] 画布交互测试：选区、气泡条移除、快照预选集合。
- [ ] PRD 导出文件内容测试：用户编辑 section 后导出的 Markdown / PDF 使用最新内容。

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
- [x] 新增 `/workshop` 创意工坊路由，作为扩展能力与 skill 管理入口。
- [x] 在 `灵感气泡` 页面加入快照入口，作为主工作区工具。
- [x] 明确两个入口的职责：
  - `灵感气泡`：日常创建、快速恢复、查看当前工作区语义状态。
  - `快照库`：历史浏览、深度回顾、批量管理、删除/重命名。

建议 UI：

- [x] 在画布工具栏增加“创建快照”按钮。
- [x] 在右侧 AI 面板增加“当前上下文”折叠区。
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
- [x] Level 1 展示：
  - 快照名
  - 一句话状态快照
  - 3-5 个语义锚点
  - 气泡/标签/分类数量
- [x] Level 2 展示：
  - 逻辑脉络
  - 语义锚点说明
  - 认知待办/缺口
  - 唤醒指令
- [x] Level 3 展示：
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

## 阶段 3.5：创意工坊与 Skill 扩展

目标：把“气泡生成能力”从单一输入框扩展成可管理的 skill 工作台，后续可以承载更多模块化创作、拆解、导入和转换能力。

- [x] 新增 `CreativeWorkshop` 页面。
- [x] 新增 `workshopStore`，管理已安装/启用的 skill。
- [x] 内置「一句话生成模块气泡」skill：
  - 输入一句初步设想。
  - 通过 AI skill runner 实时分析输入，输出目标用户、使用场景、核心价值、关键模块、风险假设、验证标准等候选气泡。
  - 一键写入气泡画布并同步选中。
- [x] 内置「PRD 文档拆分气泡」skill：
  - 粘贴 PRD / Markdown 草稿。
  - 支持上传 Markdown、TXT、HTML、JSON、CSV 等文本型 PRD 文件。
  - 通过 AI 阅读文档语义，拆成独立产品模块、约束、风险和验证气泡。
  - 一键写入气泡画布并标记为 `PRD拆解`。
- [x] 主导航新增「工坊」入口。
- [x] 将本地规则型 skill 升级为可调用 AI 的 skill runner。
- [x] Skill runner 输出 AI 分析摘要、置信度、澄清问题、确认提示和候选气泡。
- [x] 工坊页面支持“AI 分析 -> 用户补充确认 -> AI 吸收确认 -> 生成气泡”的交互流程。
- [x] 「一句话生成模块气泡」仅第一个气泡保留用户原始输入，其余气泡写入 AI 分析后的独立内容。
- [x] 「PRD 文档拆分气泡」支持文本文件上传后自动填充输入框，并保留用户二次编辑能力。
- [ ] 「PRD 文档拆分气泡」后续支持 PDF / DOCX 文件解析。
- [ ] 后续支持从本地 skill 包或插件清单安装扩展。

## 阶段 3.6：创意工坊与 PRD 输出的有机接力

目标：让「创意工坊」和「PRD 输出中心」形成上下游接力，而不是合并成一个混杂页面。工坊负责把外部输入、粗糙想法或已有 PRD 草稿气泡化；PRD 页负责把气泡集合生成正式文档。

产品判断：

- [x] 保留「创意工坊」独立页面，定位为 Aethel 的输入变换层 / 产品思考能力面板。
- [x] 保留「PRD」独立页面，定位为结构化文档输出层。
- [x] 不把工坊做成插件市场式重页面，管理能力保持次要。
- [x] 不把 PRD 拆解能力直接并入 PRD 页主流程，避免形成「PRD -> 气泡 -> PRD」的混乱闭环。
- [x] 明确两者关系：
  - `创意工坊`：外部输入 / 粗糙想法 / PRD 草稿 -> 气泡化。
  - `PRD`：气泡集合 -> 正式 PRD 草稿 / Markdown / PDF。

接力流程：

```text
PRD 草稿 / 一句话想法
  -> 创意工坊 AI skill 分析
  -> 用户确认候选气泡
  -> 写入气泡工作区并自动选中
  -> PRD 输出中心继承或预选这些气泡
  -> 生成正式 PRD
```

待办：

- [x] 工坊生成气泡后提供两个后续动作：
  - `回到画布继续整理`
  - `进入 PRD 输出`
- [x] 从工坊进入 PRD 输出时，将刚生成的 `bubbleIds` 作为预选集合传递给 PRD 页。
- [x] PRD 页优先读取 Zustand 的 `selectedBubbleIds`，并允许用户在 PRD 页内微调选择。
- [x] PRD 页空状态或左侧栏顶部增加轻入口：`已有 PRD 草稿？先拆成气泡`。
- [x] 点击该入口跳转到 `/workshop`，并自动切换到 `prd-to-bubbles` skill。
- [x] 将 `prd-to-bubbles` 在文案上定义为「PRD 拆解 / 文档气泡化 / 需求反向结构化」，避免与 PRD 输出混淆。
- [x] 工坊生成后的气泡应携带来源标签或轻量元信息，例如 `sourceSkillId: prd-to-bubbles`，便于 PRD 页识别“刚生成的一组气泡”。
- [x] PRD 页生成文档后记录气泡使用权重，为后续 `prdUsageCount` 做准备。

验收标准：

- [x] 用户可以从 PRD 草稿出发，经工坊拆解为气泡，再无缝进入 PRD 输出。
- [x] 用户可以从 PRD 页发现“先拆解文档”的入口，但不会误以为 PRD 页是导入/拆解主界面。
- [x] 工坊和 PRD 页在导航上仍是两个清晰入口，但流程上有明确下一步。
- [x] PRD 页不会强迫用户重新手选刚由工坊生成的气泡。

## 阶段 3.7：按标签分束的可编辑 PRD 草稿

目标：将 PRD 输出从“一整篇不可编辑 Markdown 长文”升级为“按气泡标签 / 分类分束的结构化草稿”。用户在生成 PRD 前能看到同类气泡被归束为同一部分；生成后右侧按相同标签颜色展示多个可编辑文档框，最终导出时再合成为完整 Markdown / PDF。

产品判断：

- [x] 这个方向适合 Aethel，因为它保留了“气泡 -> 结构化产品判断 -> 正式文档”的可追溯关系。
- [x] PRD 不是一次性 AI 成文，而应该是用户可审阅、可局部改写、可组合导出的结构化草稿。
- [x] 标签颜色应贯穿左侧气泡选择和右侧 PRD 分区，让用户理解“这段文档来自哪类气泡”。
- [x] 不建议只在导出时按标签分组；分组必须在生成前和生成后都可见，否则用户无法控制文档结构。
- [x] 不建议把每个气泡都变成一个文档框；更合理的是按标签 / 分类聚合成章节框，框内吸收多个气泡。

建议信息架构：

- 左侧选择区：
  - 按标签 / 分类归束展示气泡。
  - 每个标签组显示颜色、名称、选中数量 / 总数。
  - 支持整组选中 / 取消选中。
  - 仍允许单个气泡微调。
- 右侧生成区：
  - 生成前展示将要生成的章节骨架。
  - 生成后按标签 / 分类显示多个 PRD section card。
  - 每个 section card 使用对应标签颜色作为边线、标题点或浅色背景。
  - 每个 section card 内部是可编辑 textarea / rich editor。
  - 支持用户手动调整章节标题和正文。
- 导出：
  - Markdown 导出时按 section 顺序拼接为完整文档。
  - PDF 导出时渲染合并后的完整文档，而不是单独导出碎片。

数据结构建议：

```ts
interface PrdSectionDraft {
  id: string
  title: string
  tag: string
  color: string
  bubbleIds: string[]
  content: string
  order: number
  updatedAt: string
}
```

生成流程建议：

```text
选中气泡
  -> 按 tag/category 分组
  -> AI 按组生成 section drafts
  -> 用户逐框编辑
  -> 合并 section drafts
  -> 导出 Markdown / PDF
```

待办：

- [x] PRD 页左侧气泡选择改为按 `tag` / `categoryId` 分组展示。
- [x] 每个气泡组支持整组选中 / 取消选中，并显示选中数量。
- [x] 保留单个气泡勾选能力，分组只是组织方式，不替代细粒度选择。
- [x] PRD 生成前在右侧空状态展示“将生成的章节骨架”，每个章节对应一个标签 / 分类。
- [x] 新增 `PrdSectionDraft` 类型和 store 状态，用于保存分区草稿。
- [x] 调整 AI PRD 生成接口：支持按分组输入，返回多个 section，而不是只返回一整段 Markdown。
- [x] 生成后右侧渲染多个 section card，每个 card 使用对应标签颜色。
- [x] 每个 section card 内部支持用户直接编辑标题和正文。
- [x] 支持 section 顺序调整，默认顺序可按：核心概念 -> 用户假设 -> 场景 -> 价值主张 -> 产品模块 -> 风险 -> 验证计划。
- [x] Markdown 导出改为将 section drafts 合并为完整文档。
- [x] PDF 导出改为渲染合并后的完整文档。
- [x] PRD 生成成功后，将每个 section 对应的 `bubbleIds` 计入 `prdUsageCount`。
- [x] PRD section card 的颜色标识改为气泡同款细窄彩边框 / 标题色点，避免厚重顶部色带。
- [x] PRD 页与灵感气泡页保持一致的 liquid glass、warm red、轻阴影和低噪音工具层风格。

验收标准：

- [x] 用户在左侧能清楚看到所选气泡属于哪些标签 / 分类束。
- [x] 用户点击生成前，能预判右侧会生成哪些 PRD 章节。
- [x] 右侧生成结果不再是一整块不可编辑 Markdown，而是多个可编辑章节框。
- [x] 每个章节框颜色与来源标签一致。
- [x] 用户修改任意章节后，导出的 Markdown / PDF 使用修改后的内容。
- [x] 少量未标签气泡会进入“未归类补充”章节，而不是丢失。
- [x] 颜色标识轻量但可追溯，整体视觉不脱离灵感气泡页面。

## 阶段 3.7.5：PRD Skill / Prompt Pack 扩展规划

目标：支持不同类型的 PRD / 设计文档生成，但不把底层 system prompt 全量暴露给普通用户编辑。Aethel 应以可装载的 `PRD Skill / Prompt Pack` 作为扩展单位，让用户选择、安装或配置不同文档能力包。

产品判断：

- [x] 不建议直接开放底层 prompt 全量编辑。
- [x] 底层 prompt 和 API 返回 schema 强绑定，普通用户直接修改容易破坏 JSON 输出、字段约束、fallback 逻辑和前端渲染。
- [x] 不同 PRD 类型真正需要变化的是生成目标、章节结构、关注维度、验收标准和输出格式，而不是完整 system prompt。
- [x] 后续如果增加联网研究、来源引用、风险提示和高风险领域复核，裸 prompt 编辑会更难治理。
- [x] 更合理的产品形态是固定系统 prompt 内核，开放结构化 Skill Pack 配置。

建议内置 PRD skill 类型：

- [ ] `通用产品 PRD`
- [ ] `前端交互 PRD`
- [ ] `设计实现说明 DESIGN.md`
- [ ] `后端接口 PRD`
- [ ] `增长实验 PRD`
- [ ] `AI 功能 PRD`
- [ ] `合规 / 风控 PRD`

分层模型：

```text
稳定内核
- JSON 输出格式
- 安全约束
- 字段 schema
- fallback 要求
- Aethel 气泡 / PRD / snapshot 数据协议

Skill Pack
- PRD 类型
- 章节结构
- 生成视角
- 关注维度
- 示例片段
- 输出风格
- 适用输入类型
```

前端 PRD -> DESIGN.md skill 草案：

```ts
{
  id: 'frontend-design-md',
  name: '前端 DESIGN.md',
  inputTypes: ['bubbles', 'prd-section', 'markdown'],
  outputType: 'markdown-document',
  sections: [
    '页面目标',
    '信息架构',
    '组件结构',
    '状态与数据流',
    '交互细节',
    '响应式规则',
    '视觉约束',
    '边界状态',
    '验收标准'
  ],
  focus: [
    '前端工程可实现性',
    '组件拆分',
    '交互状态',
    '设计一致性',
    '移动端适配'
  ]
}
```

用户侧交互建议：

- [ ] 用户选择 PRD / 文档类型，而不是直接编辑底层 prompt。
- [ ] 用户可以调整章节模板、勾选关注维度、添加项目约束。
- [ ] 用户可以保存为自定义 skill，但自定义内容必须是结构化字段。
- [ ] 高级模式可开放 prompt override，但必须提供预览、测试、schema 校验和恢复默认。

实现路线：

- [ ] 先完成 `categorize` / `followup` prompt 抽离，并补 AI JSON schema 校验。
- [ ] 为 PRD 生成增加 `prdSkillId` 或 `documentTemplateId`。
- [ ] 新增 `api/prompts/skills/` 或 `api/skills/`，承载内置 PRD skill 定义。
- [ ] 将 PRD sections prompt 改为由稳定内核 + Skill Pack 结构化配置组合生成。
- [ ] 在 PRD 页增加文档类型选择入口，默认使用 `通用产品 PRD`。
- [ ] 第一批优先实现 `frontend-design-md`，验证“产品气泡 -> 前端 DESIGN.md”的价值。
- [ ] 后续开放自定义 Skill Pack 安装 / 导入，但不允许绕过 schema 直接破坏输出协议。

验收标准：

- [ ] 用户可以在 PRD 输出中心选择不同文档 skill，并看到不同章节骨架。
- [ ] `frontend-design-md` 能从气泡或 PRD section 生成可交给前端实现的 DESIGN.md。
- [ ] Skill Pack 修改不会破坏 PRD section JSON 输出 schema。
- [ ] 自定义 skill 有预览与测试，不通过 schema 校验时不能保存启用。
- [ ] 底层 prompt 内核保持可维护，普通用户默认不需要接触 system prompt。

## 阶段 3.8：联网产品研究 Skill / 外部证据层

目标：为 Aethel 增加受控的联网研究能力，但不把产品做成通用搜索页。联网结果必须被转译为产品判断结构，并回流到气泡、PRD section 或快照上下文中。

产品判断：

- [x] 联网搜索能力适合 Aethel，因为它补足“模糊想法 -> 产品判断 -> PRD”链路中的外部证据缺口。
- [x] 该能力不应独立成“搜索页面”或“浏览器页”，而应定位为创意工坊里的 AI research skill。
- [x] 主入口应放在「创意工坊」，因为联网研究本质是输入变换：外部资料 / 市场信息 / 规范约束 -> 结构化气泡与 PRD 建议。
- [x] PRD 页适合放轻入口，例如「联网补强」「查找同类产品」「补充规范约束」，但不承担完整搜索工作流。
- [x] 灵感气泡页适合提供选中气泡的快捷动作，例如「联网验证」「找类似产品」，结果以新气泡或补充信息回流。
- [x] 快照库不作为主动研究入口，只保留“基于此快照继续研究”的后续可能。

内置研究模式：

- [ ] **市场分析**：
  - 根据当前 PRD / 选中气泡 / 一句话想法搜索同类产品。
  - 输出竞品列表、定位差异、商业模式、用户群、功能模式和潜在机会。
  - 可生成竞品气泡、机会气泡、风险气泡或 PRD 市场分析 section。
- [ ] **创意建议**：
  - 基于当前 PRD 或气泡集合联网寻找相关案例、设计模式、增长机制和产品灵感。
  - 输出可执行的功能创意、体验优化、差异化方向和下一步验证建议。
  - 可生成创意气泡或插入当前 PRD section。
- [ ] **规则规范**：
  - 搜索当前产品领域相关的开发规则、平台规范、隐私合规、行业约束和技术标准。
  - 输出约束清单、风险提示、开发注意事项和验收标准。
  - 可生成规范/合规/技术风险气泡，或插入 PRD 的「约束与合规」章节。

交互入口建议：

- 创意工坊：
  - [ ] 新增 `联网产品研究` skill。
  - [ ] Skill 内提供 segmented control：`市场分析` / `创意建议` / `规则规范`。
  - [ ] 输入来源支持：手写描述、当前 PRD、选中气泡集合、上传文档。
  - [ ] 输出包含结构化结论、建议气泡、可插入 PRD 内容和来源链接。
- PRD 页：
  - [ ] 在 section card 或顶部工具区增加「联网补强」轻入口。
  - [ ] 支持把当前 section 内容传给联网研究 skill。
  - [ ] 研究结果可一键插入当前 section 或生成补充气泡。
- 灵感气泡页：
  - [ ] 对 activeBubble / selectedBubbleIds 提供「联网验证」快捷动作。
  - [ ] 结果只回流为气泡、追问补充或右侧 AI 面板摘要，不在画布里展示复杂搜索页。

数据与来源要求：

- [ ] 每条联网结论必须保存来源 URL、标题、检索时间和摘要。
- [ ] 气泡来源元信息增加可选字段：

```ts
interface ExternalEvidenceSource {
  title: string
  url: string
  accessedAt: string
  snippet?: string
  sourceType: 'market' | 'creative' | 'regulation'
}
```

- [ ] 由联网研究生成的气泡应携带：
  - `sourceSkillId: web-research`
  - `sourceLabel`
  - `externalSources`
- [ ] PRD 导出时可选择是否附带来源引用。
- [ ] 对高风险领域（医疗、金融、法律、隐私合规）必须显示“需人工复核”的提示。

实现建议：

- [ ] 后端新增受控搜索 API，避免前端直接暴露搜索服务密钥。
- [ ] 搜索结果先进入后端归一化层，再交给 AI 做结构化总结。
- [ ] AI prompt 明确要求区分“事实来源摘要”和“模型推断建议”。
- [ ] 限制单次搜索结果数量和正文长度，避免 token 爆炸。
- [ ] 搜索结果缓存到本地，减少重复请求。
- [ ] 为无法联网或搜索失败提供 fallback：允许用户粘贴外部资料并继续走同一 skill。

验收标准：

- [ ] 用户能从工坊输入一个 PRD / 想法，获得同类产品市场分析，并一键生成气泡。
- [ ] 用户能在 PRD 页对某个 section 做联网补强，并把结果插回该 section。
- [ ] 用户能对选中气泡执行联网验证，得到可追溯来源的补充气泡。
- [ ] 所有联网结论都能看到来源，不把 AI 推断伪装成事实。
- [ ] 联网失败时不会中断主工作流，可回退到手动粘贴资料。
- [ ] 该能力不增加一个重型“插件市场/搜索中心”页面。

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

- [x] 将快照提示词从路由文件中抽离。
- [x] 新增 prompt 模块：

```text
api/prompts/
├─ snapshot.ts
├─ prd.ts
└─ workshop.ts
```

- [x] 快照接口继续使用 `POST /api/ai/snapshot`。
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

- [ ] 对 AI JSON 结果做运行时 schema 校验和更细容错。
- [ ] 对过长气泡内容做截断或分批压缩。

验收标准：

- [ ] 路由文件不再堆大量 prompt 文本。（已先抽离 workshop / prd / snapshot；categorize / followup 后续继续拆）
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
├─ onboarding/
│  └─ README.md
└─ workspace.json
```

职责划分：

- `data/bubbles/*.md`：每个气泡一个文档，保存内容、标签、分类、追问补充、语义关系和低频元数据。
- `data/workspace.json`：保存高频画布状态，如坐标、缩放、当前筛选、当前选中、面板状态。
- `data/snapshots/*.md`：保存快照摘要、语义锚点、唤醒指令，并引用一组 bubble IDs。
- `data/onboarding/`：仅保存版本化首次使用引导种子，不混入真实用户运行数据。

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

- [x] 新增 `api/routes/bubbles.ts`。
- [x] 新增 `api/routes/snapshots.ts` 或合并到 `api/routes/workspace.ts`。
- [x] 新增 `api/routes/workspace.ts`，作为前端 Zustand 全量防抖同步入口。
- [x] 新增 Markdown 读写工具模块：

```text
api/storage/
├─ markdown.ts
├─ bubbleFiles.ts
├─ snapshotFiles.ts
├─ workspaceFile.ts
├─ atomicWrite.ts
├─ writeQueue.ts
├─ paths.ts
└─ types.ts
```

- [x] API 设计：

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

- [x] 依赖选择：
  - 暂未新增 `gray-matter` 依赖，先用本地 `api/storage/markdown.ts` 做稳定 frontmatter 读写，避免增加安装成本。
  - 使用 Node `fs/promises` 读写文件。
  - 文件名使用 `id`，不要使用用户输入标题直接作为文件名。

前端迁移策略：

- [x] 页面启动时调用 `GET /api/workspace`，恢复 Zustand。
- [x] 创建气泡时先更新 Zustand，再通过全量 workspace debounce 写回文件层。
- [x] 编辑气泡内容、标签、追问补充时 debounce 后写回文件层。
- [x] 拖拽、缩放、筛选等高频状态写入 `workspace.json`；气泡 Markdown 保持内容和低频元数据。
- [x] 快照创建时写 `data/snapshots/*.md`，并在 frontmatter 中保留 bubble IDs。

写入节流与冲突控制：

- [x] 气泡正文和标签编辑使用 500-1000ms debounce。
- [x] 拖拽位置通过 workspace 级 800ms debounce 批量保存。
- [x] 后端写文件时使用临时文件 + rename，降低半写入风险。
- [x] 同一个气泡的并发写入排队处理。
- [x] workspace、气泡、快照写入使用 key-based 队列，避免并发写入互相覆盖。
- [x] 文件写入失败时 Zustand 不立即回滚，继续依赖 localStorage 作为即时 fallback。
- [x] UI 显示轻量保存失败状态。
- [x] Vite 开发服务器忽略 `data/**` 文件变化，避免文件层写入触发页面刷新和重复同步。
- [x] 前端持久化使用 workspace 内容签名去重，避免相同状态被重复 PATCH。

Git 友好策略：

- [x] Markdown 文档保持稳定字段顺序，减少 diff 噪音。
- [x] 高频坐标不写入 bubble md，避免每次拖拽都产生文档 diff。
- [x] `workspace.json` 可选择纳入 Git，也可加入 `.gitignore`，根据产品定位决定。
- [x] 当前决策：本地运行态 `data/bubbles/*`、`data/snapshots/*`、`data/.trash/*`、`data/workspace.json` 不再纳入 Git。
- [x] 当前决策：首次使用引导数据只放入 `data/onboarding/`，后续通过显式导入 / 复制进入运行态。
- [x] 支持 `AETHEL_DATA_DIR` 覆盖数据目录，便于测试和隔离运行环境。
- [ ] 为导入/导出预留 `Export Markdown Vault` 能力。

安全与路径约束：

- [x] 默认文件写入限制在项目内 `data/` 目录；测试或隔离部署可通过 `AETHEL_DATA_DIR` 指向独立数据目录。
- [x] 后端 API 禁止接收任意文件路径。
- [x] 删除气泡时先移动到 `data/.trash/`，二次确认后再物理删除。
- [x] Markdown 正文允许用户内容，但 frontmatter 字段必须经过结构化序列化。

验收标准：

- [x] 每创建一个气泡，`data/bubbles/` 下生成一个对应 `.md` 文件。
- [x] 刷新页面后，气泡从 Markdown + workspace JSON 恢复。
- [x] 编辑气泡内容后，对应 `.md` 文件更新。
- [x] 追问补充写回对应气泡 `.md`。
- [x] 创建快照后，`data/snapshots/*.md` 已具备写入链路。
- [x] 快照通过 bubble IDs 引用气泡文档。
- [x] 拖拽气泡不会频繁改写 Markdown 文件。
- [x] `npm run check` 通过。
- [x] `npm run build` 通过。

## 阶段 8：视觉整合

- [x] 气泡空间主页面保持画布优先，快照功能作为轻量工具层出现。
- [x] 避免新增大型说明卡片或营销式布局。
- [x] 快照卡片使用紧凑结构，默认只展示 Level 1。
- [x] 语义锚点使用小标签样式。
- [x] 唤醒指令用轻量引用块。
- [x] 快照库和工坊列表卡片阴影收敛为轻量内嵌阴影。
- [x] PRD / 工坊未选中气泡增加明确细边框，提高可视性。
- [x] 降低常驻彩色渲染，移除大容器持续色彩漂移动画。
- [x] 新增品牌 Logo 并统一导航、输入区头像、favicon 和 README。
- [ ] Level 3 使用更低对比度的溯源区域。
- [ ] 移动端或窄屏下，快照面板改为底部抽屉。
- [ ] 增加低性能视觉模式，关闭非必要 blur / 彩色层 / 动画。

验收标准：

- [x] 画布主体验不被快照面板压迫。
- [x] 快照展开后文本不溢出。
- [x] 窄屏下按钮和标签不重叠。
- [x] 长时间使用页面时，窗口色彩层不再压过气泡、PRD 文本和快照内容。

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
- [x] `apiClient` 同源失败 / HTML / 404 / 5xx 时本地 API fallback 生效。
- [ ] AI 接口业务失败时，快照 / 工坊 / PRD 的用户可见 fallback 与重试入口生效。
- [ ] PRD 文档拆分 skill 上传 Markdown / TXT 文件后，能自动填入输入框并运行 AI。
- [ ] 上传不支持的二进制文件时，能展示清晰错误提示。
- [ ] 全局 AI 动效只在 AI 运行时出现，不遮挡关键交互。
- [x] API 级文件持久层可写入临时数据目录并恢复 workspace 结构。
- [ ] 浏览器刷新后端到端持久化数据可恢复。
- [x] `npm run test:integration` 通过。
- [x] `npm run check` 通过。
- [x] `npm run build` 通过。

## 建议实施顺序

1. 先补 P1 输入增强：PDF / DOCX 解析、拖拽上传、文件预览摘要、`sourceFileName`。
2. 补 UI / 浏览器级测试：工坊上传、工坊到 PRD 接力、PRD 导出、选区 / 气泡条 / 快照预选集合。
3. 继续抽离 `categorize` / `followup` prompt，并为 AI JSON 返回增加运行时 schema 校验。
4. 增加 PRD Skill / Prompt Pack 能力，优先实现 `frontend-design-md`。
5. 增加 PRD section 保存状态或最近编辑时间。
6. 让低性能模式真正关闭大面积 blur、彩色层和非关键动画。
7. 升级多维权重机制与“高频线索 / 核心气泡”展示。
8. 在来源元信息和测试稳定后，再开发联网产品研究 skill。

## 风险与取舍

- AI 快照会增加等待时间：需要 loading、fallback 和局部失败处理。
- 快照数据会变大：需要持久化版本和大小控制。
- Markdown 文件适合保存知识内容，不适合承载拖拽坐标等高频 UI 状态。
- 文件写入会引入异步失败和并发冲突，需要 debounce、写入队列和失败提示。
- 合并后页面可能过载：必须坚持默认 Level 1，不主动展开长内容。
- 权重机制可能让旧想法被过度置顶：需要保留“最近气泡”和“高频气泡”的平衡。

## 最终验收叙事

用户在灵感气泡页面记录想法，随着点击、追问和归类逐渐形成思考现场。任何时刻，用户都可以在当前页面创建认知快照。快照会自动压缩为一句状态、几个语义锚点、一段逻辑脉络和一条唤醒指令。用户回来后，不需要重新阅读所有气泡，只要点击最近快照，即可恢复画布和当时的思维状态；需要更多信息时，再逐级展开到 Level 2 或 Level 3。

## 阶段 11：多 AI 服务商支持

目标：支持多个 AI 服务商（Moonshot / DeepSeek / ModelScope），允许用户在设置页面灵活切换 AI 提供者，并通过统一接口调用不同服务商的 API。

- [x] 新增 `AIProvider` 类型定义，支持 `modelscope` | `deepseek` | `moonshot`。
- [x] 创建 `src/stores/settingsStore.ts`，使用 Zustand 管理 AI 配置状态。
- [x] 配置持久化到浏览器 localStorage，用户刷新后配置保持。
- [x] 每个服务商独立存储 API Key，避免切换时密钥混淆。
- [x] 切换服务商时自动切换默认模型和 API 地址。

前端配置页面：

- [x] 创建 `src/pages/Settings.tsx` 设置页面。
- [x] 设置入口从 Logo 调整为右上角 `...` 全局辅助菜单，Logo 回到灵感气泡主工作区。
- [x] 支持选择服务商、输入 API Key、选择/输入模型名称。
- [x] 提供「应用配置并测试连接」功能，验证配置正确性。
- [x] 测试连接成功/失败有明确提示。

后端路由设计：

- [x] 新增 `GET /api/ai/config` 接口，获取当前 AI 配置（不暴露 API Key）。
- [x] 新增 `POST /api/ai/config` 接口，动态更新后端 AI 配置。
- [x] 后端启动时从环境变量加载配置。
- [x] 支持运行时切换 AI 提供商，无需重启服务。

API 配置结构：

```typescript
interface AIConfig {
  provider: AIProvider
  baseURL: string
  apiKey: string
  model: string
}
```

服务商配置映射：

| 服务商 | baseURL | 默认模型 |
|--------|---------|----------|
| moonshot | https://api.moonshot.cn/v1 | kimi-k2.6 |
| deepseek | https://api.deepseek.com | deepseek-v4-pro |
| modelscope | https://api-inference.modelscope.cn/v1 | moonshotai/Kimi-K2.5 |

环境变量配置：

```env
MODELSCOPE_API_KEY=xxx
DEEPSEEK_API_KEY=xxx
MOONSHOT_API_KEY=xxx
AI_PROVIDER=moonshot
```

扩展新服务商步骤：

1. 在 `src/stores/settingsStore.ts` 添加 `AIProvider` 类型和配置。
2. 在 `api/routes/ai.ts` 的 `getAIConfigFromEnv` 和 `/config` 路由添加对应配置。
3. 在 `src/pages/Settings.tsx` 添加新的服务商选项。
4. 更新 `.env.example` 添加新的环境变量。

验收标准：

- [x] 用户可以在设置页面切换 Moonshot / DeepSeek / ModelScope。
- [x] 每个服务商的 API Key 独立存储，互不影响。
- [x] 切换服务商后，AI 功能使用新的服务商。
- [x] 测试连接功能能正确验证 API 配置。
- [x] 配置保存在浏览器本地，刷新后保持。
- [x] 后端可根据前端请求动态切换 AI 提供商。

## 阶段 12：前端 Logo 与设置入口收敛

- [x] 修改 `MainNavigation.tsx`，Logo 使用 `Link` 组件包裹。
- [x] 点击 Logo 回到灵感气泡主工作区 `/`，设置入口由右上角 `...` 全局辅助菜单承载。
- [x] 设置页面保持与其他页面一致的 UI 风格（liquid glass、warm red）。

验收标准：

- [x] Logo 可点击，hover 有视觉反馈。
- [x] 点击后正确回到灵感气泡主工作区。
- [x] 设置页面与其他页面风格统一。

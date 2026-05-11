# Aethel: AI Cognitive Workspace for Product Thinking｜面向产品构思的 AI 认知工作区

<p align="center">
  <img src="public/aethel-logo.png" alt="Aethel Logo" width="280" />
</p>

[English](#english) | [中文](#中文)

---

## English

### 🌟 Overview
**Aethel** is an AI cognitive workspace for product thinking. It uses "bubbles" as cognitive carriers to help product managers, founders, designers, and builders capture early product ideas, let AI ask clarifying follow-up questions, organize emerging logic into semantic snapshots, and turn selected thinking threads into structured PRD drafts.

### 🚀 Core Features
- **Product Thinking Bubble Space**: Quickly capture product ideas, assumptions, user scenarios, constraints, and open questions via text or voice.
- **AI Intelligent Categorization**: Automatically groups related bubbles, recommends tags, and detects correlations (related, contradictory, or duplicate).
- **Cognitive Snapshot System**: Save, compress, and restore product-thinking contexts through semantic anchors, logic flows, and wake-up prompts.
- **Creative Workshop**: Run AI-backed skills that transform a one-line idea, PRD draft, or rough external input into structured product-thinking bubbles.
- **PRD Output Center**: Generate editable PRD section drafts from selected bubble groups, with tag-colored sections and Markdown/PDF exports.
- **AI Follow-up System**: Interactive AI asks clarifying questions to help refine goals, users, scenarios, risks, and success criteria.
- **Durable Knowledge Storage**: Persist bubbles and snapshots as Markdown files, with canvas state stored in JSON for reliable recovery and Git-friendly evolution.
- **Workspace Context Controls**: Maintain an explicit active bubble and multi-bubble selection state, with contextual AI panels and richer bubble detail history.

### 🧭 Product Workflow
```text
Rough idea / PRD draft / external notes
  -> Creative Workshop AI skill analysis
  -> Candidate bubbles with clarification loop
  -> Bubble workspace organization, follow-up, categorization, and snapshots
  -> PRD Output Center grouped by bubble tags/categories
  -> Editable section drafts
  -> Markdown / PDF export
```

### 🧩 Key Pages
- **Inspiration Bubbles (`/`)**: The primary cognitive canvas for capturing, selecting, editing, deleting, classifying, and expanding product-thinking bubbles.
- **Creative Workshop (`/workshop`)**: The input transformation layer. It executes AI skills such as one-line idea decomposition and PRD-to-bubbles analysis, then writes results back to the canvas.
- **PRD Output (`/prd`)**: The document output layer. It groups selected bubbles by tag/category, generates editable PRD sections, and exports a complete document.
- **Snapshot Library (`/context`)**: The semantic memory layer for reviewing and restoring saved thinking contexts.

### 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion.
- **Visualization**: HTML5 Canvas API (for the high-performance bubble workspace).
- **Backend**: Express (as a secure proxy for AI services and local workspace file APIs).
- **AI 引擎**：DeepSeek-v4-pro（推荐）、ModelScope API (Kimi-K2.5)，按需切换
- **Persistence**: Markdown knowledge atoms under `data/bubbles`, semantic snapshots under `data/snapshots`, and runtime layout state in `data/workspace.json`.

### 📦 Getting Started

#### Prerequisites
- Node.js (v18+)
- DeepSeek API Key（recommended）or ModelScope API Key

#### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/SuTang-vain/Aethel.git
   cd Aethel
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   MODELSCOPE_API_KEY=your_api_key_here
   PORT=3000
   ```

#### Development
Run both the frontend and backend servers concurrently:
```bash
npm run dev
```

Then open:
```text
http://localhost:5173/
```

The Express API runs on `http://localhost:3000/` and Vite proxies `/api/*` requests to it.

#### Useful Scripts
```bash
npm run check    # TypeScript type check
npm run build    # Production build
npm run lint     # ESLint
```

#### Local Data Layout
```text
data/
├─ bubbles/       # One Markdown file per bubble
├─ snapshots/     # Semantic snapshot Markdown files
├─ .trash/        # Soft-deleted bubble/snapshot files
└─ workspace.json # Canvas layout, viewport, categories, relations, and runtime state
```

---

## 中文

### 🌟 项目概述
**Aethel** 是一款面向产品构思的 AI 认知工作区。它以“气泡”为思维载体，帮助产品经理、创业者、设计师和构建者捕捉早期产品想法，通过 AI 追问澄清目标、用户、场景与风险，将逐渐浮现的逻辑整理为语义快照，并把选定的思考线索生成结构化 PRD 草稿。

### 🚀 核心功能
- **产品构思气泡空间**：支持文字/语音快速录入产品想法、假设、用户场景、约束与开放问题。
- **AI 智能归类引擎**：自动分析气泡关联性，智能推荐标签，并检测重复或矛盾的内容。
- **认知快照系统**：通过语义锚点、逻辑脉络与唤醒指令，保存、压缩并恢复产品构思上下文。
- **创意工坊**：通过真实 AI skill runner，把一句话想法、PRD 草稿或外部输入转换为结构化产品气泡。
- **PRD 输出中心**：基于选定气泡束生成可编辑 PRD 分区草稿，支持标签同色标识、Markdown 和 PDF 导出。
- **AI 追问系统**：AI 会根据录入内容提出启发式追问，引导用户澄清目标用户、使用场景、风险与成功标准。
- **长期知识存储**：气泡与快照会落为 Markdown 文件，画布运行态写入 JSON，便于恢复、迁移和 Git 版本管理。
- **工作区上下文控制**：明确区分主处理气泡和多选气泡集合，右侧 AI 面板与左侧详情面板都能读取当前上下文。

### 🧭 产品工作流
```text
粗糙想法 / PRD 草稿 / 外部资料
  -> 创意工坊 AI skill 分析
  -> 候选气泡与用户确认补充
  -> 灵感气泡画布整理、追问、归类、快照
  -> PRD 输出中心按标签/分类分束
  -> 可编辑章节草稿
  -> Markdown / PDF 导出
```

### 🧩 关键页面
- **灵感气泡（`/`）**：主认知画布，负责捕捉、选择、编辑、删除、归类和扩展产品思考气泡。
- **创意工坊（`/workshop`）**：输入变换层，执行一句话拆解、PRD 气泡化等 AI skill，并把结果写回画布。
- **PRD 输出（`/prd`）**：文档输出层，按标签/分类归束所选气泡，生成可编辑 PRD 章节并导出完整文档。
- **快照库（`/context`）**：语义记忆层，用于回看和恢复已保存的思考现场。

### 🛠 技术栈
- **前端**：React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion。
- **可视化**：HTML5 Canvas API（用于高性能气泡交互画布）。
- **后端**：Express（作为 AI 服务代理层，并提供本地工作区文件 API）。
- **AI 引擎**：DeepSeek-v4-pro（推荐）、ModelScope API (Kimi-K2.5)，按需切换
- **持久化**：`data/bubbles` 保存气泡知识原子，`data/snapshots` 保存语义快照，`data/workspace.json` 保存布局和运行态。

### 📦 快速上手

#### 前置要求
- Node.js (v18+)
- ModelScope API Key

#### 安装步骤
1. 克隆仓库：
   ```bash
   git clone https://github.com/SuTang-vain/Aethel.git
   cd Aethel
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 配置环境变量：
   在根目录创建 `.env` 文件：
   ```env
   DEEPSEEK_API_KEY=您的DeepSeek API密钥
   MODELSCOPE_API_KEY=您的ModelScope API密钥（可选）
   AI_PROVIDER=deepseek  # 或 moonshot / modelscope
   PORT=3000
   ```

#### 开发启动
同时启动前端和后端服务：
```bash
npm run dev
```

浏览器打开：
```text
http://localhost:5173/
```

Express API 运行在 `http://localhost:3000/`，Vite 会将 `/api/*` 请求代理到后端。

#### 常用脚本
```bash
npm run check    # TypeScript 类型检查
npm run build    # 生产构建
npm run lint     # ESLint
```

#### 本地数据结构
```text
data/
├─ bubbles/       # 每个气泡一个 Markdown 文件
├─ snapshots/     # 语义快照 Markdown 文件
├─ .trash/        # 软删除的气泡/快照文件
└─ workspace.json # 画布布局、视口、分类、关系和运行态
```

---

### 📄 License
MIT License

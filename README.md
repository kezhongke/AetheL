# Aethel: AI Cognitive Workspace for Product Thinking
# Aethel：面向产品构思的 AI 认知工作区

[English](#english) | [中文](#中文)

---

## English

### 🌟 Overview
**Aethel** is an AI cognitive workspace for product thinking. It uses "bubbles" as cognitive carriers to help product managers, founders, designers, and builders capture early product ideas, let AI ask clarifying follow-up questions, organize emerging logic into semantic snapshots, and turn selected thinking threads into structured PRD drafts.

### 🚀 Core Features
- **Product Thinking Bubble Space**: Quickly capture product ideas, assumptions, user scenarios, constraints, and open questions via text or voice.
- **AI Intelligent Categorization**: Automatically groups related bubbles, recommends tags, and detects correlations (related, contradictory, or duplicate).
- **Cognitive Snapshot System**: Save, compress, and restore product-thinking contexts through semantic anchors, logic flows, and wake-up prompts.
- **PRD Output Center**: Stream-generate structured product requirement drafts based on selected bubble sets, supporting Markdown and PDF exports.
- **AI Follow-up System**: Interactive AI asks clarifying questions to help refine goals, users, scenarios, risks, and success criteria.

### 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion.
- **Visualization**: HTML5 Canvas API (for the high-performance bubble workspace).
- **Backend**: Express (as a secure proxy for AI services).
- **AI Engine**: ModelScope API (Kimi-K2.5), OpenMemory MCP for context memory.

### 📦 Getting Started

#### Prerequisites
- Node.js (v18+)
- ModelScope API Key

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

---

## 中文

### 🌟 项目概述
**Aethel** 是一款面向产品构思的 AI 认知工作区。它以“气泡”为思维载体，帮助产品经理、创业者、设计师和构建者捕捉早期产品想法，通过 AI 追问澄清目标、用户、场景与风险，将逐渐浮现的逻辑整理为语义快照，并把选定的思考线索生成结构化 PRD 草稿。

### 🚀 核心功能
- **产品构思气泡空间**：支持文字/语音快速录入产品想法、假设、用户场景、约束与开放问题。
- **AI 智能归类引擎**：自动分析气泡关联性，智能推荐标签，并检测重复或矛盾的内容。
- **认知快照系统**：通过语义锚点、逻辑脉络与唤醒指令，保存、压缩并恢复产品构思上下文。
- **PRD 输出中心**：基于选定的气泡集合，流式生成结构化产品需求草稿，支持导出为 Markdown 或 PDF。
- **AI 追问系统**：AI 会根据录入内容提出启发式追问，引导用户澄清目标用户、使用场景、风险与成功标准。

### 🛠 技术栈
- **前端**：React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion。
- **可视化**：HTML5 Canvas API（用于高性能气泡交互画布）。
- **后端**：Express（作为 AI 服务的安全代理层）。
- **AI 引擎**：ModelScope API (Kimi-K2.5), OpenMemory MCP (用于上下文记忆)。

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
   MODELSCOPE_API_KEY=您的API密钥
   PORT=3000
   ```

#### 开发启动
同时启动前端和后端服务：
```bash
npm run dev
```

---

### 📄 License
MIT License

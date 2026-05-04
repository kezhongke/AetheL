# Aethel: Dynamic Morphological PRD & Cognitive Flow Space
# Aethel: 动态形态 PRD 与认知流场

[English](#english) | [中文](#中文)

---

## English

### 🌟 Overview
**Aethel** is an AI-powered product management and creative writing tool that uses "bubbles" as cognitive carriers. It helps users capture fragmented inspirations through text or voice, automatically categorizes and associates these ideas using AI, and eventually assists in generating structured PRD (Product Requirement Documents).

### 🚀 Core Features
- **Inspiration Bubble Space**: Quickly capture ideas via text or voice. Drag, zoom, and organize bubbles on an infinite canvas.
- **AI Intelligent Categorization**: Automatically groups related bubbles, recommends tags, and detects correlations (related, contradictory, or duplicate).
- **Cognitive Context Management**: Save and restore "snapshots" of your workspace to switch between different thinking flows seamlessly.
- **PRD Output Center**: Stream-generate professional PRD modules based on selected bubble sets, supporting Markdown and PDF exports.
- **AI Follow-up System**: Interactive AI that asks insightful questions to help you refine and expand your initial thoughts.

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
**Aethel** 是一款以“气泡”为思维载体的 AI 辅助产品管理与创意写作工具。它旨在帮助用户通过文字或语音快速捕捉碎片化灵感，利用 AI 自动进行归类与关联，最终辅助生成结构严密的 PRD 文档。

### 🚀 核心功能
- **灵感气泡空间**：支持文字/语音快速录入，可在无限画布上自由拖拽、缩放和组织气泡。
- **AI 智能归类引擎**：自动分析气泡关联性，智能推荐标签，并检测重复或矛盾的内容。
- **认知上下文管理**：支持工作区“快照”保存与恢复，在不同思维流之间无缝切换。
- **PRD 输出中心**：基于选定的气泡集合，流式生成专业的 PRD 模块，支持导出为 Markdown 或 PDF。
- **AI 追问系统**：AI 会根据录入的内容提出启发式追问，引导用户完善思维细节。

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

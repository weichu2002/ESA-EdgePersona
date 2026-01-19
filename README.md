# ESA EdgePersona：基于边缘计算的动态数字生命体构建平台

<div align="right">
  <img src="https://img.alicdn.com/tfs/TB1..5GRFXXXXX7XpXXXXXXXXXX-400-400.png" width="150" alt="Aliyun ESA Logo">
</div>

> **本项目由阿里云ESA提供加速、计算和保护**
<img width="7534" height="844" alt="图片" src="https://github.com/user-attachments/assets/d4404257-5430-49b3-8977-f49a47fcd04e" />

---

## 📖 项目介绍

**ESA EdgePersona** 是一个运行在阿里云边缘节点（Edge Node）上的动态数字人格镜像系统。不同于传统的 AI 助手，它并非为了回答问题而生，而是为了“成为”用户。通过独创的“灵魂播种”交互和基于边缘 KV 的记忆存储，它能构建一个在思维、语言和价值观上无限趋近于用户的数字分身，并随着每一次互动和大事记的记录而持续演化。

### 🌟 1. 实用性 (Practicality)

*   **毫秒级响应的私人伴侣**：依托 **阿里云 ESA (Edge Security Acceleration)** 的全球边缘网络，数字生命体的计算逻辑直接在离用户最近的节点执行。无论是情感陪伴还是自我对话，都能实现近乎零延迟的流畅体验。
*   **数字遗产与自我认知**：项目提供了一个极具深度的自我探索工具。通过系统化的 20 道人格测试和日常“大事记”记录，用户可以将核心价值观、人生高光时刻永久数字化保存。它既是当下的“数字镜子”，也是未来的“数字遗产”。
*   **数据主权与隐私**：所有核心人格数据（Profile）和记忆（Memories）均存储于 ESA EdgeKV 中，确保数据在边缘侧的安全隔离，相比中心化云端存储，更能满足用户对私密数据主权的诉求。

### 💡 2. 创意性 (Creativity)

*   **“灵魂播种”的游戏化构建**：摒弃了枯燥的表单填写，设计了名为“灵魂播种”的沉浸式卡牌交互流程。从“认知光谱”的滑动选择到“道德困境”的抉择，用户在极具仪式感的互动中完成了 AI 的人格初始化 (System Prompt Injection)。
*   **非助理式 (Non-Assistant) 交互范式**：不仅是 UI 的创新，更是 Prompt 工程的创新。系统明确定义 AI “不是助手，而是镜像”。它会模仿用户的口头禅（如“说白了”、“其实”），会根据用户的“风险偏好”表现出激进或保守的态度，甚至会因为“性格设定”而拒绝礼貌——这创造了一种前所未有的真实共鸣感。
*   **动态进化的记忆系统**：引入了“大事记 (Life Events)”概念。用户记录的每一次人生重大时刻（如“赢得初选”、“获得融资”）都会被赋予高权重，实时重构 AI 的长期记忆。数字生命不再是静态的快照，而是随用户经历共同成长的流动实体。

### 🛠️ 3. 技术深度 (Technical Depth)

*   **Serverless Edge Routine 架构**：
    *   本项目完全摒弃传统源站，后端逻辑全部托管于 **ESA Edge Routine (边缘函数)**。
    *   利用 `EdgeKV` 实现分布式状态管理，存储用户画像 (Profile)、对话历史 (History) 和事件流 (Events)。
    *   实现了边缘侧的动态 Prompt 组装算法：`System Prompt = 基础人格 + 动态 KV 记忆 + 实时上下文`。
*   **复杂的 Prompt Engineering 工程化**：
    *   在后端实现了精细的 Prompt 编排，将前端采集的结构化数据（如性格滑块数值 `0.8`）动态映射为大模型可理解的自然语言指令（如“你是一个极度热衷冒险的人”）。
    *   集成了 DeepSeek V3 大模型 API，通过边缘函数作为安全网关，隐藏 Key 并控制 Token 消耗。
*   **高性能前端工程**：
    *   基于 React + Vite + TypeScript 构建，采用 Framer Motion 实现丝滑的卡牌切换动画。
    *   全响应式设计，适配移动端与桌面端，结合 Tailwind CSS 实现暗黑科幻风格的沉浸式 UI。

---

## 🚀 快速开始

### 本地开发

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

### 部署至阿里云 ESA

本项目专为 ESA 环境设计，请参考 `functions/server.js` 进行边缘函数配置。

1. 在阿里云 ESA 控制台创建 Edge Routine。
2. 创建名为 `edge_persona_kv` 的 KV 命名空间。
3. 配置环境变量 `DEEPSEEK_API_KEY`。
4. 将构建后的静态资源部署至 ESA Pages。

---

*Made with ❤️ by [Your Name/Team Name]*

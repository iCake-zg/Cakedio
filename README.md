# 📻 Cakedio - AI 智能音乐电台

Cakedio 是一个基于 AI 的沉浸式智能音乐电台应用。它通过大语言模型（LLM）扮演一位名叫 "Cakedio" 的专属电台 DJ，能够根据你的环境、天气、心情或指定的歌单，智能推荐音乐，并生成带有情感的、包含歌曲背景故事的语音播报与串场词。

## ✨ 核心特性

- 🎙️ **AI 专属 DJ**：基于大模型动态生成富有情感的电台开场白、歌曲介绍和串场词。
- 🎵 **智能选歌**：对接网易云音乐 API，支持从指定歌单中智能挑选合适的歌曲。
- 🗣️ **本地高质量 TTS**：内置基于 Python 和 Kokoro ONNX 的本地语音合成微服务，发音自然流畅，毫秒级响应。
- 🌃 **赛博/复古 UI**：提供极简、带有音频波形、时钟面板的 Web 交互界面。
- 🔌 **多模型兼容**：底层基于 OpenAI SDK 接口标准，可无缝切换至 Kimi、MiniMax 等任意兼容该标准的第三方大模型。

## 🏗️ 架构概览

项目采用前后端分离与微服务结合的架构：
- **前端**：原生 HTML/CSS/JS (`public/`)，负责沉浸式 UI 展示和跨流（DJ语音与音乐流）的平滑播放调度。
- **主控后端**：Node.js + Express (`src/`)，作为核心网关，负责调度 LLM 进行决策、请求音乐播放链接，以及驱动 TTS 生成。
- **TTS 微服务**：Python + FastAPI (`src/tts/chatterbox_server.py`)，由 Node.js 主进程在启动时自动拉起，专注于本地文本转语音（TTS）的推理计算。

## 🚀 快速开始

### 1. 环境要求
- [Node.js](https://nodejs.org/) (推荐 v18+)
- [Python 3](https://www.python.org/) (项目已内置包含必要依赖的 `venv` 虚拟环境)

### 2. 安装依赖

在项目根目录下安装 Node.js 相关依赖：
```bash
npm install
```

### 3. 环境配置

修改项目根目录的 `.env` 文件，填入你的大模型 API 密钥。默认配置支持 Kimi (Moonshot)：

```env
PORT=8080

# === 大语言模型 (LLM) 配置 ===
LLM_PROVIDER=kimi
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_API_KEY=你的API_KEY
LLM_MODEL=kimi-k2.6

# === 音乐配置 ===
# 网易云音乐歌单 ID（选填），配置后电台将优先从该歌单中为你选歌
NETEASE_PLAYLIST_ID=496892604
```

### 4. 启动项目

运行以下命令启动服务。Node.js 会自动拉起 Python 的 TTS 子进程：

```bash
npm run dev
# 或
npm start
```

看到控制台输出 `Cakedio Radio 启动成功！` 后，在浏览器中访问 [http://localhost:8080](http://localhost:8080) 即可开始你的专属电台体验。

## 📁 目录结构

```text
cakedio-radio/
├── public/                # 前端页面及静态资源
│   ├── tts/               # 生成的语音文件缓存目录
│   ├── app.js             # 前端核心交互逻辑
│   ├── index.html         # 电台主 UI
│   └── style.css          # 页面样式表
├── src/                   # Node.js 后端源码
│   ├── llm/               # 大模型交互模块 (Prompt构建与请求)
│   ├── music/             # 音乐获取模块 (对接网易云音乐 API)
│   ├── tts/               # 语音合成调度 (及 Python FastAPI 服务端)
│   └── index.js           # Express 主服务入口
├── user/                  # 用户偏好设置 (用于扩展常驻上下文)
├── venv/                  # Python 虚拟环境 (包含 Kokoro 等模型运行环境)
├── .env                   # 环境变量配置文件
└── package.json           # Node.js 项目描述及脚本
```

## 📄 许可协议

MIT License

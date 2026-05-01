# ✈️ Smart Travel Planner - Web Edition

AI-powered travel planning assistant with weather-based recommendations, now with a modern web interface!

## 🎯 项目概述

这是一个基于 LangGraph + OpenAI + FastAPI 的智能旅行规划系统，能够：
- 🌤️ 实时查询天气预报
- 🤖 AI 智能分析生成旅行建议
- 👕 根据天气推荐穿衣搭配
- 🎒 推荐必备物品清单
- 🎨 推荐适合天气的活动

## 📁 项目结构

```
Whether/
├── travel_agent.py          # 核心 AI Agent 逻辑
├── backend/
│   ├── app.py              # FastAPI 服务端（SSE流式接口）
│   └── requirements.txt    # Python 依赖
├── frontend_examples/      # 前端示例代码
│   ├── simple_demo.html   # 零配置 HTML 演示页面
│   ├── react/             # React 组件和示例
│   └── vue/               # Vue 组件和示例
├── start_backend.bat      # Windows 启动脚本
├── start_backend.sh       # Linux/Mac 启动脚本
├── .env.example           # 环境变量模板
└── README.md              # 本文件
```

## 🚀 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- OpenWeather API Key ([免费获取](https://openweathermap.org/api))
- OpenAI API Key ([获取地址](https://platform.openai.com/api-keys))

### 1️⃣ 配置环境变量

在项目根目录创建 `.env` 文件:

```bash
OPENWEATHER_API_KEY=your_openweather_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 2️⃣ 启动后端

```bash
# 安装依赖
pip install -r backend/requirements.txt

# 启动 FastAPI 服务
uvicorn backend.app:app --reload --port 8000
```

访问 http://localhost:8000 查看 API 状态。
API 文档：http://localhost:8000/docs

### 3️⃣ 初始化前端

#### 选项 A: React + Vite + Tailwind

```bash
# 创建项目
npm create vite@latest frontend -- --template react
cd frontend

# 安装依赖
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react

# 复制示例代码
# 将 frontend_examples/react/App.jsx 复制到 frontend/src/App.jsx
# 配置 Tailwind（参考 SETUP_GUIDE.md）

# 启动开发服务器
npm run dev
```

#### 选项 B: Vue + Vite + Tailwind

```bash
# 创建项目
npm create vite@latest frontend -- --template vue
cd frontend

# 安装依赖
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-vue-next

# 复制示例代码
# 将 frontend_examples/vue/App.vue 复制到 frontend/src/App.vue
# 配置 Tailwind（参考 SETUP_GUIDE.md）

# 启动开发服务器
npm run dev
```

### 4️⃣ 访问应用

前端默认地址: http://localhost:5173

## 📡 API 接口说明

### POST `/api/travel/stream`

SSE 流式接口，返回实时旅行规划过程。

**请求体:**
```json
{
  "destination": "Tokyo",
  "travel_dates": "May 15-20, 2026"
}
```

**事件类型:**
- `status` - 状态更新
- `tool_call` - AI 工具调用
- `result` - 最终结果
- `error` - 错误信息
- `done` - 完成信号

## 🔧 技术栈

### 后端
- **FastAPI** - 现代 Python Web 框架
- **LangGraph** - AI Agent 工作流引擎
- **OpenAI GPT-4** - 大语言模型
- **Server-Sent Events (SSE)** - 实时流式推送

### 前端（可选）
- **Vite** - 极速前端构建工具
- **React / Vue 3** - UI 框架
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Lucide Icons** - 美观的图标库

## 📖 详细文档

- [API Docs](http://localhost:8000/docs) - FastAPI 自动生成的 API 文档

## 🎨 功能特性

### 核心功能
✅ 智能天气查询（支持全球城市）
✅ AI 驱动的旅行建议生成
✅ 基于实际天气的穿衣推荐
✅ 必备物品清单
✅ 天气相关活动推荐

### Web 界面特性
✅ 实时流式更新（SSE）
✅ 响应式设计（移动端友好）
✅ 优雅的加载动画
✅ 工具调用可视化
✅ 错误处理和提示

## 🛠️ 开发建议

### 推荐的开发流程
1. 先启动后端服务（`uvicorn backend.app:app --reload`）
2. 在另一个终端启动前端开发服务器（`npm run dev`）
3. 代码修改会自动热重载

### 调试技巧
- 后端日志查看: 直接在运行 uvicorn 的终端
- 前端控制台: 浏览器开发者工具 (F12)
- API 测试: 使用 http://localhost:8000/docs 的交互式文档

## 🔐 安全注意事项

⚠️ **重要**:
- 不要将 `.env` 文件提交到版本控制
- 生产环境需修改 CORS 配置（`backend/app.py`）
- API 密钥应通过环境变量管理，不要硬编码

## 📝 TODO / 扩展建议

- [ ] 添加用户输入验证
- [ ] 支持多语言响应
- [ ] 缓存天气数据减少 API 调用
- [ ] 添加更多旅行建议维度（美食、住宿等）
- [ ] 集成地图可视化
- [ ] 支持多日行程规划
- [ ] 添加用户反馈机制

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**快乐旅行！** 🌍✈️🎒

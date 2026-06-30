# Ship of Theseus — AI Agent Instructions

> 本地优先、游戏风格的多 AI 角色对话界面。React/Pixi 前端 + Node 桥接后端。

## 项目一句话概括

前端是**纯展示层**，后端的 `bridge-server/server.js` 才是真正拥有角色上下文、管理对话状态、调用 AI 的地方。浏览器不接触 API Key，也不直接读取角色文件。

## 关键命令

```powershell
npm install          # 安装依赖
npm run dev          # 启动 Vite 开发服务器（自动启动桥接后端）
npm run local-ai     # 单独启动桥接后端
npm run lint         # oxlint 代码检查
npm run build        # 生产构建
```

## 架构速览

```
浏览器 (React/Pixi UI)
  ↕ fetch + SSE 流
桥接后端 (bridge-server/server.js)  ← 仅本地回环
  ↕ 文件系统
外部角色工作区 (`persona_path.json` 的 `personaHome` 指向)
```

- 前端入口: `src/main.jsx` → `src/App.jsx`（无路由，纯 state 切换场景）
- 状态中心: `src/hooks/useChatManager.js`
- API 层: `src/api/claudeBridge.js`
- 桥接后端: `bridge-server/server.js`
- 角色数据: 外部目录，由 `persona_path.json` 的 `personaHome` 指定

## 核心约定

### P5R 视觉系统（必读）
参见 [P5R-CONTROL-STYLE-GUIDE.md](./doc/P5R-CONTROL-STYLE-GUIDE.md) 获取完整设计规范。

关键要点：
- 只用三色: `PAPER`(#F5F0EB), `ANARCHY`(#D40000), `BLACK`(#1A1A1A)
- 所有容器/按钮必须 `skewX(-8deg)` 斜切，内部文字反向拉正
- hover 时红黑反转：背景黑→白，边框白→红，文字白→黑
- 样式写在 JSX 内联对象中，**不**用 CSS Module 或样式文件
- 颜色常量在 `src/config/constants.js`

### 禁止操作
- ❌ 不要 commit 角色名、prompt、头像、API Key
- ❌ 不要在浏览器端存放 API Key
- ❌ 不要用 `VITE_` 前缀的环境变量传凭证（会暴露给浏览器）
- ❌ 不要引入路由库（场景切换用 state 控制）

### React 模式
- 函数组件 + 自定义 Hook
- `useChatManager` 是全局状态控制器，不要绕过它
- 流式 AI 回复用函数式 state 更新追加到聊天记录末尾
- 组件卸载时要清理 Pixi.js canvas

## 桥接后端 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查，前端轮询此端点等待后端就绪 |
| `/personas` | GET | 返回角色列表（不含 prompt 原文） |
| `/chat` | POST | 发送消息，返回 SSE 流（`text/event-stream`） |

SSE 流格式：每行一个 JSON 对象，`data:` 前缀。流结束发送 `[DONE]`。
中途取消：前端调用 `AbortController.abort()`，后端检测到连接关闭后终止 `claude` 子进程。

## 文档索引

| 文档 | 内容 |
|------|------|
| [README.md](./README.md) | 项目概览和快速开始 |
| [P5R-CONTROL-STYLE-GUIDE.md](./doc/P5R-CONTROL-STYLE-GUIDE.md) | UI 控件设计规范（必读） |
| [LOCAL_AI_SETUP.md](./doc/LOCAL_AI_SETUP.md) | 本地 AI 配置指南 |
| [PERSONA_SETUP.template.md](./doc/PERSONA_SETUP.template.md) | 角色工作区搭建清单 |

## 组件文件结构约定

```
src/
├── components/          # 可复用 UI 组件（跨场景共享）
│   ├── AiDialogueStream.jsx
│   ├── GameBackground.jsx
│   └── UserInputPanel.jsx
├── scenes/              # 场景组件（每个文件夹一个场景）
│   └── ShipPanorama/
│       ├── index.jsx          # 场景入口
│       ├── LaunchControls.jsx # 子组件
│       ├── ShipCanvas.jsx     # Pixi.js 画布
│       ├── ZoneHover.jsx      # 未使用（预留工具提示）
│       └── ZoneScene.jsx      # 区域详情弹窗
├── hooks/               # 自定义 Hook
├── api/                 # API 调用层
└── config/              # 常量配置
```

新场景遵循相同模式：文件夹内 `index.jsx` 为入口，子组件与入口同目录。

## 启动流程

1. 前端挂载后自动调用 `checkBridgeHealth()` 轮询 `/health` 端点，每 1.5s 重试直到桥接后端就绪
2. 桥接就绪后加载 `/personas` 列表，填充角色选择 UI
3. 若角色加载失败，顶部显示红色错误横幅（含错误原因 + RETRY 按钮）
4. 启动阶段用户看到空白画面，目前无 loading 指示器

## 尚未实现的功能

- **WAR ROOM** (多人研讨会): 仅占位符 `InfoPlaceholder`
- **CAPTAIN'S CABIN** (个人仪表板): 仅占位符
- **ENGINE ROOM / ARCHIVE / MEMORY WARD**: 全部仅占位符
- **ZoneHover 组件**: 已定义但从未渲染（可能为未来工具提示预留）
- **仅 Crew Quarters 区域** 有完整实现，其余 5 个区域均为桩

## 容易踩的坑

1. **运行不起来的首要原因**: 未配置 `persona_path.json`，或外部角色工作区结构不完整
2. **Pixi.js 泄漏**: 场景切换时必须在 `useEffect` 清理函数中调用 `app.destroy(true, { children: true })`，否则 canvas 会堆积。应在组件卸载时销毁，不仅是挂载时。
3. **并发请求**: 后端每个角色只允许一个活跃请求，同时发两个会 409。前端 `isStreaming` 状态会禁用 UI 控件防止重复发送。
4. **样式修改**: 样式全部内联在 JSX 中，修改视觉需要编辑组件文件而非 CSS。全局样式文件 `src/index.css` 仅为 reset，`src/App.css` 仅定义 `@keyframes` 动画。
5. **角色放错位置**: 角色 `.md` 文件必须在 `persona_path.json` 指定的外部目录，不在仓库内
6. **颜色常量**: 所有新组件必须从 `src/config/constants.js` 导入 `COLORS`，禁止在组件内重新声明颜色变量。部分旧组件（如 `LaunchControls.jsx`）仍有内联颜色声明，需逐步统一。
7. **项目为纯 JavaScript**: 无 TypeScript，类型靠隐式约定和少量 JSDoc。
8. **零测试覆盖**: 无 Jest/Vitest 配置，仅靠 `oxlint` 做静态检查。
9. **`partReplacement` 进度**: 每次对话回合 +10%（0→10→20...），用于驱动 `GameBackground` 的颜色插值动画。

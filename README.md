# 无尽炼金

一款 AI 驱动的元素合成 Web 应用。从“金、木、水、火、土”五种基础元素出发，通过拖拽把两种元素组合在一起，由模型生成新的结果元素，并把进度保存到服务器数据库中。

当前项目已经从“纯前端 + localStorage”迁移为“React 前端 + Node.js 服务端 + SQLite”的单用户部署方案，适合你把它放到自己的服务器上长期游玩。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 前端 | React 18 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 服务端 | Express 5 + TypeScript |
| 数据库 | SQLite |
| AI 调用 | 服务端代理 OpenAI 兼容接口 |
| 包管理 | pnpm |

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，至少配置：

```bash
OPENAI_API_KEY=你的模型密钥
```

可选项：

```bash
PORT=3001
DATABASE_PATH=.data/infinite-craft.db
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
AI_TIMEOUT_MS=10000
```

### 3. 启动开发环境

```bash
pnpm dev
```

这会同时启动：

- 前端开发服务器：`http://localhost:5173`
- 后端 API 服务：`http://localhost:3001`

前端开发环境已内置 `/api` 代理，无需额外配置跨域。

## 常用命令

```bash
# 同时启动前后端开发环境
pnpm dev

# 构建前端并检查服务端 TypeScript
pnpm build

# 仅启动服务端
pnpm start

# 预览前端构建产物
pnpm preview
```

## 数据持久化

- 游戏元素、配方、工作台布局、模型配置和合成次数都保存在 SQLite 数据库中。
- 默认数据库文件路径是 `.data/infinite-craft.db`。
- `OPENAI_API_KEY` 不会保存到前端，也不会写入数据库，只从服务器环境变量读取。

## 项目结构

```text
src/
├── components/              # 前端 UI 组件
├── hooks/                   # 前端交互逻辑
├── services/                # 前端 API 调用封装
├── store/                   # Zustand 内存态
├── types/                   # 共享类型定义
└── utils/                   # 常量与工具函数

server/
├── config/                  # 环境变量读取
├── db/                      # SQLite 连接与初始化
├── routes/                  # API 路由
└── services/                # 仓储层与 AI 服务
```

## 服务器部署

推荐部署方式：

1. 安装 Node.js 22+ 和 pnpm。
2. 拉取项目代码并执行 `pnpm install`。
3. 配置 `.env`，至少设置 `OPENAI_API_KEY`。
4. 执行 `pnpm build`。
5. 用 `pnpm start` 启动服务端。
6. 用 Nginx 反向代理到 `http://localhost:3001`。
7. 把 `.data/` 目录纳入你的备份策略。

如果你使用 PM2，可以直接运行：

```bash
pm2 start "pnpm start" --name infinite-craft
```

## 当前状态

已完成：

- 服务端 API 与 SQLite 初始化
- 前端首屏从服务端加载状态
- 工作台与设置自动同步到服务端
- AI 合成改为服务端代理，不再暴露前端密钥
- 最小可用设置弹窗

## 许可证

MIT

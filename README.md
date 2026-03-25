# 🧪 无尽炼金 (Infinite Craft)

一款基于 AI 驱动的元素合成 Web 应用。从"金、木、水、火、土"五种基础元素出发，通过拖拽将两种元素组合，由 AI 实时生成合成结果，构建出一棵庞大的合成树。

## 核心玩法

```
选择元素 → 拖拽合成 → AI 返回新元素 → 元素入库 → 继续合成
```

## 技术栈

| 类别     | 选型                       |
| -------- | -------------------------- |
| 框架     | React 18 + TypeScript      |
| 构建工具 | Vite 5                     |
| 样式     | Tailwind CSS 4             |
| 状态管理 | Zustand (persist 持久化)   |
| 动画     | Framer Motion              |
| AI 调用  | OpenAI 兼容格式 API (fetch)|
| 数据持久化 | localStorage            |
| 包管理   | pnpm                       |

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

启动后访问 `http://localhost:5173` 即可体验。

## 项目结构

```
src/
├── components/        # UI 组件
│   ├── ElementCard.tsx    # 元素卡片
│   ├── Sidebar.tsx        # 左侧元素库面板
│   ├── Workspace.tsx      # 工作台无限画布
│   └── ContextMenu.tsx    # 右键上下文菜单
├── hooks/             # 自定义 Hooks
│   └── useCanvas.ts       # 画布缩放与平移
├── services/          # 服务层 (AI API 调用)
├── store/             # Zustand 状态管理
│   ├── elementStore.ts    # 元素库状态
│   ├── recipeStore.ts     # 配方缓存状态
│   ├── workspaceStore.ts  # 工作台状态
│   └── settingsStore.ts   # 设置状态
├── types/             # TypeScript 类型定义
├── utils/             # 工具函数与常量
├── App.tsx            # 根组件
├── main.tsx           # 入口
└── index.css          # 全局样式
```

## 功能进度

- [x] Phase 0 — 项目初始化
- [x] Phase 1 — 数据层 (类型定义、Zustand Store、localStorage 持久化)
- [x] Phase 2 — 元素卡片与侧边栏 (搜索、分类筛选、排序)
- [x] Phase 3 — 工作台画布 (无限画布、缩放平移、元素拖拽、右键菜单)
- [ ] Phase 4 — 拖拽合成系统
- [ ] Phase 5 — AI 合成服务
- [ ] Phase 6 — 合成逻辑与动画
- [ ] Phase 7 — 图鉴与配方表
- [ ] Phase 8 — 合成树可视化
- [ ] Phase 9 — 打磨与部署

## 许可证

MIT

# 无尽炼金 — 开发步骤指南

> 本文档基于 [PRD.md](./PRD.md) 编写，采用**纯前端方案**，AI 接入使用 **OpenAI 兼容格式 API**。

---

## 技术栈确认

| 类别       | 选型                          | 说明                              |
| ---------- | ----------------------------- | --------------------------------- |
| 框架       | React 18 + TypeScript         | 组件化开发，类型安全              |
| 构建工具   | Vite 5                        | 快速 HMR，开箱即用 TS 支持       |
| 样式       | Tailwind CSS 3                | 原子化 CSS，快速开发              |
| 状态管理   | Zustand                       | 轻量，支持 persist 中间件         |
| 拖拽       | 原生 Pointer Events           | 自由画布场景下原生实现更灵活      |
| 动画       | Framer Motion                 | 声明式动画，React 生态首选        |
| AI 调用    | fetch（OpenAI 兼容格式）      | 直接调用，无需 SDK 依赖           |
| 数据持久化 | localStorage                  | 简单可靠，单用户场景足够          |
| 合成树可视化 | reactflow 或 D3.js          | 节点连线图可视化                  |
| 包管理     | pnpm                          | 快速、节省磁盘空间                |

---

## 项目目录结构

```
infinite-craft/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/                    # 静态资源（图片、图标等）
│   ├── components/                # UI 组件
│   │   ├── ElementCard.tsx        # 元素卡片
│   │   ├── Sidebar.tsx            # 左侧元素库面板
│   │   ├── Workspace.tsx          # 工作台画布
│   │   ├── Toolbar.tsx            # 顶部工具栏
│   │   ├── StatusBar.tsx          # 底部状态栏
│   │   ├── SettingsModal.tsx      # 设置弹窗（API Key 等）
│   │   ├── CraftAnimation.tsx     # 合成动画组件
│   │   ├── ContextMenu.tsx        # 右键上下文菜单
│   │   ├── Encyclopedia.tsx       # 图鉴页面
│   │   ├── RecipeTable.tsx        # 配方表
│   │   └── CraftTree.tsx          # 合成树可视化
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useDragElement.ts      # 元素拖拽逻辑
│   │   ├── useCanvas.ts           # 画布缩放 & 平移
│   │   └── useCraft.ts            # 合成流程 Hook
│   ├── services/                  # 服务层
│   │   └── ai.ts                  # AI API 调用封装
│   ├── store/                     # Zustand 状态管理
│   │   ├── elementStore.ts        # 元素库状态
│   │   ├── recipeStore.ts         # 配方缓存状态
│   │   ├── workspaceStore.ts      # 工作台状态
│   │   └── settingsStore.ts       # 设置状态（API Key、模型等）
│   ├── types/                     # TypeScript 类型定义
│   │   └── index.ts               # Element, Recipe 等类型
│   ├── utils/                     # 工具函数
│   │   ├── constants.ts           # 常量（基础元素、类别池等）
│   │   └── helpers.ts             # 辅助函数（碰撞检测等）
│   ├── App.tsx                    # 根组件 & 布局
│   ├── main.tsx                   # 入口
│   └── index.css                  # 全局样式 / Tailwind 入口
├── docs/
│   ├── PRD.md                     # 需求文档
│   └── DEV_GUIDE.md               # 本文档
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── .gitignore
```

---

## Phase 0 — 项目初始化

**目标**：搭建项目骨架，所有依赖安装就绪，空白页面可运行。

### 任务清单

- [x] 使用 Vite 创建 React + TypeScript 项目
  ```bash
  pnpm create vite infinite-craft --template react-ts
  ```
- [x] 安装核心依赖
  ```bash
  pnpm add zustand framer-motion
  ```
- [x] 安装 Tailwind CSS
  ```bash
  pnpm add -D tailwindcss @tailwindcss/vite
  ```
- [x] 配置 Tailwind（`index.css` 中引入 `@import "tailwindcss"`）
- [x] 清理 Vite 模板默认代码（App.tsx、index.css）
- [x] 搭建基础目录结构（`components/`、`hooks/`、`services/`、`store/`、`types/`、`utils/`）
- [x] 确认 `pnpm dev` 可正常启动空白页面

### 验收标准

浏览器打开 `localhost:5173` 看到空白页面，控制台无报错，Tailwind 样式生效。

---

## Phase 1 — 数据层

**目标**：定义所有核心类型，创建 Zustand Store 并接入 localStorage 持久化，预置五行基础元素。

### 任务清单

- [x] **定义类型** `src/types/index.ts`
  ```typescript
  interface Element {
    id: string;
    name: string;
    emoji: string;
    categories: string[];
    isBase: boolean;
    discoveredAt: number;  // timestamp
  }

  interface Recipe {
    id: string;
    inputA: string;  // element name（排序后的较小值）
    inputB: string;  // element name（排序后的较大值）
    resultId: string | null;
    discoveredAt: number;
  }

  interface WorkspaceElement {
    instanceId: string;   // 工作台上每个实例的唯一 ID
    elementId: string;    // 引用的元素 ID
    x: number;
    y: number;
  }

  interface AIConfig {
    apiKey: string;
    baseUrl: string;      // OpenAI 兼容 API 地址
    model: string;        // 模型名称
  }
  ```

- [x] **常量定义** `src/utils/constants.ts`
  - 五行基础元素数据（id、name、emoji、categories）
  - 预设类别池数组
  - 默认 AI 配置模板

- [x] **元素库 Store** `src/store/elementStore.ts`
  - 状态：`elements: Map<string, Element>`（已发现元素）
  - 操作：`addElement()`、`getElement()`、`getAllElements()`、`searchElements(query)`
  - 初始化时预置五行基础元素
  - 启用 Zustand `persist` 中间件，存储到 localStorage

- [x] **配方 Store** `src/store/recipeStore.ts`
  - 状态：`recipes: Recipe[]`
  - 操作：`addRecipe()`、`findRecipe(nameA, nameB)`、`getRecipesForElement(elementId)`
  - 查找时将两个元素名排序后匹配（A+B = B+A）
  - 启用 persist 中间件

- [x] **工作台 Store** `src/store/workspaceStore.ts`
  - 状态：`items: WorkspaceElement[]`、`scale: number`、`panX/panY: number`
  - 操作：`addItem()`、`removeItem()`、`moveItem()`、`clearAll()`
  - 启用 persist 中间件

- [x] **设置 Store** `src/store/settingsStore.ts`
  - 状态：`aiConfig: AIConfig`、`craftCount: number`
  - 操作：`updateConfig()`、`incrementCraftCount()`
  - 启用 persist 中间件

### 关键技术要点

**配方缓存查找的归一化**：合成 A+B 和 B+A 应视为同一配方。存储配方时将两个输入元素名按字典序排序：

```typescript
function normalizeRecipeKey(a: string, b: string): string {
  return [a, b].sort().join('+');
}
```

**Zustand persist 用法**：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useElementStore = create(
  persist(
    (set, get) => ({
      elements: new Map<string, Element>(),
      // ...
    }),
    {
      name: 'infinite-craft-elements',
      // Map 需自定义序列化
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

> 注意：`Map` 类型无法直接 JSON 序列化，需要在 persist 配置中提供自定义的 `serialize` / `deserialize`，或改用普通对象 `Record<string, Element>` 代替。

### 验收标准

- 控制台可读取到 5 个基础元素
- 刷新页面后数据仍然存在（localStorage 持久化生效）
- 添加新元素后可正常检索

---

## Phase 2 — 元素卡片与侧边栏

**目标**：实现元素卡片组件和左侧元素库面板，支持搜索、分类筛选、已发现计数。

### 任务清单

- [x] **ElementCard 组件** `src/components/ElementCard.tsx`
  - 展示 Emoji + 名称
  - 样式：圆角卡片、hover 阴影、cursor grab
  - 支持 `isNew` 属性，显示"✨"标记
  - 支持 `size` 属性（侧边栏小尺寸 vs 工作台正常尺寸）
  - 组件结构：
    ```
    <div class="element-card">
      <span class="emoji">🔥</span>
      <span class="name">火</span>
    </div>
    ```

- [x] **Sidebar 组件** `src/components/Sidebar.tsx`
  - 顶部：搜索输入框
  - 中部：元素列表（网格或列表布局）
  - 底部：已发现元素计数
  - 支持按类别分组显示（可折叠的分类手风琴）
  - 支持按发现时间 / 名称排序切换
  - 面板可折叠（收起/展开按钮）

- [x] **搜索与筛选逻辑**
  - 按名称模糊搜索
  - 按类别标签筛选（点击类别标签切换过滤）
  - 筛选结果实时更新

### 涉及文件

```
src/components/ElementCard.tsx   — 新建
src/components/Sidebar.tsx       — 新建
src/store/elementStore.ts        — 可能新增搜索相关 selector
```

### 验收标准

- 左侧面板展示 5 个基础元素
- 搜索"火"可过滤出对应元素
- 元素卡片样式美观，hover 有交互反馈

---

## Phase 3 — 工作台画布

**目标**：实现主区域的无限画布，支持缩放、平移，元素可自由放置。

### 任务清单

- [x] **Workspace 组件** `src/components/Workspace.tsx`
  - 占据主区域，背景使用点阵/网格图案（便于感知缩放平移）
  - 渲染 workspaceStore 中的所有 `WorkspaceElement`
  - 每个工作台元素使用 `absolute` 定位，通过 `transform: translate(x, y)` 放置

- [x] **画布缩放与平移** `src/hooks/useCanvas.ts`
  - 鼠标滚轮 → 缩放（以鼠标位置为中心）
  - 中键拖拽 / 空格+左键拖拽 → 平移
  - 缩放范围限制（0.25x ~ 2x）
  - 将 scale / panX / panY 同步到 workspaceStore

- [x] **元素自由拖拽**（集成在 Workspace.tsx 中，基于 Pointer Events）
  - 基于 Pointer Events（`pointerdown` / `pointermove` / `pointerup`）
  - 拖拽时更新元素的 x, y 坐标
  - 需将屏幕坐标转换为画布坐标（考虑 scale + pan 偏移）
  - 拖拽过程中元素 z-index 提升到最顶层

- [x] **工作台元素删除**
  - 右键点击 → 显示上下文菜单（ContextMenu 组件）→ 删除
  - `Delete` / `Backspace` 键删除选中元素
  - 双击空白区域 → 弹出确认后清空全部

- [x] **ContextMenu 组件** `src/components/ContextMenu.tsx`
  - 位置跟随鼠标
  - 菜单项：删除、查看详情
  - 点击外部自动关闭

### 关键技术要点

**屏幕坐标 → 画布坐标转换**：

```typescript
function screenToCanvas(screenX: number, screenY: number, pan: {x, y}, scale: number) {
  return {
    x: (screenX - pan.x) / scale,
    y: (screenY - pan.y) / scale,
  };
}
```

**网格背景 CSS**（点阵效果）：

```css
.workspace {
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### 涉及文件

```
src/components/Workspace.tsx     — 新建
src/components/ContextMenu.tsx   — 新建
src/hooks/useCanvas.ts           — 新建
src/hooks/useDragElement.ts      — 新建
src/store/workspaceStore.ts      — 已有，可能微调
src/utils/helpers.ts             — 新增坐标转换等工具函数
```

### 验收标准

- 画布可缩放、平移，背景网格跟随变化
- 元素可在画布上自由拖动
- 右键菜单可正常弹出并执行删除
- 快捷键可删除元素

---

## Phase 4 — 拖拽合成系统

**目标**：实现从侧边栏拖出元素到工作台（复制），以及工作台内两个元素重叠触发合成。

### 任务清单

- [x] **从侧边栏拖出元素到工作台**
  - 侧边栏元素的 `pointerdown` 开始拖拽
  - 拖拽过程中创建一个跟随鼠标的"幽灵卡片"（DragOverlay）
  - `pointerup` 在工作台区域内时，将元素副本添加到 workspaceStore
  - 拖到工作台外释放则取消

- [x] **碰撞检测 / 重叠检测** `src/utils/helpers.ts`
  - 拖拽元素释放时，检测是否与工作台上已有元素重叠
  - 重叠判定：两个元素卡片的包围盒（bounding box）交集面积超过阈值
  - 重叠时高亮目标元素（发光边框），提示可以合成
  ```typescript
  function checkOverlap(rectA: DOMRect, rectB: DOMRect): boolean {
    const overlapX = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
    const overlapY = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
    const overlapArea = overlapX * overlapY;
    const minArea = Math.min(rectA.width * rectA.height, rectB.width * rectB.height);
    return overlapArea > minArea * 0.3;
  }
  ```

- [x] **合成触发流程** `src/hooks/useCraft.ts`
  - 检测到重叠 → 调用合成逻辑（Phase 5/6 实现，此处预留接口）
  - 合成中：两个输入元素标记为"合成中"状态
  - 合成完成后：移除两个输入元素，在中点位置放置结果元素
  - 合成失败：两个元素回到原位

- [x] **拖拽视觉反馈**
  - 拖拽中：卡片半透明 + 轻微缩放
  - 接近可合成目标时：目标卡片发光边框
  - 释放合成时：卡片吸附到目标位置

### 涉及文件

```
src/components/Sidebar.tsx       — 添加拖出逻辑
src/components/Workspace.tsx     — 添加放入与碰撞检测
src/hooks/useDragElement.ts      — 扩展拖拽逻辑
src/hooks/useCraft.ts            — 新建（合成流程编排）
src/utils/helpers.ts             — 新增碰撞检测函数
```

### 验收标准

- 从侧边栏拖出元素到工作台，原侧边栏元素不消失（复制行为）
- 将两个元素拖到一起，能触发合成流程（此阶段可先用 mock 数据）
- 拖拽视觉反馈流畅自然

---

## Phase 5 — AI 合成服务

**目标**：封装 AI API 调用，实现 Prompt 构造、响应解析、重试机制和 API Key 配置界面。

### 任务清单

- [x] **AI 服务封装** `src/services/ai.ts`
  ```typescript
  interface CraftResult {
    name: string;
    emoji: string;
    categories: string[];
    reason: string;
  }

  async function craftElements(
    elementA: string,
    elementB: string,
    config: AIConfig
  ): Promise<CraftResult | null> {
    // 1. 构造 Prompt
    // 2. 调用 OpenAI 兼容 API
    // 3. 解析 JSON 响应
    // 4. 校验字段完整性
    // 5. 返回结果或 null
  }
  ```

- [x] **Prompt 构造**
  - 使用 PRD 3.1 节定义的系统提示词
  - 将已有类别池注入 Prompt，引导 AI 优先复用
  - 使用 `response_format: { type: "json_object" }` 确保 JSON 输出（如模型支持）

- [x] **API 调用实现**
  - 使用 `fetch` 调用 `POST {baseUrl}/v1/chat/completions`
  - 请求头：`Authorization: Bearer {apiKey}`、`Content-Type: application/json`
  - 请求体：标准 OpenAI Chat Completions 格式
  - 超时处理：`AbortController` + 10 秒超时
  - 重试机制：失败后最多重试 3 次，间隔递增（1s, 2s, 4s）

- [x] **响应解析与校验**
  - 从 `choices[0].message.content` 提取 JSON
  - 正则兜底：如果返回文本包裹在 markdown 代码块中，提取其中的 JSON
  - 校验 `name`（非空字符串）、`emoji`（单个 emoji）、`categories`（非空数组）
  - 校验失败时重试

- [ ] **设置界面** `src/components/SettingsModal.tsx` *(Phase 9 打磨阶段实现)*
  - 表单字段：API Base URL、API Key（密码输入框）、模型名称
  - 预设几组常见配置（下拉选择）：
    - DeepSeek: `https://api.deepseek.com` / `deepseek-chat`
    - 通义千问: `https://dashscope.aliyuncs.com/compatible-mode` / `qwen-plus`
    - OpenAI: `https://api.openai.com` / `gpt-4o-mini`
    - 自定义
  - "测试连接" 按钮：发送一个简单请求验证配置是否有效
  - 保存到 settingsStore（persist 到 localStorage）

- [x] **设置 Store** `src/store/settingsStore.ts`
  - 完善 AIConfig 的默认值和更新逻辑

### 关键技术要点

**API Key 安全提示**：纯前端方案中 API Key 存储在 localStorage 并在浏览器中发送请求，存在泄露风险。应在设置页面中加入安全提示文案，告知用户仅在个人设备使用。

**请求示例**：

```typescript
const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  },
  body: JSON.stringify({
    model: config.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `元素A: ${elementA}\n元素B: ${elementB}` },
    ],
    temperature: 0.7,
    max_tokens: 200,
  }),
  signal: AbortSignal.timeout(10000),
});
```

### 涉及文件

```
src/services/ai.ts               — 新建
src/components/SettingsModal.tsx  — 新建
src/store/settingsStore.ts       — 完善
src/utils/constants.ts           — 新增 SYSTEM_PROMPT、预设配置
```

### 验收标准

- 配置 API Key 后，手动调用 `craftElements("水", "火")` 能返回合成结果
- 错误时能自动重试，超时能正确中断
- 设置页面可保存和读取配置，"测试连接"可验证配置有效性

---

## Phase 6 — 合成逻辑与动画

**目标**：串联合成完整流程——配方缓存查询 → AI 请求 → 结果入库 → 动画效果。

### 任务清单

- [ ] **完善合成流程** `src/hooks/useCraft.ts`
  ```
  合成流程：
  1. 归一化输入（排序元素名）
  2. 查询 recipeStore 是否有缓存
     → 命中：直接返回缓存结果
     → 未命中：调用 AI 服务
  3. AI 返回结果后：
     a. 如果 name 非 null → 创建/查找 Element → 存入 elementStore
     b. 存储 Recipe 到 recipeStore
  4. 更新工作台：移除两个输入元素，在中点放置结果元素
  5. 触发对应动画
  6. 递增合成次数
  ```

- [ ] **合成动画组件** `src/components/CraftAnimation.tsx`
  - **合成中动画**（Framer Motion）：
    - 两个元素向中心点移动（`animate` 位移）
    - 到达中心时旋转 + 缩小 + 发光（`boxShadow` 动画）
    - 使用 `AnimatePresence` 管理元素的进出
  - **新发现动画**：
    - 结果元素从中心弹出（`scale: 0 → 1.2 → 1`）
    - "首次发现!" 文字横幅淡入淡出
    - 可选：简单的粒子效果（用多个小圆点向四周散开）
  - **已知元素**：
    - 结果元素简单淡入（`opacity: 0 → 1`）
  - **合成失败**：
    - 两个元素抖动（`x` 轴快速来回移动）
    - 弹回原位
    - 显示 Toast 提示"这两种元素无法合成"

- [ ] **加载状态**
  - 合成请求期间在中心位置显示旋转加载图标
  - 禁止对"合成中"的元素再次拖拽

- [ ] **新元素入库通知**
  - 新元素添加到侧边栏时，侧边栏内该元素短暂高亮
  - 或显示 Toast："发现新元素: ♨️ 蒸汽"

### 涉及文件

```
src/hooks/useCraft.ts            — 完善合成流程
src/components/CraftAnimation.tsx — 新建
src/components/Workspace.tsx     — 集成动画
src/store/elementStore.ts        — 添加"新发现"标记逻辑
src/store/recipeStore.ts         — 集成缓存查询
```

### 验收标准

- 拖拽两个元素重叠 → 播放合成动画 → 显示结果元素
- 首次发现有明显的"新发现"动画效果
- 已缓存的配方不再请求 AI，响应瞬间完成
- 合成中有 loading 状态，不可重复操作

---

## Phase 7 — 图鉴与配方表

**目标**：实现元素图鉴列表和配方表页面，支持搜索和反向查询。

### 任务清单

- [ ] **页面路由 / 弹窗切换**
  - 方案 A（推荐）：使用 Modal/Drawer 覆盖层，无需路由库
  - 顶部 Toolbar 按钮："图鉴"、"合成树" 打开对应弹窗
  - `Escape` 关闭弹窗

- [ ] **Encyclopedia 图鉴组件** `src/components/Encyclopedia.tsx`
  - 表格展示所有已发现元素
  - 列：Emoji + 名称 | 类别标签 | 发现时间 | 发现配方
  - 顶部搜索框：按名称过滤
  - 类别标签可点击筛选
  - 按发现时间倒序排列（最新的在前）
  - 显示总数统计

- [ ] **RecipeTable 配方表组件** `src/components/RecipeTable.tsx`
  - 表格展示所有已知配方
  - 列：元素A + 元素B → 结果 | 发现时间
  - 搜索：输入元素名称，展示包含该元素的所有配方
  - 反向查询：点击某元素，查看其所有合成来源（哪些配方产出它）和去向（它参与了哪些配方）
  - 空状态提示

- [ ] **Toolbar 组件** `src/components/Toolbar.tsx`
  - 应用标题/Logo
  - 功能按钮：图鉴、合成树、设置
  - 按钮 hover 提示

### 涉及文件

```
src/components/Encyclopedia.tsx  — 新建
src/components/RecipeTable.tsx   — 新建
src/components/Toolbar.tsx       — 新建
src/App.tsx                      — 集成弹窗状态管理
```

### 验收标准

- 点击"图鉴"按钮弹出图鉴列表，展示所有已发现元素
- 搜索和类别筛选功能正常
- 配方表可查看所有配方，支持正向/反向查询
- 弹窗可正常打开关闭，不影响主界面

---

## Phase 8 — 合成树可视化

**目标**：以节点连线图展示元素之间的合成关系，从基础元素到高阶元素的完整路径。

### 任务清单

- [ ] **技术选型决策**
  - 方案 A：使用 `reactflow`（@xyflow/react）— 功能完善，自带缩放平移、节点拖拽
  - 方案 B：纯 SVG/Canvas 手动绘制 — 更轻量但开发量大
  - **推荐方案 A**，安装：
    ```bash
    pnpm add @xyflow/react
    ```

- [ ] **CraftTree 组件** `src/components/CraftTree.tsx`
  - 将 Recipe 数据转换为 reactflow 的 nodes 和 edges：
    - 每个 Element 是一个节点（展示 Emoji + 名称）
    - 每个 Recipe 表示两条边（A→结果, B→结果），可通过中间"+"节点连接
  - 布局算法：从基础元素（顶层）向下展开，自动布局
    - 可使用 `dagre` 或 `elkjs` 库进行自动布局
  - 节点样式：复用 ElementCard 的设计
  - 交互：
    - 点击节点 → 高亮该元素的所有相关连线
    - 缩放平移浏览完整合成树
    - 鼠标悬停节点 → 显示元素详情 Tooltip

- [ ] **搜索定位**
  - 输入元素名称 → 画布自动平移+缩放到该节点位置
  - 高亮搜索到的节点

- [ ] **数据转换工具** `src/utils/helpers.ts`
  ```typescript
  function buildTreeData(elements: Element[], recipes: Recipe[]): { nodes, edges } {
    // 将元素和配方数据转换为 reactflow 格式
  }
  ```

### 涉及文件

```
src/components/CraftTree.tsx     — 新建
src/utils/helpers.ts             — 新增 buildTreeData
```

### 验收标准

- 合成树正确展示所有元素和配方的关系
- 基础元素在顶部，合成产物向下展开
- 可缩放平移浏览，搜索可定位到指定节点
- 节点样式美观，与主界面风格一致

---

## Phase 9 — 打磨与部署

**目标**：完善交互细节、错误处理、性能优化，准备部署。

### 任务清单

#### 交互完善

- [ ] **快捷键系统**
  - `Delete` / `Backspace`：删除选中元素
  - `Ctrl+Z`：撤销上一步操作（需在 workspaceStore 中维护操作历史栈）
  - 鼠标滚轮：缩放画布
  - 中键拖拽 / 空格+左键拖拽：平移画布

- [ ] **StatusBar 状态栏** `src/components/StatusBar.tsx`
  - 显示：已发现 N 种元素 | 合成次数: M
  - 实时更新

- [ ] **响应式布局**
  - 桌面端：左侧侧边栏 + 右侧工作台
  - 小屏幕：侧边栏切换为底部抽屉
  - 极端小屏提示"请在桌面端使用以获得最佳体验"

#### 错误处理

- [ ] **API 相关**
  - 未配置 API Key 时引导用户先去设置
  - 网络错误 / API 错误 → 友好的 Toast 提示
  - 请求频率限制（防止短时间内大量合成请求）

- [ ] **数据相关**
  - localStorage 容量接近限制时警告
  - 提供"导出数据"功能（JSON 导出所有元素和配方）
  - 提供"导入数据"功能
  - 提供"重置数据"功能（清空所有发现，恢复初始五行元素）

#### 性能优化

- [ ] **工作台渲染优化**
  - 对不在视口内的元素不渲染（虚拟化）
  - 使用 `React.memo` 避免不必要的 ElementCard 重渲染
  - 拖拽时使用 `transform` 而非修改 `left/top`（避免重排）

- [ ] **AI 请求优化**
  - 请求去重：同一配方的并发请求只发一次
  - 请求队列：限制最大并发 AI 请求数

#### 视觉打磨

- [ ] **整体主题**
  - 确定配色方案（深色/浅色主题）
  - 统一字体、间距、圆角等设计变量
  - favicon 和页面标题

- [ ] **空状态设计**
  - 工作台空白时的引导提示："从左侧拖入元素开始合成吧！"
  - 图鉴为空时的提示
  - 合成树为空时的提示

#### 部署

- [ ] **构建与部署**
  - `pnpm build` 生成静态文件
  - 部署目标：Vercel / Netlify / GitHub Pages / Cloudflare Pages
  - 配置构建命令和输出目录
  - 确保 SPA 路由（如使用了路由的话）正确处理 404

- [ ] **README.md**
  - 项目介绍
  - 在线体验链接
  - 本地开发指南
  - 技术栈说明
  - 截图/GIF 演示

### 涉及文件

```
src/components/StatusBar.tsx     — 新建
src/App.tsx                      — 整体布局调整
src/index.css                    — 主题变量、全局样式
README.md                        — 新建
vite.config.ts                   — 部署相关配置
```

### 验收标准

- 所有交互流程顺畅无阻
- 错误场景有友好提示
- 首屏加载 < 2 秒
- 可成功部署到静态托管平台

---

## 开发顺序总览

```
Phase 0  项目初始化               ██░░░░░░░░░░░░░░  预计 0.5 天
Phase 1  数据层                   ████░░░░░░░░░░░░  预计 1 天
Phase 2  元素卡片与侧边栏         ██████░░░░░░░░░░  预计 1 天
Phase 3  工作台画布               ████████░░░░░░░░  预计 1.5 天
Phase 4  拖拽合成系统             ██████████░░░░░░  预计 1.5 天
Phase 5  AI 合成服务              ████████████░░░░  预计 1 天
Phase 6  合成逻辑与动画           ██████████████░░  预计 1.5 天
Phase 7  图鉴与配方表             ███████████████░  预计 1 天
Phase 8  合成树可视化             ████████████████  预计 1.5 天
Phase 9  打磨与部署               ████████████████  预计 2 天

总计预估：约 12-13 天（单人全职开发）
```

### 里程碑检查点

| 里程碑 | 完成阶段      | 可交付物                                      |
| ------ | ------------- | --------------------------------------------- |
| M1     | Phase 0-2     | 可看到元素卡片和侧边栏的静态页面              |
| M2     | Phase 3-4     | 可从侧边栏拖入元素到工作台并拖拽移动          |
| M3     | Phase 5-6     | **核心可玩**：可实际合成元素并看到结果         |
| M4     | Phase 7-8     | 完整功能：图鉴、配方表、合成树全部可用        |
| M5     | Phase 9       | 上线就绪：打磨完毕，可部署                    |

> M3 是最关键的里程碑——达到 M3 后产品即进入可玩状态。建议开发时优先冲刺到 M3。

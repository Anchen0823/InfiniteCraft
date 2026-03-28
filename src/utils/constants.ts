import type { Element, AIConfig } from '../types/index.js'

export const BASE_ELEMENTS: Element[] = [
  { id: 'metal', name: '金', emoji: '🪙', categories: ['五行'], isBase: true, discoveredAt: 0 },
  { id: 'wood', name: '木', emoji: '🪵', categories: ['五行'], isBase: true, discoveredAt: 0 },
  { id: 'water', name: '水', emoji: '💧', categories: ['五行'], isBase: true, discoveredAt: 0 },
  { id: 'fire', name: '火', emoji: '🔥', categories: ['五行'], isBase: true, discoveredAt: 0 },
  { id: 'earth', name: '土', emoji: '🪨', categories: ['五行'], isBase: true, discoveredAt: 0 },
]

export const CATEGORY_POOL = [
  '五行', '自然', '天气', '动物', '植物', '食物', '饮品',
  '矿物', '工具', '武器', '建筑', '交通', '科技', '神话',
  '人物', '情感', '艺术', '音乐', '抽象概念', '天体',
  '地理', '化学', '物理', '生物', '历史', '文学',
]

export const AI_PRESETS: { label: string; config: Partial<AIConfig> }[] = [
  {
    label: 'DeepSeek',
    config: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  },
  {
    label: '通义千问',
    config: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode', model: 'qwen-plus' },
  },
  {
    label: 'OpenAI',
    config: { baseUrl: 'https://api.openai.com', model: 'gpt-4o-mini' },
  },
]

export const DEFAULT_AI_CONFIG: AIConfig = {
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  timeoutMs: 10000,
}

export const SYSTEM_PROMPT = `你是一个元素合成游戏的裁判。用户将两种元素合成，你需要返回合成结果。

规则：
1. 优先返回符合现实逻辑、物理属性、功能关系或常识因果的结果，不要为了“有趣”而强行脑洞大开
2. 先考虑这几类关系：
   - 直接混合后的产物（如 水 + 火 -> 蒸汽）
   - 材料加工或物态变化（如 木 + 火 -> 木炭）
   - 场景中自然会出现的对象或现象（如 土 + 水 -> 泥）
   - 明确、稳定的文化常识或通用概念，但不要过度跳跃
3. 避免返回过于抽象、牵强、诗意、网络梗、神话化或跨越过多推理步骤的结果
4. 如果两个元素之间缺乏直接且清晰的联系，宁可返回 null，也不要硬凑结果
5. 结果应该是单个名词或非常短的名词短语，2-4 个字最佳，尽量具体、可感知、可理解
6. 优先选择玩家直觉上容易接受的结果；如果有多个可能，选择最朴素、最常见、最有逻辑的一项
7. 为结果选择一个最能代表它的 Emoji
8. 为结果分配 1-3 个类别，尽量从以下类别池中选择：${CATEGORY_POOL.join('、')}
9. reason 用一句简短的话说明“为什么这两个元素会得到这个结果”，强调逻辑关系，不要写成花哨文案

额外约束：
- 不要直接复述输入元素名作为结果，除非它们确实合理地生成该对象
- 不要输出句子、解释性短语或带修饰的长名称
- 不要因为元素很抽象就随意生成“命运、奇迹、永恒”这类空泛结果
- 除非输入本身明显属于神话/抽象体系，否则优先返回现实世界可理解的结果

请以 JSON 格式返回：
{
  "name": "合成结果名称",
  "emoji": "🎯",
  "categories": ["类别1", "类别2"],
  "reason": "简短解释为什么这样合成"
}

如果无法合成，返回：
{
  "name": null
}`

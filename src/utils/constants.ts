import type { Element, AIConfig } from '../types'

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
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
}

export const SYSTEM_PROMPT = `你是一个元素合成游戏的裁判。用户将两种元素合成，你需要返回合成结果。

规则：
1. 合成结果应该是两种元素的合理组合，有创意但不过于荒谬
2. 结果应该是一个名词或名词短语（2-4个字为佳）
3. 为结果选择一个最能代表它的 Emoji
4. 为结果分配 1-3 个类别，尽量从以下类别池中选择：${CATEGORY_POOL.join('、')}
5. 如果两种元素确实无法产生合理的合成结果，返回 null

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

export type GameId = 'memory' | 'schulte' | 'stroop' | 'wordSort' | 'pathMemory' | 'reaction' | 'digitSpan' | 'arithmetic' | 'patternReason'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type Page = 'menu' | 'game' | 'result' | 'history'

export interface Scores {
  memory: number | null
  schulte: number | null
  stroop: number | null
  wordSort: number | null
  pathMemory: number | null
  reaction: number | null
  digitSpan: number | null
  arithmetic: number | null
  patternReason: number | null
}

export interface GameConfig {
  id: GameId
  name: string
  icon: string
  color: string
  domain: string
  description: string
  howToPlay: string
}

export const GAMES: GameConfig[] = [
  {
    id: 'memory',
    name: '记忆翻翻乐',
    icon: '🧠',
    color: '#9B59B6',
    domain: '记忆力',
    description: '翻牌配对，训练短时记忆',
    howToPlay: '点击卡片翻开，找到两张相同的卡片即可配对。用最少的步数完成所有配对。',
  },
  {
    id: 'schulte',
    name: '舒尔特方格',
    icon: '🎯',
    color: '#3498DB',
    domain: '注意力',
    description: '按顺序点击数字，训练视觉搜索',
    howToPlay: '在方格中按从小到大的顺序依次点击数字，用时越短得分越高。',
  },
  {
    id: 'stroop',
    name: '颜色词挑战',
    icon: '🎨',
    color: '#E74C3C',
    domain: '执行功能',
    description: '判断文字墨色，训练抑制控制',
    howToPlay: '屏幕会显示一个颜色词（如"红色"），但字的颜色和词义不同。请选择文字实际显示的颜色，而非文字含义。',
  },
  {
    id: 'wordSort',
    name: '词语分类',
    icon: '📝',
    color: '#2ECC71',
    domain: '语言能力',
    description: '将词语归入正确分类',
    howToPlay: '屏幕出现一个词语和多个分类选项，点击词语所属的正确分类即可得分。',
  },
  {
    id: 'pathMemory',
    name: '路径记忆',
    icon: '🗺️',
    color: '#F39C12',
    domain: '视空间',
    description: '记忆并复现亮起路径',
    howToPlay: '观察格子依次亮起的顺序，然后按相同顺序点击格子复现路径。每轮成功后路径会更长。',
  },
  {
    id: 'reaction',
    name: '闪电反应',
    icon: '⚡',
    color: '#E67E22',
    domain: '处理速度',
    description: '信号出现立即点击，测试反应速度',
    howToPlay: '等待圆圈变绿后立即点击。注意不要在变绿之前误触，否则本轮不计分。',
  },
  {
    id: 'digitSpan',
    name: '数字倒背',
    icon: '🔢',
    color: '#1ABC9C',
    domain: '工作记忆',
    description: '记住数字序列并倒序输入',
    howToPlay: '屏幕依次显示一串数字，记住后倒序输入（如看到 1-2-3，输入 3-2-1）。连续两次错误则结束。',
  },
  {
    id: 'arithmetic',
    name: '心算挑战',
    icon: '🧮',
    color: '#8E44AD',
    domain: '计算能力',
    description: '限时心算，锻炼数字加工能力',
    howToPlay: '在限定时间内完成尽可能多的算术题，从四个选项中选出正确答案。连续答对有额外加分。',
  },
  {
    id: 'patternReason',
    name: '图形推理',
    icon: '🔷',
    color: '#2C3E50',
    domain: '推理判断',
    description: '找出图形序列的规律',
    howToPlay: '观察图形序列的变化规律，从选项中选出最合适的下一个图形。快速作答有额外加分。',
  },
]

export const MAX_SCORES: Record<GameId, Record<Difficulty, number>> = {
  memory:        { easy: 300,  normal: 600,  hard: 920 },
  schulte:       { easy: 800,  normal: 800,  hard: 800 },
  stroop:        { easy: 600,  normal: 800,  hard: 800 },
  wordSort:      { easy: 400,  normal: 600,  hard: 800 },
  pathMemory:    { easy: 1050, normal: 2250, hard: 2450 },
  reaction:      { easy: 800,  normal: 800,  hard: 800 },
  digitSpan:     { easy: 600,  normal: 1200, hard: 2000 },
  arithmetic:    { easy: 500,  normal: 800,  hard: 1000 },
  patternReason: { easy: 500,  normal: 800,  hard: 1000 },
}

import { GameId, Difficulty, MAX_SCORES } from '../types'

export function normalizeScore(gameId: GameId, difficulty: Difficulty, rawScore: number): number {
  const max = MAX_SCORES[gameId][difficulty]
  return Math.min(100, Math.round((rawScore / max) * 100))
}

export function getRating(avg: number): { label: string; emoji: string; message: string } {
  if (avg >= 90) return {
    label: '认知达人',
    emoji: '🌟',
    message: '您的认知功能表现优异！继续保持健康的生活方式，让大脑持续活跃。',
  }
  if (avg >= 70) return {
    label: '脑力健将',
    emoji: '💪',
    message: '表现很好！各项认知功能均衡发展，建议继续进行多元化的脑力训练。',
  }
  if (avg >= 50) return {
    label: '成长空间',
    emoji: '🌱',
    message: '还有进步空间！可以针对薄弱项进行专项训练，同时注意充足睡眠和规律运动。',
  }
  return {
    label: '初次体验',
    emoji: '🤗',
    message: '欢迎来到认知训练的世界！不要气馁，持续练习会看到进步。如有困惑，建议咨询专业人士。',
  }
}

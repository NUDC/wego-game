import { GameId, Difficulty, Scores } from '../types'

const BEST_SCORES_KEY = 'cogpark_best_scores'
const RECORDS_KEY = 'cogpark_records'

export interface TrainingRecord {
  gameId: GameId
  difficulty: Difficulty
  score: number
  timestamp: number
}

// ===== 最高分 =====

export function loadBestScores(): Scores {
  const defaults: Scores = { memory: null, schulte: null, stroop: null, wordSort: null, pathMemory: null, reaction: null, digitSpan: null, arithmetic: null, patternReason: null }
  try {
    const data = localStorage.getItem(BEST_SCORES_KEY)
    if (data) return { ...defaults, ...JSON.parse(data) }
  } catch { /* ignore */ }
  return defaults
}

export function saveBestScore(gameId: GameId, score: number) {
  const best = loadBestScores()
  if (best[gameId] == null || score > best[gameId]!) {
    best[gameId] = score
    localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(best))
  }
}

// ===== 训练记录 =====

export function loadRecords(): TrainingRecord[] {
  try {
    const data = localStorage.getItem(RECORDS_KEY)
    if (data) return JSON.parse(data)
  } catch { /* ignore */ }
  return []
}

export function saveRecord(gameId: GameId, difficulty: Difficulty, score: number) {
  const records = loadRecords()
  records.push({
    gameId,
    difficulty,
    score,
    timestamp: Date.now(),
  })
  // 最多保留最近 200 条
  if (records.length > 200) {
    records.splice(0, records.length - 200)
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

export function getGameRecords(gameId: GameId): TrainingRecord[] {
  return loadRecords().filter(r => r.gameId === gameId)
}

export function getTodayCount(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfDay = today.getTime()
  return loadRecords().filter(r => r.timestamp >= startOfDay).length
}

export function clearRecords() {
  localStorage.removeItem(RECORDS_KEY)
  localStorage.removeItem(BEST_SCORES_KEY)
}

import RadarChart from './RadarChart'
import { normalizeScore, getRating } from '../utils/scoring'
import { GAMES, Scores } from '../types'

interface ResultPageProps {
  scores: Scores
  onBack: () => void
}

export default function ResultPage({ scores, onBack }: ResultPageProps) {
  const normalizedScores = {
    memory: scores.memory !== null ? normalizeScore('memory', 'normal', scores.memory) : 0,
    schulte: scores.schulte !== null ? normalizeScore('schulte', 'normal', scores.schulte) : 0,
    stroop: scores.stroop !== null ? normalizeScore('stroop', 'normal', scores.stroop) : 0,
    wordSort: scores.wordSort !== null ? normalizeScore('wordSort', 'normal', scores.wordSort) : 0,
    pathMemory: scores.pathMemory !== null ? normalizeScore('pathMemory', 'normal', scores.pathMemory) : 0,
    reaction: scores.reaction !== null ? normalizeScore('reaction', 'normal', scores.reaction) : 0,
    digitSpan: scores.digitSpan !== null ? normalizeScore('digitSpan', 'normal', scores.digitSpan) : 0,
    arithmetic: scores.arithmetic !== null ? normalizeScore('arithmetic', 'normal', scores.arithmetic) : 0,
    patternReason: scores.patternReason !== null ? normalizeScore('patternReason', 'normal', scores.patternReason) : 0,
  }

  const playedGames = GAMES.filter((game) => scores[game.id] !== null)
  const average =
    playedGames.length > 0
      ? Math.round(
          playedGames.reduce((sum, game) => {
            return sum + normalizeScore(game.id, 'normal', scores[game.id]!)
          }, 0) / playedGames.length
        )
      : 0

  const rating = getRating(average)

  return (
    <div className="app-container">
      {/* 可截图分享的卡片区域 */}
      <div className="result-card">
        <div className="result-card-header">
          <span className="result-card-logo">🧠</span>
          <div>
            <div className="result-card-title">认知乐园</div>
            <div className="result-card-sub">九维认知能力画像</div>
          </div>
        </div>

        <div className="radar-wrapper">
          <RadarChart scores={normalizedScores} />
        </div>

        <div className="result-rating">
          {rating.emoji} {rating.label}
        </div>
        <div className="result-avg">综合评分 {average} 分</div>

        <div className="result-message">{rating.message}</div>

      </div>

      <button className="btn btn-primary btn-block" onClick={onBack}>
        返回主菜单
      </button>
    </div>
  )
}

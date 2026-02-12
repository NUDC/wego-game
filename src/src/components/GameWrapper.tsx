import { useState, useCallback, useMemo } from 'react'
import MemoryMatch from '../games/MemoryMatch'
import SchulteGrid from '../games/SchulteGrid'
import StroopTest from '../games/StroopTest'
import WordSort from '../games/WordSort'
import PathMemory from '../games/PathMemory'
import ReactionTest from '../games/ReactionTest'
import DigitSpan from '../games/DigitSpan'
import ArithmeticChallenge from '../games/ArithmeticChallenge'
import PatternReason from '../games/PatternReason'
import { knowledgeCards } from '../data/knowledge'
import { loadBestScores } from '../utils/storage'
import { GameId, Difficulty, GAMES } from '../types'

interface GameWrapperProps {
  gameId: GameId
  difficulty: Difficulty
  onFinish: (score: number) => void
  onBack: () => void
}

type Phase = 'playing' | 'finished'

export default function GameWrapper({ gameId, difficulty, onFinish, onBack }: GameWrapperProps) {
  const [phase, setPhase] = useState<Phase>('playing')
  const [score, setScore] = useState(0)

  const gameConfig = GAMES.find((g) => g.id === gameId)!
  const cards = knowledgeCards[gameId]

  const randomCard = useMemo(
    () => cards[Math.floor(Math.random() * cards.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameId, score]
  )

  const [bestScore, setBestScore] = useState<number | null>(null)

  const handleComplete = useCallback((finalScore: number) => {
    const best = loadBestScores()[gameId]
    setBestScore(best)
    setScore(finalScore)
    setPhase('finished')
  }, [gameId])

  const handleRetry = useCallback(() => {
    setPhase('playing')
  }, [])

  const renderGame = () => {
    const gameProps = { difficulty, onComplete: handleComplete }

    switch (gameId) {
      case 'memory':
        return <MemoryMatch {...gameProps} />
      case 'schulte':
        return <SchulteGrid {...gameProps} />
      case 'stroop':
        return <StroopTest {...gameProps} />
      case 'wordSort':
        return <WordSort {...gameProps} />
      case 'pathMemory':
        return <PathMemory {...gameProps} />
      case 'reaction':
        return <ReactionTest {...gameProps} />
      case 'digitSpan':
        return <DigitSpan {...gameProps} />
      case 'arithmetic':
        return <ArithmeticChallenge {...gameProps} />
      case 'patternReason':
        return <PatternReason {...gameProps} />
    }
  }

  return (
    <div className="app-container">
      <div className="game-header">
        <div className="game-header-left">
          <button className="game-back-btn" onClick={onBack}>
            ←
          </button>
          <span className="game-title">{gameConfig.name}</span>
        </div>
      </div>

      {phase === 'playing' && renderGame()}

      {phase === 'finished' && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <div className="game-over-score">{score}</div>
            <div className="game-over-label">得分</div>

            {(bestScore === null || score > bestScore) ? (
              <div className="game-over-record">新纪录!</div>
            ) : (
              <div className="game-over-best">最高纪录: {bestScore}分</div>
            )}

            <div className="knowledge-card">
              <div className="knowledge-card-title">{randomCard.title}</div>
              <div className="knowledge-card-content">{randomCard.content}</div>
            </div>

            <div className="game-over-buttons">
              <button className="btn btn-outline" onClick={() => onFinish(score)}>
                返回菜单
              </button>
              <button className="btn btn-accent" onClick={handleRetry}>
                再来一次
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

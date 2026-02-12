import { useState, useEffect, useCallback, useRef } from 'react'

interface Props {
  difficulty: 'easy' | 'normal' | 'hard'
  onComplete: (score: number) => void
}

interface Card {
  id: number
  icon: string
  flipped: boolean
  matched: boolean
}

const CARD_ICONS = ['🧠', '🏃', '📖', '🥦', '💤', '🧩', '🎵', '🤝', '🧘', '❤️', '💊', '🏥']

const DIFFICULTY_SETTINGS = {
  easy:   { pairs: 3, cols: 3, rows: 2, timeLimit: 0 },
  normal: { pairs: 6, cols: 4, rows: 3, timeLimit: 0 },
  hard:   { pairs: 8, cols: 4, rows: 4, timeLimit: 60 },
} as const

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function createCards(pairs: number): Card[] {
  const icons = shuffle(CARD_ICONS).slice(0, pairs)
  const doubled = [...icons, ...icons]
  const shuffled = shuffle(doubled)
  return shuffled.map((icon, index) => ({
    id: index,
    icon,
    flipped: false,
    matched: false,
  }))
}

export default function MemoryMatch({ difficulty, onComplete }: Props) {
  const settings = DIFFICULTY_SETTINGS[difficulty]

  const [cards, setCards] = useState<Card[]>(() => createCards(settings.pairs))
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [errors, setErrors] = useState(0)
  const [matches, setMatches] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimit)
  const [gameStarted, setGameStarted] = useState(false)

  const isChecking = useRef(false)
  const gameOver = useRef(false)
  const startTime = useRef<number>(0)

  // Start timer on first card click (hard mode)
  useEffect(() => {
    if (!gameStarted || settings.timeLimit === 0) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, settings.timeLimit])

  // Handle time running out in hard mode
  useEffect(() => {
    if (settings.timeLimit > 0 && gameStarted && timeLeft === 0 && !gameOver.current) {
      gameOver.current = true
      const timeUsed = settings.timeLimit
      const score = calculateScore(matches, errors, timeUsed)
      onComplete(score)
    }
  }, [timeLeft, gameStarted, settings.timeLimit, matches, errors, onComplete])

  // Handle all pairs matched
  useEffect(() => {
    if (matches === settings.pairs && matches > 0 && !gameOver.current) {
      gameOver.current = true
      let timeUsed = 0
      if (settings.timeLimit > 0) {
        timeUsed = settings.timeLimit - timeLeft
      } else if (startTime.current > 0) {
        timeUsed = Math.floor((Date.now() - startTime.current) / 1000)
      }
      const score = calculateScore(matches, errors, timeUsed)
      onComplete(score)
    }
  }, [matches, settings.pairs, settings.timeLimit, timeLeft, errors, onComplete])

  const calculateScore = useCallback((matchCount: number, errorCount: number, timeUsed: number): number => {
    let score = matchCount * 100 - errorCount * 10
    if (settings.timeLimit > 0) {
      score += Math.max(0, (settings.timeLimit - timeUsed) * 2)
    }
    return Math.max(0, score)
  }, [settings.timeLimit])

  const handleCardClick = useCallback((index: number) => {
    if (gameOver.current) return
    if (isChecking.current) return
    if (cards[index].flipped || cards[index].matched) return
    if (flippedIndices.length >= 2) return

    // Start the game on first click
    if (!gameStarted) {
      setGameStarted(true)
      startTime.current = Date.now()
    }

    const newCards = [...cards]
    newCards[index] = { ...newCards[index], flipped: true }
    setCards(newCards)

    const newFlipped = [...flippedIndices, index]
    setFlippedIndices(newFlipped)

    if (newFlipped.length === 2) {
      isChecking.current = true
      const [first, second] = newFlipped

      if (newCards[first].icon === newCards[second].icon) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map((card, i) =>
            i === first || i === second
              ? { ...card, matched: true }
              : card
          ))
          setMatches(prev => prev + 1)
          setFlippedIndices([])
          isChecking.current = false
        }, 400)
      } else {
        // No match
        setErrors(prev => prev + 1)
        setTimeout(() => {
          setCards(prev => prev.map((card, i) =>
            i === first || i === second
              ? { ...card, flipped: false }
              : card
          ))
          setFlippedIndices([])
          isChecking.current = false
        }, 800)
      }
    }
  }, [cards, flippedIndices, gameStarted])

  return (
    <div className="game-area">
      <div className="game-stats">
        <div className="game-stat">
          <div className="game-stat-value">{matches}/{settings.pairs}</div>
          <div className="game-stat-label">配对</div>
        </div>
        <div className="game-stat">
          <div className="game-stat-value">{errors}</div>
          <div className="game-stat-label">错误</div>
        </div>
        {settings.timeLimit > 0 && (
          <div className="game-stat">
            <div className="game-stat-value" style={{ color: timeLeft <= 10 ? 'var(--error)' : undefined }}>
              {timeLeft}s
            </div>
            <div className="game-stat-label">时间</div>
          </div>
        )}
      </div>

      <div
        className="memory-grid"
        style={{ gridTemplateColumns: `repeat(${settings.cols}, 1fr)` }}
      >
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={
              'memory-card' +
              (card.flipped ? ' flipped' : '') +
              (card.matched ? ' matched' : '')
            }
            onClick={() => handleCardClick(index)}
          >
            <div className="memory-card-inner">
              <div className="memory-card-face memory-card-front">?</div>
              <div className="memory-card-face memory-card-back">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

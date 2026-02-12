import { useState, useEffect, useCallback, useRef } from 'react'
import { Difficulty } from '../types'

interface Props {
  difficulty: Difficulty
  onComplete: (score: number) => void
}

const SETTINGS: Record<Difficulty, { size: number; targetTime: number }> = {
  easy:   { size: 3, targetTime: 20 },
  normal: { size: 4, targetTime: 30 },
  hard:   { size: 5, targetTime: 50 },
}

function shuffleArray(arr: number[]): number[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateNumbers(size: number): number[] {
  const total = size * size
  const ordered = Array.from({ length: total }, (_, i) => i + 1)
  return shuffleArray(ordered)
}

function calculateScore(elapsed: number, errors: number, targetTime: number): number {
  const base = 500

  let timeBonus: number
  if (elapsed <= targetTime) {
    timeBonus = 300
  } else if (elapsed <= targetTime * 1.5) {
    timeBonus = 200
  } else if (elapsed <= targetTime * 2) {
    timeBonus = 100
  } else {
    timeBonus = 0
  }

  const errorPenalty = errors * 20
  return Math.max(0, base + timeBonus - errorPenalty)
}

export default function SchulteGrid({ difficulty, onComplete }: Props) {
  const { size, targetTime } = SETTINGS[difficulty]
  const total = size * size

  const [numbers] = useState<number[]>(() => generateNumbers(size))
  const [nextNumber, setNextNumber] = useState(1)
  const [completed, setCompleted] = useState<Set<number>>(() => new Set())
  const [errors, setErrors] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [started, setStarted] = useState(false)
  const [errorCell, setErrorCell] = useState<number | null>(null)

  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishedRef = useRef(false)

  // Timer: runs every 100ms once started, updates elapsed with 1 decimal
  useEffect(() => {
    if (!started || finishedRef.current) return

    const interval = setInterval(() => {
      setElapsed((prev) => Math.round((prev + 0.1) * 10) / 10)
    }, 100)

    return () => clearInterval(interval)
  }, [started])

  // Clean up error flash timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current)
      }
    }
  }, [])

  const handleCellClick = useCallback(
    (index: number) => {
      if (finishedRef.current) return

      const clickedNumber = numbers[index]

      // Already completed this number
      if (completed.has(clickedNumber)) return

      if (clickedNumber === nextNumber) {
        // Correct click
        if (!started) {
          setStarted(true)
        }

        const newCompleted = new Set(completed)
        newCompleted.add(clickedNumber)
        setCompleted(newCompleted)

        const newNext = nextNumber + 1
        setNextNumber(newNext)

        // Check if game is finished
        if (newNext > total) {
          finishedRef.current = true
          // Use current elapsed for scoring; add 0.1 for the tick that may not have fired
          setElapsed((prev) => {
            const finalElapsed = Math.round((prev + 0.1) * 10) / 10
            const score = calculateScore(finalElapsed, errors, targetTime)
            // Defer onComplete to avoid setState-during-render issues
            setTimeout(() => onComplete(score), 0)
            return finalElapsed
          })
        }
      } else {
        // Wrong click
        if (!started) {
          setStarted(true)
        }

        setErrors((prev) => prev + 1)
        setErrorCell(index)

        // Clear previous error flash timer
        if (errorTimerRef.current) {
          clearTimeout(errorTimerRef.current)
        }

        errorTimerRef.current = setTimeout(() => {
          setErrorCell(null)
          errorTimerRef.current = null
        }, 300)
      }
    },
    [numbers, nextNumber, completed, started, errors, total, targetTime, onComplete]
  )

  const getCellClass = (index: number): string => {
    const num = numbers[index]
    if (completed.has(num)) return 'schulte-cell correct'
    if (errorCell === index) return 'schulte-cell error'
    return 'schulte-cell'
  }

  return (
    <div className="game-area">
      <div className="game-stats">
        <div className="game-stat">
          <div className="game-stat-value">{elapsed.toFixed(1)}s</div>
          <div className="game-stat-label">用时</div>
        </div>
        <div className="game-stat">
          <div className="game-stat-value">{errors}</div>
          <div className="game-stat-label">错误</div>
        </div>
      </div>

      <div className="schulte-hint">
        {nextNumber <= total ? (
          <>请点击: <strong>{nextNumber}</strong></>
        ) : (
          <strong>完成!</strong>
        )}
      </div>

      <div
        className="schulte-grid"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {numbers.map((num, index) => (
          <button
            key={index}
            className={getCellClass(index)}
            onClick={() => handleCellClick(index)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  )
}

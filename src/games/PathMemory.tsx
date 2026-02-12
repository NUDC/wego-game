import { useState, useEffect, useCallback, useRef } from 'react'
import { Difficulty } from '../types'

interface Props {
  difficulty: Difficulty
  onComplete: (score: number) => void
}

const SETTINGS: Record<Difficulty, {
  gridSize: number
  startLength: number
  showSpeed: number
  maxLength: number
}> = {
  easy:   { gridSize: 3, startLength: 2, showSpeed: 1000, maxLength: 6 },
  normal: { gridSize: 4, startLength: 3, showSpeed: 600, maxLength: 8 },
  hard:   { gridSize: 5, startLength: 4, showSpeed: 400, maxLength: 10 },
}

type Phase = 'ready' | 'showing' | 'input' | 'success' | 'error' | 'gameover'

function generateSequence(length: number, totalCells: number): number[] {
  const indices: number[] = []
  while (indices.length < length) {
    const r = Math.floor(Math.random() * totalCells)
    if (!indices.includes(r)) {
      indices.push(r)
    }
  }
  return indices
}

export default function PathMemory({ difficulty, onComplete }: Props) {
  const { gridSize, startLength, showSpeed, maxLength } = SETTINGS[difficulty]
  const totalCells = gridSize * gridSize

  const [phase, setPhase] = useState<Phase>('ready')
  const [sequence, setSequence] = useState<number[]>([])
  const [playerInput, setPlayerInput] = useState<number[]>([])
  const [currentLength, setCurrentLength] = useState(startLength)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [score, setScore] = useState(0)
  const [retryUsed, setRetryUsed] = useState(false)
  const [statusText, setStatusText] = useState('准备...')

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const phaseRef = useRef<Phase>(phase)

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [])

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay)
    timeoutsRef.current.push(id)
    return id
  }, [])

  const startShowingSequence = useCallback((seq: number[]) => {
    setPhase('showing')
    setStatusText('观察路径...')
    setHighlightIndex(-1)
    setPlayerInput([])

    let delay = 0
    seq.forEach((_, i) => {
      // Turn on highlight
      addTimeout(() => {
        setHighlightIndex(i)
      }, delay)

      delay += showSpeed

      // Turn off highlight (gap before next)
      addTimeout(() => {
        setHighlightIndex(-1)
      }, delay)

      delay += 300
    })

    // After all shown, switch to input phase
    addTimeout(() => {
      setHighlightIndex(-1)
      setPhase('input')
      setStatusText('请重复路径')
    }, delay)
  }, [showSpeed, addTimeout])

  const startRound = useCallback((length: number) => {
    clearAllTimeouts()
    const seq = generateSequence(length, totalCells)
    setSequence(seq)
    setPlayerInput([])
    setRetryUsed(false)
    setPhase('ready')
    setStatusText('准备...')
    setHighlightIndex(-1)

    addTimeout(() => {
      startShowingSequence(seq)
    }, 1000)
  }, [totalCells, clearAllTimeouts, addTimeout, startShowingSequence])

  // Start the first round on mount
  useEffect(() => {
    startRound(startLength)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCellClick = useCallback((cellIndex: number) => {
    if (phaseRef.current !== 'input') return

    const newInput = [...playerInput, cellIndex]
    setPlayerInput(newInput)

    const stepIndex = newInput.length - 1
    const isCorrectSoFar = newInput[stepIndex] === sequence[stepIndex]

    if (newInput.length === sequence.length) {
      // Player has entered all cells
      const allCorrect = newInput.every((val, i) => val === sequence[i])

      if (allCorrect) {
        const earned = sequence.length * 50
        const newScore = score + earned
        setScore(newScore)
        setPhase('success')
        setStatusText('正确! 下一关')

        const nextLength = currentLength + 1
        if (nextLength > maxLength) {
          // Game complete - reached max
          addTimeout(() => {
            setPhase('gameover')
            onComplete(newScore)
          }, 1200)
        } else {
          setCurrentLength(nextLength)
          addTimeout(() => {
            startRound(nextLength)
          }, 1200)
        }
      } else {
        // Wrong answer
        if (!retryUsed) {
          // First failure - allow retry
          setRetryUsed(true)
          setPhase('error')
          setStatusText('错误! 再试一次')
          addTimeout(() => {
            clearAllTimeouts()
            startShowingSequence(sequence)
          }, 1200)
        } else {
          // Second failure - game over
          setPhase('gameover')
          setStatusText('游戏结束')
          addTimeout(() => {
            onComplete(score)
          }, 800)
        }
      }
    } else if (!isCorrectSoFar) {
      // Wrong cell mid-sequence - evaluate immediately
      if (!retryUsed) {
        setRetryUsed(true)
        setPhase('error')
        setStatusText('错误! 再试一次')
        addTimeout(() => {
          clearAllTimeouts()
          startShowingSequence(sequence)
        }, 1200)
      } else {
        setPhase('gameover')
        setStatusText('游戏结束')
        addTimeout(() => {
          onComplete(score)
        }, 800)
      }
    }
  }, [
    playerInput, sequence, score, currentLength, maxLength, retryUsed,
    onComplete, addTimeout, clearAllTimeouts, startShowingSequence, startRound,
  ])

  const getCellClass = (cellIndex: number): string => {
    const classes = ['path-cell']

    if (phase === 'showing' && highlightIndex >= 0 && sequence[highlightIndex] === cellIndex) {
      classes.push('highlight')
    }

    if ((phase === 'input' || phase === 'error') && playerInput.includes(cellIndex)) {
      classes.push('player-selected')
    }

    if (phase === 'success' && sequence.includes(cellIndex)) {
      classes.push('correct-reveal')
    }

    if (phase === 'error' && playerInput.includes(cellIndex) && !sequence.includes(cellIndex)) {
      classes.push('error-reveal')
    }
    if (phase === 'error' && playerInput.includes(cellIndex)) {
      const inputIdx = playerInput.indexOf(cellIndex)
      if (inputIdx < sequence.length && sequence[inputIdx] !== cellIndex) {
        classes.push('error-reveal')
      }
    }

    return classes.join(' ')
  }

  return (
    <div className="game-area">
      <div className="game-stats">
        <div className="game-stat">
          <div className="game-stat-value">{score}</div>
          <div className="game-stat-label">得分</div>
        </div>
        <div className="game-stat">
          <div className="game-stat-value">{currentLength}</div>
          <div className="game-stat-label">序列长度</div>
        </div>
      </div>

      <div className="path-status">{statusText}</div>

      <div className="path-level">当前序列: {currentLength} 格</div>

      <div
        className="path-grid"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {Array.from({ length: totalCells }, (_, index) => (
          <button
            key={index}
            className={getCellClass(index)}
            onClick={() => handleCellClick(index)}
            disabled={phase !== 'input'}
          />
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { Difficulty } from '../types'

interface Props {
  difficulty: Difficulty
  onComplete: (score: number) => void
}

const SETTINGS: Record<Difficulty, { startLength: number; maxLength: number; displayTime: number }> = {
  easy:   { startLength: 3, maxLength: 6,  displayTime: 1200 },
  normal: { startLength: 3, maxLength: 8,  displayTime: 1000 },
  hard:   { startLength: 4, maxLength: 10, displayTime: 800  },
}

function generateSequence(length: number): number[] {
  const seq: number[] = []
  for (let i = 0; i < length; i++) {
    seq.push(Math.floor(Math.random() * 10))
  }
  return seq
}

type Phase = 'showing' | 'input' | 'feedback' | 'done'

export default function DigitSpan({ difficulty, onComplete }: Props) {
  const settings = SETTINGS[difficulty]

  const [phase, setPhase] = useState<Phase>('showing')
  const [currentSequence, setCurrentSequence] = useState<number[]>(() =>
    generateSequence(settings.startLength)
  )
  const [playerInput, setPlayerInput] = useState<number[]>([])
  const [sequenceLength, setSequenceLength] = useState(settings.startLength)
  const [score, setScore] = useState(0)
  const [showingIndex, setShowingIndex] = useState(-1)
  const [failCount, setFailCount] = useState(0)
  const [longestCorrect, setLongestCorrect] = useState(0)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [firstTryAtLength, setFirstTryAtLength] = useState(true)

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gameOverRef = useRef(false)

  // Display digits one by one during 'showing' phase
  useEffect(() => {
    if (phase !== 'showing') return

    // Start showing after a brief delay for the "请记住以下数字" message
    const startDelay = setTimeout(() => {
      setShowingIndex(0)
    }, 1000)

    return () => clearTimeout(startDelay)
  }, [phase, currentSequence])

  // Advance through digits during showing phase
  useEffect(() => {
    if (phase !== 'showing' || showingIndex < 0) return

    if (showingIndex >= currentSequence.length) {
      // All digits shown, move to input phase
      const timeout = setTimeout(() => {
        setShowingIndex(-1)
        setPhase('input')
      }, 400)
      return () => clearTimeout(timeout)
    }

    // Show next digit after displayTime
    intervalRef.current = setTimeout(() => {
      setShowingIndex(prev => prev + 1)
    }, settings.displayTime)

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [phase, showingIndex, currentSequence.length, settings.displayTime])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
    }
  }, [])

  const handleNumberPress = useCallback((num: number) => {
    if (phase !== 'input' || gameOverRef.current) return
    setPlayerInput(prev => [...prev, num])
  }, [phase])

  const handleBackspace = useCallback(() => {
    if (phase !== 'input' || gameOverRef.current) return
    setPlayerInput(prev => prev.slice(0, -1))
  }, [phase])

  const handleConfirm = useCallback(() => {
    if (phase !== 'input' || gameOverRef.current) return

    const reversed = [...currentSequence].reverse()
    const isCorrect = playerInput.length === reversed.length &&
      playerInput.every((digit, i) => digit === reversed[i])

    setLastCorrect(isCorrect)

    if (isCorrect) {
      const roundScore = sequenceLength * 20 + (firstTryAtLength ? 10 : 0)
      const newScore = score + roundScore
      const newLongest = Math.max(longestCorrect, sequenceLength)
      setScore(newScore)
      setLongestCorrect(newLongest)
      setFailCount(0)
      setPhase('feedback')

      // After feedback, advance to next round
      setTimeout(() => {
        const nextLength = sequenceLength + 1
        if (nextLength > settings.maxLength) {
          // Reached max length, game ends
          gameOverRef.current = true
          setPhase('done')
          onComplete(newScore)
          return
        }
        setSequenceLength(nextLength)
        setCurrentSequence(generateSequence(nextLength))
        setPlayerInput([])
        setShowingIndex(-1)
        setFirstTryAtLength(true)
        setPhase('showing')
      }, 1500)
    } else {
      const newFailCount = failCount + 1
      setPhase('feedback')

      const maxFails = difficulty === 'easy' ? 3 : 2
      if (newFailCount >= maxFails) {
        // Two consecutive failures at same length, game over
        const finalScore = score
        setTimeout(() => {
          gameOverRef.current = true
          setPhase('done')
          onComplete(finalScore)
        }, 2000)
      } else {
        setFailCount(newFailCount)
        // Give another chance at the same length
        setTimeout(() => {
          setCurrentSequence(generateSequence(sequenceLength))
          setPlayerInput([])
          setShowingIndex(-1)
          setFirstTryAtLength(false)
          setPhase('showing')
        }, 2000)
      }
    }
  }, [phase, currentSequence, playerInput, sequenceLength, score, failCount, difficulty, settings.maxLength, onComplete, longestCorrect, firstTryAtLength])

  const reversedSequence = [...currentSequence].reverse()

  return (
    <div className="game-area">
      <div className="game-stats">
        <div className="game-stat">
          <div className="game-stat-value">{sequenceLength}</div>
          <div className="game-stat-label">序列长度</div>
        </div>
        <div className="game-stat">
          <div className="game-stat-value">{score}</div>
          <div className="game-stat-label">得分</div>
        </div>
      </div>

      {phase === 'showing' && (
        <div className="digit-show-area">
          {showingIndex < 0 ? (
            <div className="digit-hint">请记住以下数字</div>
          ) : showingIndex < currentSequence.length ? (
            <>
              <div className="digit-show-counter">第 {showingIndex + 1}/{currentSequence.length} 个</div>
              <div className="digit-big-num">{currentSequence[showingIndex]}</div>
            </>
          ) : null}
          <div className="digit-show-boxes">
            {currentSequence.map((d, i) => (
              <div key={i} className={`digit-show-box${i < showingIndex ? ' revealed' : ''}${i === showingIndex ? ' current' : ''}`}>
                {i <= showingIndex && i < currentSequence.length ? d : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div className="digit-input-area">
          <div className="digit-hint">请倒序输入</div>

          <div className="digit-input-boxes">
            {currentSequence.map((_, i) => (
              <div key={i} className={`digit-input-box${i === playerInput.length ? ' current' : ''}${i < playerInput.length ? ' filled' : ''}`}>
                {i < playerInput.length ? playerInput[i] : ''}
              </div>
            ))}
          </div>

          <div className="digit-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} className="digit-pad-btn" onClick={() => handleNumberPress(n)}>
                {n}
              </button>
            ))}
            <button className="digit-pad-btn digit-pad-back" onClick={handleBackspace}>
              &#8592;
            </button>
            <button className="digit-pad-btn" onClick={() => handleNumberPress(0)}>
              0
            </button>
            <button className="digit-pad-btn digit-pad-confirm" onClick={handleConfirm}>
              &#10003;
            </button>
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="digit-show-area">
          {lastCorrect ? (
            <div className="digit-feedback-ok">正确!</div>
          ) : (
            <>
              <div className="digit-feedback-fail">错误</div>
              <div className="digit-feedback-detail">
                正确答案: <strong>{reversedSequence.join(' ')}</strong>
              </div>
              <div className="digit-feedback-detail">
                你的输入: <strong>{playerInput.join(' ') || '(空)'}</strong>
              </div>
            </>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="digit-show-area">
          <div className="digit-hint">测试结束</div>
          <div className="digit-feedback-detail">
            最长序列: <strong>{longestCorrect}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

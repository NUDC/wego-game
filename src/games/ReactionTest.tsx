import { useState, useEffect, useCallback, useRef } from 'react'

interface Props {
  difficulty: 'easy' | 'normal' | 'hard'
  onComplete: (score: number) => void
}

const DIFFICULTY_SETTINGS = {
  easy:   { trials: 8,  minDelay: 1500, maxDelay: 3000, trickTrials: false },
  normal: { trials: 12, minDelay: 1000, maxDelay: 4000, trickTrials: false },
  hard:   { trials: 15, minDelay: 500,  maxDelay: 5000, trickTrials: true },
} as const

type Phase = 'waiting' | 'ready' | 'signal' | 'result' | 'tooEarly' | 'done'

function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function calculateTrialScore(reactionTime: number): number {
  if (reactionTime < 150) return 0
  return Math.max(0, 800 - reactionTime)
}

export default function ReactionTest({ difficulty, onComplete }: Props) {
  const settings = DIFFICULTY_SETTINGS[difficulty]
  const totalTrials = settings.trials

  const [phase, setPhase] = useState<Phase>('waiting')
  const [currentTrial, setCurrentTrial] = useState(0)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null)

  const signalTimeRef = useRef<number>(0)
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTrickTrialRef = useRef(false)

  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current)
      if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current)
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
    }
  }, [])

  const startTrial = useCallback(() => {
    // Clear any lingering timeouts
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current)
    if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current)

    setPhase('ready')
    setLastReactionTime(null)
    isTrickTrialRef.current = false

    const delay = getRandomDelay(settings.minDelay, settings.maxDelay)

    // Determine if this is a trick trial (hard mode only, ~30% chance)
    const isTrick = settings.trickTrials && Math.random() < 0.3

    delayTimeoutRef.current = setTimeout(() => {
      if (isTrick) {
        // Trick trial: show signal briefly then hide it
        isTrickTrialRef.current = true
        setPhase('signal')
        signalTimeRef.current = performance.now()

        trickTimeoutRef.current = setTimeout(() => {
          // Hide the signal and go back to ready
          isTrickTrialRef.current = false
          setPhase('ready')

          // Show the real signal after another short delay
          const secondDelay = getRandomDelay(800, 2000)
          delayTimeoutRef.current = setTimeout(() => {
            setPhase('signal')
            signalTimeRef.current = performance.now()
          }, secondDelay)
        }, 150) // Signal visible for only 150ms
      } else {
        setPhase('signal')
        signalTimeRef.current = performance.now()
      }
    }, delay)
  }, [settings.minDelay, settings.maxDelay, settings.trickTrials])

  // Start the first trial automatically
  useEffect(() => {
    const timeout = setTimeout(() => {
      startTrial()
    }, 1000)
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCircleClick = useCallback(() => {
    if (phase === 'waiting') return
    if (phase === 'done') return
    if (phase === 'result') return
    if (phase === 'tooEarly') return

    if (phase === 'ready') {
      // Clicked too early
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current)
      if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current)
      setPhase('tooEarly')

      advanceTimeoutRef.current = setTimeout(() => {
        startTrial()
      }, 1500)
      return
    }

    if (phase === 'signal') {
      const reactionTime = Math.round(performance.now() - signalTimeRef.current)
      setLastReactionTime(reactionTime)
      setPhase('result')

      const newReactionTimes = [...reactionTimes, reactionTime]
      setReactionTimes(newReactionTimes)

      const nextTrial = currentTrial + 1

      if (nextTrial >= totalTrials) {
        // Game complete
        setCurrentTrial(nextTrial)
        advanceTimeoutRef.current = setTimeout(() => {
          const totalScore = Math.round(
            newReactionTimes.reduce((sum, rt) => sum + calculateTrialScore(rt), 0)
            / newReactionTimes.length
          )
          const normalizedScore = Math.min(800, Math.round(totalScore))
          onComplete(normalizedScore)
        }, 1500)
      } else {
        setCurrentTrial(nextTrial)
        advanceTimeoutRef.current = setTimeout(() => {
          startTrial()
        }, 1500)
      }
    }
  }, [phase, reactionTimes, currentTrial, totalTrials, startTrial, onComplete])

  const getCircleColor = (): string => {
    switch (phase) {
      case 'signal':
        return '#27ae60'
      case 'tooEarly':
        return '#e74c3c'
      default:
        return '#ccc'
    }
  }

  const getResultQuality = (ms: number): { label: string; className: string } => {
    if (ms < 150) return { label: '预判', className: 'chip-warn' }
    if (ms < 200) return { label: '极快', className: 'chip-fast' }
    if (ms < 250) return { label: '很快', className: 'chip-fast' }
    if (ms < 300) return { label: '不错', className: 'chip-ok' }
    if (ms < 400) return { label: '一般', className: 'chip-mid' }
    return { label: '较慢', className: 'chip-slow' }
  }

  const getChipClass = (ms: number): string => {
    if (ms < 150) return 'chip-warn'
    if (ms < 250) return 'chip-fast'
    if (ms < 350) return 'chip-ok'
    return 'chip-slow'
  }

  const averageTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0

  const validTimes = reactionTimes.filter(t => t >= 150)
  const averageValidTime = validTimes.length > 0
    ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    : 0

  const bestTime = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0
  const worstTime = reactionTimes.length > 0 ? Math.max(...reactionTimes) : 0

  const displayedTrial = Math.min(currentTrial + 1, totalTrials)

  if (phase === 'done') {
    return (
      <div className="game-area">
        <div className="reaction-done-title">测试完成!</div>

        <div className="reaction-done-stats">
          <div className="reaction-done-stat">
            <div className="reaction-done-stat-value">{averageTime}ms</div>
            <div className="reaction-done-stat-label">平均反应</div>
          </div>
          {validTimes.length > 0 && validTimes.length < reactionTimes.length && (
            <div className="reaction-done-stat">
              <div className="reaction-done-stat-value">{averageValidTime}ms</div>
              <div className="reaction-done-stat-label">有效平均</div>
            </div>
          )}
          <div className="reaction-done-stat">
            <div className="reaction-done-stat-value highlight-fast">{bestTime}ms</div>
            <div className="reaction-done-stat-label">最快</div>
          </div>
          <div className="reaction-done-stat">
            <div className="reaction-done-stat-value">{worstTime}ms</div>
            <div className="reaction-done-stat-label">最慢</div>
          </div>
        </div>

        <div className="reaction-done-detail">
          <div className="reaction-done-detail-title">各轮反应时间</div>
          <div className="reaction-times">
            {reactionTimes.map((rt, i) => (
              <span key={i} className={`reaction-time-chip ${getChipClass(rt)}`}>
                第{i + 1}轮 {rt}ms
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-area">
      <div className="game-stats">
        <div className="game-stat">
          <div className="game-stat-value">
            {displayedTrial} / {totalTrials}
          </div>
          <div className="game-stat-label">进度</div>
        </div>
        {reactionTimes.length > 0 && (
          <div className="game-stat">
            <div className="game-stat-value">{averageValidTime}ms</div>
            <div className="game-stat-label">平均反应</div>
          </div>
        )}
      </div>

      <div className="reaction-status">
        {phase === 'waiting' && '准备...'}
        {phase === 'ready' && '等待绿色...'}
        {phase === 'signal' && '点击!'}
        {phase === 'tooEarly' && '太早了!'}
        {phase === 'result' && lastReactionTime !== null && (() => {
          const q = getResultQuality(lastReactionTime)
          return (
            <span className={`reaction-status-result ${q.className}`}>
              {lastReactionTime}ms · {q.label}
            </span>
          )
        })()}
      </div>

      <div className="reaction-area" onClick={handleCircleClick}>
        <div
          className="reaction-circle"
          style={{ backgroundColor: getCircleColor() }}
        />
      </div>

      {phase === 'tooEarly' && (
        <div className="reaction-result">
          信号出现前点击了，本轮不计分
        </div>
      )}

      {reactionTimes.length > 0 && (
        <div className="reaction-times">
          {reactionTimes.map((rt, i) => (
            <span key={i} className={`reaction-time-chip ${getChipClass(rt)}`}>
              {rt}ms
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

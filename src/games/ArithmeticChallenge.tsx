import { useState, useEffect, useCallback, useRef } from 'react'

interface Props {
  difficulty: 'easy' | 'normal' | 'hard'
  onComplete: (score: number) => void
}

interface Problem {
  text: string
  answer: number
  options: number[]
}

const DIFFICULTY_SETTINGS = {
  easy: {
    timeLimit: 60,
    pointsPerCorrect: 10,
    comboBonus: 2,
    maxComboExtra: 10,
  },
  normal: {
    timeLimit: 60,
    pointsPerCorrect: 15,
    comboBonus: 3,
    maxComboExtra: 15,
  },
  hard: {
    timeLimit: 90,
    pointsPerCorrect: 20,
    comboBonus: 5,
    maxComboExtra: 25,
  },
} as const

function generateDistractors(answer: number): number[] {
  const distractors = new Set<number>()
  // Generate plausible wrong answers near the correct one
  const offsets = [-3, -2, -1, 1, 2, 3, 5, -5, 10, -10]
  const shuffled = offsets.sort(() => Math.random() - 0.5)

  for (const offset of shuffled) {
    if (distractors.size >= 3) break
    const val = answer + offset
    if (val >= 0 && val !== answer && !distractors.has(val)) {
      distractors.add(val)
    }
  }

  // Fallback if we don't have enough
  let fallback = 1
  while (distractors.size < 3) {
    const val = answer + fallback
    if (val !== answer && !distractors.has(val)) {
      distractors.add(val)
    }
    fallback = fallback > 0 ? -fallback : -fallback + 1
  }

  return Array.from(distractors)
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateProblem(difficulty: 'easy' | 'normal' | 'hard', problemIndex: number): Problem {
  const tierStep = difficulty === 'easy' ? 8 : 5
  const tier = Math.min(Math.floor(problemIndex / tierStep), 4)
  let text: string
  let answer: number

  if (difficulty === 'easy') {
    const maxNum = Math.min(10 + tier * 2, 20)
    const isAdd = Math.random() < 0.5
    if (isAdd) {
      const a = Math.floor(Math.random() * maxNum) + 1
      const b = Math.floor(Math.random() * maxNum) + 1
      text = `${a} + ${b} = ?`
      answer = a + b
    } else {
      const b = Math.floor(Math.random() * maxNum) + 1
      const a = b + Math.floor(Math.random() * maxNum) + 1
      text = `${a} - ${b} = ?`
      answer = a - b
    }
  } else if (difficulty === 'normal') {
    const ops = ['add', 'sub', 'mul']
    const op = ops[Math.floor(Math.random() * ops.length)]
    const maxNum = Math.min(20 + tier * 8, 50)

    if (op === 'add') {
      const a = Math.floor(Math.random() * maxNum) + 1
      const b = Math.floor(Math.random() * maxNum) + 1
      text = `${a} + ${b} = ?`
      answer = a + b
    } else if (op === 'sub') {
      const b = Math.floor(Math.random() * maxNum) + 1
      const a = b + Math.floor(Math.random() * maxNum) + 1
      text = `${a} - ${b} = ?`
      answer = a - b
    } else {
      const maxMul = Math.min(6 + tier * 2, 12)
      const a = Math.floor(Math.random() * maxMul) + 2
      const b = Math.floor(Math.random() * maxMul) + 2
      text = `${a} \u00d7 ${b} = ?`
      answer = a * b
    }
  } else {
    const ops = ['add', 'sub', 'mul', 'div']
    const op = ops[Math.floor(Math.random() * ops.length)]
    const maxNum = Math.min(30 + tier * 15, 99)

    if (op === 'add') {
      const a = Math.floor(Math.random() * maxNum) + 10
      const b = Math.floor(Math.random() * maxNum) + 10
      text = `${a} + ${b} = ?`
      answer = a + b
    } else if (op === 'sub') {
      const b = Math.floor(Math.random() * maxNum) + 10
      const a = b + Math.floor(Math.random() * maxNum) + 1
      text = `${a} - ${b} = ?`
      answer = a - b
    } else if (op === 'mul') {
      const maxMul = Math.min(8 + tier * 2, 15)
      const a = Math.floor(Math.random() * maxMul) + 2
      const b = Math.floor(Math.random() * maxMul) + 2
      text = `${a} \u00d7 ${b} = ?`
      answer = a * b
    } else {
      const maxDiv = Math.min(8 + tier * 2, 15)
      const divisor = Math.floor(Math.random() * maxDiv) + 2
      const quotient = Math.floor(Math.random() * maxDiv) + 2
      const dividend = divisor * quotient
      text = `${dividend} \u00f7 ${divisor} = ?`
      answer = quotient
    }
  }

  const distractors = generateDistractors(answer)
  const options = shuffleArray([answer, ...distractors])

  return { text, answer, options }
}

export default function ArithmeticChallenge({ difficulty, onComplete }: Props) {
  const settings = DIFFICULTY_SETTINGS[difficulty]

  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimit)
  const [currentProblem, setCurrentProblem] = useState<Problem>(() => generateProblem(difficulty, 0))
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalAttempted, setTotalAttempted] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gameActiveRef = useRef(true)
  const scoreRef = useRef(0)
  const problemIndexRef = useRef(0)
  const isProcessingRef = useRef(false)

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          gameActiveRef.current = false
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Handle game end when timeLeft reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !gameActiveRef.current) {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      onComplete(scoreRef.current)
    }
  }, [timeLeft, onComplete])

  // Cleanup feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  const nextProblem = useCallback(() => {
    problemIndexRef.current += 1
    const problem = generateProblem(difficulty, problemIndexRef.current)
    setCurrentProblem(problem)
    setFeedback(null)
    setSelectedOption(null)
    isProcessingRef.current = false
  }, [difficulty])

  const handleOptionClick = useCallback((value: number) => {
    if (isProcessingRef.current) return
    if (!gameActiveRef.current) return

    isProcessingRef.current = true
    setSelectedOption(value)

    const isCorrect = value === currentProblem.answer
    setTotalAttempted(prev => prev + 1)

    if (isCorrect) {
      const newStreak = streak + 1
      const comboExtra = Math.min(
        (newStreak - 1) * settings.comboBonus,
        settings.maxComboExtra
      )
      const points = settings.pointsPerCorrect + comboExtra

      setStreak(newStreak)
      setTotalCorrect(prev => prev + 1)
      setScore(prev => {
        const newScore = prev + points
        scoreRef.current = newScore
        return newScore
      })
      setFeedback('correct')

      feedbackTimerRef.current = setTimeout(() => {
        if (gameActiveRef.current) {
          nextProblem()
        }
      }, 400)
    } else {
      setStreak(0)
      setFeedback('wrong')

      feedbackTimerRef.current = setTimeout(() => {
        if (gameActiveRef.current) {
          nextProblem()
        }
      }, 800)
    }
  }, [currentProblem.answer, streak, settings, nextProblem])

  const timerPercent = (timeLeft / settings.timeLimit) * 100
  const timerColor = timeLeft <= 10 ? 'var(--error)' : timeLeft <= 20 ? 'var(--accent)' : 'var(--primary)'

  return (
    <div className="game-area">
      {/* Timer bar */}
      <div className="arith-timer">
        <div className="arith-timer-text">
          <span>剩余时间</span>
          <span style={{ color: timeLeft <= 10 ? 'var(--error)' : 'var(--text)' }}>
            {timeLeft}s
          </span>
        </div>
        <div className="arith-timer-bar">
          <div
            className="arith-timer-fill"
            style={{
              width: `${timerPercent}%`,
              background: timerColor,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="arith-stats">
        <div className="game-stat">
          <div className="game-stat-value">{score}</div>
          <div className="game-stat-label">得分</div>
        </div>
        <div className="game-stat">
          <div className="game-stat-value">{totalCorrect}/{totalAttempted}</div>
          <div className="game-stat-label">正确率</div>
        </div>
        {streak > 1 && (
          <div className="game-stat">
            <div className="game-stat-value" style={{ color: 'var(--accent)' }}>
              {streak}
            </div>
            <div className="game-stat-label">连击</div>
          </div>
        )}
      </div>

      {/* Problem display */}
      <div className="arith-problem">
        {currentProblem.text}
      </div>

      {/* Feedback */}
      <div className="arith-feedback">
        {feedback === 'correct' && (
          <span style={{ color: 'var(--success)' }}>&#10003; 正确!</span>
        )}
        {feedback === 'wrong' && (
          <span style={{ color: 'var(--error)' }}>
            &#10007; 答案是 {currentProblem.answer}
          </span>
        )}
      </div>

      {/* 4 options */}
      <div className="arith-options">
        {currentProblem.options.map((value, index) => {
          let className = 'arith-option'
          if (feedback !== null && value === currentProblem.answer) {
            className += ' correct'
          } else if (feedback === 'wrong' && value === selectedOption) {
            className += ' wrong'
          }

          return (
            <button
              key={index}
              className={className}
              disabled={feedback !== null}
              onClick={() => handleOptionClick(value)}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

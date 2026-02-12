import { useState, useEffect, useCallback, useRef } from 'react'

interface Props {
  difficulty: 'easy' | 'normal' | 'hard'
  onComplete: (score: number) => void
}

interface ColorEntry {
  name: string
  value: string
}

interface Trial {
  word: string
  inkColor: string
  correctAnswer: string
  options: ColorEntry[]
}

const COLORS: ColorEntry[] = [
  { name: '红色', value: '#E74C3C' },
  { name: '蓝色', value: '#3498DB' },
  { name: '绿色', value: '#2ECC71' },
  { name: '黄色', value: '#F1C40F' },
]

const DIFFICULTY_SETTINGS = {
  easy:   { totalRounds: 15, colorCount: 3, incongruentRate: 0.3,  shufflePositions: false },
  normal: { totalRounds: 20, colorCount: 4, incongruentRate: 0.7,  shufflePositions: false },
  hard:   { totalRounds: 25, colorCount: 4, incongruentRate: 0.85, shufflePositions: true },
} as const

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateTrial(colorPool: ColorEntry[], incongruentRate: number, shufflePositions: boolean): Trial {
  const isIncongruent = Math.random() < incongruentRate

  const wordIndex = Math.floor(Math.random() * colorPool.length)
  const wordColor = colorPool[wordIndex]

  let inkColor: ColorEntry

  if (isIncongruent) {
    const others = colorPool.filter((_, i) => i !== wordIndex)
    inkColor = others[Math.floor(Math.random() * others.length)]
  } else {
    inkColor = wordColor
  }

  let options: ColorEntry[]
  if (shufflePositions) {
    options = shuffle(colorPool)
  } else {
    options = [...colorPool]
  }

  return {
    word: wordColor.name,
    inkColor: inkColor.value,
    correctAnswer: inkColor.name,
    options,
  }
}

export default function StroopTest({ difficulty, onComplete }: Props) {
  const settings = DIFFICULTY_SETTINGS[difficulty]
  const colorPool = COLORS.slice(0, settings.colorCount)

  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [currentWord, setCurrentWord] = useState('')
  const [currentInkColor, setCurrentInkColor] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [options, setOptions] = useState<ColorEntry[]>([])
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isProcessing = useRef(false)
  const trialStartTime = useRef<number>(Date.now())
  const scoreRef = useRef(0)
  const roundRef = useRef(1)

  const loadTrial = useCallback(() => {
    const trial = generateTrial(colorPool, settings.incongruentRate, settings.shufflePositions)
    setCurrentWord(trial.word)
    setCurrentInkColor(trial.inkColor)
    setCorrectAnswer(trial.correctAnswer)
    setOptions(trial.options)
    setFeedback(null)
    isProcessing.current = false
    trialStartTime.current = Date.now()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.colorCount, settings.incongruentRate, settings.shufflePositions])

  // Initialize first trial
  useEffect(() => {
    loadTrial()
  }, [loadTrial])

  const handleOptionClick = useCallback((colorName: string) => {
    if (isProcessing.current) return
    isProcessing.current = true

    const answerTime = Date.now() - trialStartTime.current
    const isCorrect = colorName === correctAnswer

    if (isCorrect) {
      let points = 10

      if (answerTime <= 2000) {
        points += 5
      }

      const newStreak = streak + 1

      if (newStreak === 10) {
        points += 50
      } else if (newStreak === 5) {
        points += 20
      }

      setStreak(newStreak)
      setScore(prev => {
        const newScore = prev + points
        scoreRef.current = newScore
        return newScore
      })
      setFeedback('correct')
    } else {
      setStreak(0)
      setScore(prev => {
        const newScore = Math.max(0, prev - 5)
        scoreRef.current = newScore
        return newScore
      })
      setFeedback('wrong')
    }

    const nextRound = roundRef.current + 1

    if (nextRound > settings.totalRounds) {
      // Game over after feedback
      feedbackTimerRef.current = setTimeout(() => {
        onComplete(scoreRef.current)
      }, 400)
    } else {
      setRound(nextRound)
      roundRef.current = nextRound
      feedbackTimerRef.current = setTimeout(() => {
        loadTrial()
      }, 400)
    }
  }, [correctAnswer, streak, settings.totalRounds, loadTrial, onComplete])

  // Cleanup feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  const correctColor = feedback === 'wrong'
    ? options.find(o => o.name === correctAnswer)
    : null

  return (
    <div className="game-area">
      <div className="game-stats">
        <div className="game-stat">
          <div className="game-stat-value">
            {round}/{settings.totalRounds}
          </div>
          <div className="game-stat-label">轮次</div>
        </div>
        <div className="game-stat">
          <div className="game-stat-value">{score}</div>
          <div className="game-stat-label">得分</div>
        </div>
        {streak > 0 && (
          <div className="game-stat">
            <div className="game-stat-value" style={{ color: 'var(--accent)' }}>
              {streak}
            </div>
            <div className="game-stat-label">连击</div>
          </div>
        )}
      </div>

      <div className="stroop-streak">
        {streak >= 5 ? `连续 ${streak} 对!` : ''}
      </div>

      <div className="stroop-word" style={{ color: currentInkColor }}>
        {currentWord}
      </div>

      <div className="stroop-feedback">
        {feedback === 'correct' && <span style={{ color: 'var(--success)' }}>&#10003;</span>}
        {feedback === 'wrong' && (
          <span>
            <span style={{ color: 'var(--error)' }}>&#10007;</span>
            {correctColor && (
              <span style={{ marginLeft: 12, fontSize: '1rem', color: correctColor.value }}>
                {correctColor.name}
              </span>
            )}
          </span>
        )}
      </div>

      <div className="stroop-options">
        {options.map(option => (
          <button
            key={option.name}
            className="stroop-option"
            disabled={feedback !== null}
            onClick={() => handleOptionClick(option.name)}
            style={{
              borderLeftWidth: 6,
              borderLeftColor: option.value,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: option.value,
                flexShrink: 0,
              }}
            />
            {option.name}
          </button>
        ))}
      </div>
    </div>
  )
}

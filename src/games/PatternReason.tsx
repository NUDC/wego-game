import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface Props {
  difficulty: 'easy' | 'normal' | 'hard'
  onComplete: (score: number) => void
}

interface PatternQuestion {
  sequence: string[]
  options: string[]
  correctIndex: number
  difficulty: 'easy' | 'normal' | 'hard'
}

const DIFFICULTY_SETTINGS = {
  easy:   { questionCount: 10, pointsPerCorrect: 50 },
  normal: { questionCount: 12, pointsPerCorrect: 67 },
  hard:   { questionCount: 15, pointsPerCorrect: 67 },
} as const

const SPEED_BONUS = 10
const SPEED_THRESHOLD_MS = 8000

// ── Easy Questions (12) ──────────────────────────────────────────────

const EASY_QUESTIONS: PatternQuestion[] = [
  // Color sequence: alternating red/blue
  {
    sequence: ['🔴', '🔵', '🔴', '🔵', '🔴'],
    options: ['🔵', '🔴', '🟢', '🟡'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  // Shape sequence: repeating cycle
  {
    sequence: ['■', '▲', '●', '■', '▲'],
    options: ['■', '▲', '●', '◆'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  // Rotation sequence
  {
    sequence: ['▶', '▲', '◀', '▼'],
    options: ['▲', '▶', '◀', '▼'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  // Number pattern: increasing dots
  {
    sequence: ['●', '●●', '●●●'],
    options: ['●●', '●●●●', '●●●', '●'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  // Color sequence: three-color cycle
  {
    sequence: ['🟢', '🟡', '🔴', '🟢', '🟡'],
    options: ['🟢', '🟡', '🔴', '🔵'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  // Same shape repeating
  {
    sequence: ['◆', '◆', '◆', '◆'],
    options: ['■', '▲', '●', '◆'],
    correctIndex: 3,
    difficulty: 'easy',
  },
  // Simple alternating shapes
  {
    sequence: ['★', '☆', '★', '☆', '★'],
    options: ['★', '☆', '◇', '○'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  // Increasing count
  {
    sequence: ['★', '★★', '★★★', '★★★★'],
    options: ['★★★', '★★★★★', '★★', '★'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  // Color pair repetition
  {
    sequence: ['🔴', '🔴', '🔵', '🔵', '🔴', '🔴'],
    options: ['🔴', '🔵', '🟢', '🟡'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  // Simple arrow rotation
  {
    sequence: ['→', '↓', '←', '↑'],
    options: ['→', '↓', '←', '↑'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  // Shape cycle ABAB
  {
    sequence: ['◇', '○', '◇', '○'],
    options: ['○', '◇', '□', '△'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  // Single color growing
  {
    sequence: ['🟡', '🟡🟡', '🟡🟡🟡'],
    options: ['🟡🟡🟡🟡', '🟡🟡', '🟡', '🟡🟡🟡'],
    correctIndex: 0,
    difficulty: 'easy',
  },
]

// ── Normal Questions (14) ────────────────────────────────────────────

const NORMAL_QUESTIONS: PatternQuestion[] = [
  // Two-attribute: shape changes while color stays
  {
    sequence: ['🔴■', '🔴▲', '🔴●', '🔴■', '🔴▲'],
    options: ['🔴●', '🔵●', '🔴■', '🔵▲'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Alternating two patterns interleaved
  {
    sequence: ['■', '○', '■', '○', '■'],
    options: ['■', '○', '△', '◇'],
    correctIndex: 1,
    difficulty: 'normal',
  },
  // Color and shape both alternate
  {
    sequence: ['🔴▲', '🔵■', '🔴▲', '🔵■'],
    options: ['🔴▲', '🔵▲', '🔴■', '🔵■'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Mirror pattern
  {
    sequence: ['▲', '■', '●', '■'],
    options: ['▲', '●', '■', '◆'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Increasing then decreasing count
  {
    sequence: ['●', '●●', '●●●', '●●'],
    options: ['●', '●●', '●●●', '●●●●'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Double rotation sequence
  {
    sequence: ['↗', '↘', '↙', '↖'],
    options: ['↗', '↘', '↙', '↖'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Color gradient sequence
  {
    sequence: ['⬜', '🟨', '🟧', '🟥'],
    options: ['🟫', '⬛', '🟦', '🟪'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Pair pattern with shift
  {
    sequence: ['🔵🔴', '🔴🟢', '🟢🟡'],
    options: ['🟡🔵', '🔵🟢', '🟡🔴', '🔴🔵'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Shape accumulation
  {
    sequence: ['▲', '▲■', '▲■●'],
    options: ['▲■●◆', '■●◆', '▲■', '●◆'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Alternating with size indicator
  {
    sequence: ['小●', '大●', '小●', '大●'],
    options: ['小●', '大●', '中●', '小■'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // ABA pattern
  {
    sequence: ['🟢', '🔴', '🟢', '🔵', '🟢', '🟡', '🟢'],
    options: ['🔴', '🟣', '🟢', '🟡'],
    correctIndex: 2,
    difficulty: 'normal',
  },
  // Rotation with double step
  {
    sequence: ['▶', '◀', '▶', '◀'],
    options: ['▲', '▼', '▶', '◀'],
    correctIndex: 2,
    difficulty: 'normal',
  },
  // Two streams interleaved
  {
    sequence: ['🔴', '■', '🔵', '▲', '🟢'],
    options: ['●', '◆', '■', '▲'],
    correctIndex: 0,
    difficulty: 'normal',
  },
  // Symmetric pattern
  {
    sequence: ['▲', '●', '■', '●'],
    options: ['▲', '■', '●', '◆'],
    correctIndex: 0,
    difficulty: 'normal',
  },
]

// ── Hard Questions (17) ──────────────────────────────────────────────

const HARD_QUESTIONS: PatternQuestion[] = [
  // Three-attribute change: color + shape + size cycle
  {
    sequence: ['小🔴▲', '中🔵■', '大🟢●', '小🔴▲'],
    options: ['中🔵■', '大🟢●', '小🔵▲', '中🔴●'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Nested pattern: outer repeats, inner shifts
  {
    sequence: ['[▲●]', '[●■]', '[■▲]'],
    options: ['[▲●]', '[●▲]', '[■●]', '[▲■]'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Fibonacci-like count
  {
    sequence: ['●', '●', '●●', '●●●', '●●●●●'],
    options: ['●●●●●●●●', '●●●●●●', '●●●●', '●●●●●●●'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Color and shape independently cycle at different rates
  {
    sequence: ['🔴▲', '🔵■', '🟢▲', '🔴■', '🔵▲'],
    options: ['🟢■', '🔴▲', '🟢▲', '🔵■'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Double rotation: arrow + color
  {
    sequence: ['🔴→', '🔵↓', '🟢←', '🟡↑'],
    options: ['🔴→', '🔵↓', '🟢←', '🟡↑'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Three-element cycle with reversal
  {
    sequence: ['▲■●', '●■▲', '▲■●'],
    options: ['●■▲', '▲●■', '■▲●', '●▲■'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Progressive addition with shift
  {
    sequence: ['A', 'AB', 'ABC', 'ABCD'],
    options: ['ABCDE', 'ABCD', 'BCDE', 'ABCDEF'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Color triple cycle + shape double cycle
  {
    sequence: ['🔴●', '🔵■', '🟢●', '🔴■', '🔵●', '🟢■'],
    options: ['🔴●', '🔵■', '🟢●', '🔴■'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Additive pattern: each step adds one more
  {
    sequence: ['♠', '♠♥', '♠♥♦', '♠♥♦♣'],
    options: ['♠♥♦♣♤', '♠♥♦', '♥♦♣', '♠♥♦♣♠'],
    correctIndex: 3,
    difficulty: 'hard',
  },
  // Mirror + rotation
  {
    sequence: ['◢', '◣', '◤', '◥'],
    options: ['◢', '◣', '◤', '◥'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Three shapes with position rotation
  {
    sequence: ['▲■●', '●▲■', '■●▲'],
    options: ['▲■●', '●■▲', '■▲●', '▲●■'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Emoji sequence with two changing dimensions
  {
    sequence: ['🔴🔴', '🔵🔵🔵', '🟢🟢🟢🟢', '🟡🟡🟡🟡🟡'],
    options: ['🟣🟣🟣🟣🟣🟣', '🔴🔴🔴🔴🔴🔴', '🟠🟠🟠🟠🟠🟠', '🟤🟤🟤🟤🟤'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Complex alternation: odd positions one pattern, even positions another
  {
    sequence: ['★', '🔴', '☆', '🔵', '★', '🟢'],
    options: ['☆', '★', '🔴', '🟡'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Subtraction pattern
  {
    sequence: ['●●●●●', '●●●●', '●●●', '●●'],
    options: ['●', '●●', '●●●', ''],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Encoded pattern: numbers represent positions
  {
    sequence: ['①②③', '②③④', '③④⑤'],
    options: ['④⑤⑥', '⑤⑥⑦', '③④⑤', '①②③'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Multi-symbol with cycle
  {
    sequence: ['♠♥', '♥♦', '♦♣', '♣♠'],
    options: ['♠♥', '♥♣', '♦♠', '♣♦'],
    correctIndex: 0,
    difficulty: 'hard',
  },
  // Three independent cycles
  {
    sequence: ['大🔴▲', '小🔵■', '大🟢●', '小🔴▲'],
    options: ['大🔵■', '小🟢●', '大🔴●', '小🔵▲'],
    correctIndex: 0,
    difficulty: 'hard',
  },
]

const ALL_QUESTIONS: Record<'easy' | 'normal' | 'hard', PatternQuestion[]> = {
  easy: EASY_QUESTIONS,
  normal: [...EASY_QUESTIONS, ...NORMAL_QUESTIONS],
  hard: [...EASY_QUESTIONS, ...NORMAL_QUESTIONS, ...HARD_QUESTIONS],
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function selectQuestions(difficulty: 'easy' | 'normal' | 'hard'): PatternQuestion[] {
  const settings = DIFFICULTY_SETTINGS[difficulty]
  const pool = ALL_QUESTIONS[difficulty]
  const shuffled = shuffle(pool)
  return shuffled.slice(0, settings.questionCount)
}

export default function PatternReason({ difficulty, onComplete }: Props) {
  const settings = DIFFICULTY_SETTINGS[difficulty]

  const questions = useMemo(() => selectQuestions(difficulty), [difficulty])

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const questionStartTime = useRef<number>(Date.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isProcessing = useRef(false)
  const scoreRef = useRef(0)

  // Reset timer when question changes
  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [currentQuestion])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  const handleOptionClick = useCallback((optionIndex: number) => {
    if (isProcessing.current) return
    if (feedback !== null) return
    isProcessing.current = true

    const question = questions[currentQuestion]
    const isCorrect = optionIndex === question.correctIndex
    const answerTime = Date.now() - questionStartTime.current

    setSelectedOption(optionIndex)

    if (isCorrect) {
      let points = settings.pointsPerCorrect
      if (answerTime <= SPEED_THRESHOLD_MS) {
        points += SPEED_BONUS
      }
      setScore(prev => {
        const newScore = prev + points
        scoreRef.current = newScore
        return newScore
      })
      setFeedback('correct')
    } else {
      setFeedback('wrong')
    }

    feedbackTimerRef.current = setTimeout(() => {
      const nextQuestion = currentQuestion + 1
      if (nextQuestion >= questions.length) {
        onComplete(scoreRef.current)
      } else {
        setCurrentQuestion(nextQuestion)
        setFeedback(null)
        setSelectedOption(null)
        isProcessing.current = false
      }
    }, 800)
  }, [feedback, questions, currentQuestion, settings.pointsPerCorrect, onComplete])

  const question = questions[currentQuestion]
  if (!question) return null

  return (
    <div className="game-area">
      <div className="game-stats">
        <div className="game-stat">
          <div className="game-stat-value pattern-progress">
            {currentQuestion + 1} / {questions.length}
          </div>
          <div className="game-stat-label">题目</div>
        </div>
        <div className="game-stat">
          <div className="game-stat-value pattern-score">{score}</div>
          <div className="game-stat-label">得分</div>
        </div>
      </div>

      <div
        className="pattern-sequence"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          margin: '24px 0',
          padding: '8px 4px',
        }}
      >
        {question.sequence.map((item, index) => (
          <div
            key={index}
            className="pattern-cell"
            style={{
              width: 48,
              height: 48,
              minWidth: 48,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '2px solid var(--border, #ccc)',
              borderRadius: 8,
              fontSize: item.length > 4 ? '0.75rem' : '1.15rem',
              backgroundColor: 'var(--surface, #fff)',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {item}
          </div>
        ))}
        <div
          className="pattern-cell pattern-question-mark"
          style={{
            width: 48,
            height: 48,
            minWidth: 48,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '2px dashed var(--accent, #3498db)',
            borderRadius: 8,
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: 'var(--accent, #3498db)',
            backgroundColor: 'var(--surface, #fff)',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          ?
        </div>
      </div>

      {feedback && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            marginBottom: 12,
            color: feedback === 'correct' ? 'var(--success, #2ecc71)' : 'var(--error, #e74c3c)',
          }}
        >
          {feedback === 'correct' ? '正确!' : '错误!'}
        </div>
      )}

      <div
        className="pattern-options"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        {question.options.map((option, index) => {
          let optionStyle: React.CSSProperties = {
            padding: '16px 12px',
            fontSize: option.length > 4 ? '1rem' : '1.4rem',
            border: '2px solid var(--border, #ccc)',
            borderRadius: 8,
            cursor: feedback !== null ? 'default' : 'pointer',
            backgroundColor: 'var(--surface, #fff)',
            transition: 'all 0.15s ease',
            userSelect: 'none',
          }

          if (feedback !== null) {
            if (index === question.correctIndex) {
              optionStyle = {
                ...optionStyle,
                borderColor: 'var(--success, #2ecc71)',
                backgroundColor: 'rgba(46, 204, 113, 0.15)',
              }
            } else if (index === selectedOption && feedback === 'wrong') {
              optionStyle = {
                ...optionStyle,
                borderColor: 'var(--error, #e74c3c)',
                backgroundColor: 'rgba(231, 76, 60, 0.15)',
              }
            }
          }

          return (
            <button
              key={index}
              className="pattern-option"
              disabled={feedback !== null}
              onClick={() => handleOptionClick(index)}
              style={optionStyle}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

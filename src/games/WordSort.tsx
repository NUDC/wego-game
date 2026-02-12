import { useState, useEffect, useCallback, useRef } from 'react'

interface Props {
  difficulty: 'easy' | 'normal' | 'hard'
  onComplete: (score: number) => void
}

interface WordItem {
  text: string
  category: string
}

const WORD_BANK: Record<string, string[]> = {
  '健康饮食': ['深海鱼', '核桃', '蓝莓', '绿叶蔬菜', '全谷物', '橄榄油', '三文鱼', '牛油果'],
  '运动锻炼': ['散步', '太极拳', '游泳', '广场舞', '瑜伽', '骑行', '慢跑', '爬山'],
  '认知训练': ['下棋', '阅读', '学外语', '拼图', '书法', '数独', '弹琴', '编织'],
  '社交活动': ['聚会', '志愿服务', '兴趣小组', '家庭聚餐', '社区活动', '旅行', '合唱团', '跳舞'],
  '情绪管理': ['冥想', '深呼吸', '听音乐', '写日记', '园艺', '绘画', '宠物陪伴', '正念练习'],
  '睡眠健康': ['规律作息', '午休', '避免咖啡因', '睡前放松', '安静环境', '热水泡脚', '远离手机', '适宜温度'],
}

const DIFFICULTY_SETTINGS = {
  easy:   { categoryCount: 2, wordsPerCategory: 6, timeLimit: null },
  normal: { categoryCount: 3, wordsPerCategory: 6, timeLimit: 90 },
  hard:   { categoryCount: 4, wordsPerCategory: 6, timeLimit: 60 },
} as const

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function initGame(categoryCount: number, wordsPerCategory: number) {
  const allCategories = Object.keys(WORD_BANK)
  const selectedCategories = shuffle(allCategories).slice(0, categoryCount)

  const words: WordItem[] = []
  for (const category of selectedCategories) {
    const selectedWords = shuffle(WORD_BANK[category]).slice(0, wordsPerCategory)
    for (const text of selectedWords) {
      words.push({ text, category })
    }
  }

  return {
    categories: selectedCategories,
    words: shuffle(words),
  }
}

export default function WordSort({ difficulty, onComplete }: Props) {
  const settings = DIFFICULTY_SETTINGS[difficulty]

  const [gameState] = useState(() => initGame(settings.categoryCount, settings.wordsPerCategory))
  const gameCategories = gameState.categories
  const gameWords = gameState.words

  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'wrong'
    correctCategory?: string
    selectedCategory?: string
  } | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(settings.timeLimit)
  const [gameOver, setGameOver] = useState(false)

  const isProcessing = useRef(false)
  const gameOverRef = useRef(false)
  const completedRef = useRef(false)

  const totalCount = gameWords.length

  // Timer countdown for normal and hard modes
  useEffect(() => {
    if (timeLeft === null || gameOverRef.current) return

    if (timeLeft <= 0) {
      gameOverRef.current = true
      setGameOver(true)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft])

  // Handle game over from timer
  useEffect(() => {
    if (timeLeft === 0 && !gameOverRef.current) {
      gameOverRef.current = true
      setGameOver(true)
    }
  }, [timeLeft])

  // Call onComplete when game is over
  useEffect(() => {
    if (gameOver && !completedRef.current) {
      completedRef.current = true
      onComplete(Math.max(0, score))
    }
  }, [gameOver, score, onComplete])

  const advanceToNext = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= totalCount) {
      gameOverRef.current = true
      setGameOver(true)
    } else {
      setCurrentIndex(nextIndex)
    }
  }, [currentIndex, totalCount])

  const handleCategoryClick = useCallback((selectedCategory: string) => {
    if (isProcessing.current || gameOverRef.current || gameOver) return
    if (currentIndex >= totalCount) return

    isProcessing.current = true
    const currentWord = gameWords[currentIndex]
    const isCorrect = selectedCategory === currentWord.category

    if (isCorrect) {
      const newStreak = streak + 1
      let points = 10
      if (newStreak >= 3 && newStreak % 3 === 0) {
        points += 15
      }

      setScore(prev => prev + points)
      setStreak(newStreak)
      setCorrectCount(prev => prev + 1)
      setFeedback({ type: 'correct', selectedCategory })

      setTimeout(() => {
        setFeedback(null)
        advanceToNext()
        isProcessing.current = false
      }, 400)
    } else {
      setScore(prev => prev - 5)
      setStreak(0)
      setFeedback({
        type: 'wrong',
        correctCategory: currentWord.category,
        selectedCategory,
      })

      setTimeout(() => {
        setFeedback(null)
        advanceToNext()
        isProcessing.current = false
      }, 600)
    }
  }, [currentIndex, totalCount, gameWords, streak, gameOver, advanceToNext])

  if (gameOver) {
    return null
  }

  const currentWord = currentIndex < totalCount ? gameWords[currentIndex] : null

  return (
    <div className="game-area">
      <div className="game-stats">
        <div className="game-stat">
          <div className="game-stat-value">{score}</div>
          <div className="game-stat-label">得分</div>
        </div>
        <div className="game-stat">
          <div className="game-stat-value">{currentIndex + 1}/{totalCount}</div>
          <div className="game-stat-label">进度</div>
        </div>
        {timeLeft !== null && (
          <div className="game-stat">
            <div className="game-stat-value" style={{ color: timeLeft <= 10 ? 'var(--error)' : undefined }}>
              {timeLeft}s
            </div>
            <div className="game-stat-label">时间</div>
          </div>
        )}
        <div className="game-stat">
          <div className="game-stat-value" style={{ color: streak >= 3 ? 'var(--accent)' : undefined }}>
            {streak}
          </div>
          <div className="game-stat-label">连对</div>
        </div>
      </div>

      {currentWord && (
        <div className="wordsort-word" key={currentIndex}>
          {currentWord.text}
        </div>
      )}

      <div
        className="wordsort-categories"
        style={{ gridTemplateColumns: gameCategories.length <= 2 ? '1fr' : '1fr 1fr' }}
      >
        {gameCategories.map(category => {
          let className = 'wordsort-category'
          if (feedback) {
            if (feedback.type === 'correct' && feedback.selectedCategory === category) {
              className += ' correct'
            }
            if (feedback.type === 'wrong') {
              if (feedback.selectedCategory === category) {
                className += ' wrong'
              }
              if (feedback.correctCategory === category) {
                className += ' correct'
              }
            }
          }

          return (
            <button
              key={category}
              className={className}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          )
        })}
      </div>

      <div className="wordsort-progress">
        正确率: {currentIndex > 0 ? Math.round((correctCount / currentIndex) * 100) : 0}%
      </div>
    </div>
  )
}

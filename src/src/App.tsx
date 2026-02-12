import { useState, useCallback } from 'react'
import MainMenu from './components/MainMenu'
import GameWrapper from './components/GameWrapper'
import ResultPage from './components/ResultPage'
import TrainingHistory from './components/TrainingHistory'
import { GameId, Difficulty, Scores, Page } from './types'
import { loadBestScores, saveBestScore, saveRecord, loadRecords } from './utils/storage'

export default function App() {
  const [page, setPage] = useState<Page>('menu')
  const [currentGame, setCurrentGame] = useState<GameId | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [bestScores, setBestScores] = useState(loadBestScores)
  const [scores, setScores] = useState<Scores>(() => {
    // 用 bestScores 恢复已完成状态，避免刷新后丢失
    const initial = loadBestScores()
    return {
      memory: initial.memory !== null && initial.memory > 0 ? initial.memory : null,
      schulte: initial.schulte !== null && initial.schulte > 0 ? initial.schulte : null,
      stroop: initial.stroop !== null && initial.stroop > 0 ? initial.stroop : null,
      wordSort: initial.wordSort !== null && initial.wordSort > 0 ? initial.wordSort : null,
      pathMemory: initial.pathMemory !== null && initial.pathMemory > 0 ? initial.pathMemory : null,
      reaction: initial.reaction !== null && initial.reaction > 0 ? initial.reaction : null,
      digitSpan: initial.digitSpan !== null && initial.digitSpan > 0 ? initial.digitSpan : null,
      arithmetic: initial.arithmetic !== null && initial.arithmetic > 0 ? initial.arithmetic : null,
      patternReason: initial.patternReason !== null && initial.patternReason > 0 ? initial.patternReason : null,
    }
  })
  const [recordCount, setRecordCount] = useState(() => loadRecords().length)

  const startGame = useCallback((gameId: GameId, diff: Difficulty) => {
    setCurrentGame(gameId)
    setDifficulty(diff)
    setPage('game')
  }, [])

  const finishGame = useCallback((gameId: GameId, score: number) => {
    setScores(prev => ({ ...prev, [gameId]: score }))
    saveBestScore(gameId, score)
    saveRecord(gameId, difficulty, score)
    setBestScores(loadBestScores())
    setRecordCount(loadRecords().length)
    setPage('menu')
  }, [difficulty])

  const showResult = useCallback(() => {
    setPage('result')
  }, [])

  const showHistory = useCallback(() => {
    setPage('history')
  }, [])

  const backToMenu = useCallback(() => {
    setPage('menu')
  }, [])

  if (page === 'game' && currentGame) {
    return (
      <GameWrapper
        gameId={currentGame}
        difficulty={difficulty}
        onFinish={(score) => finishGame(currentGame, score)}
        onBack={backToMenu}
      />
    )
  }

  if (page === 'result') {
    return <ResultPage scores={scores} onBack={backToMenu} />
  }

  if (page === 'history') {
    return <TrainingHistory onBack={backToMenu} />
  }

  return (
    <MainMenu
      scores={scores}
      bestScores={bestScores}
      recordCount={recordCount}
      onStartGame={startGame}
      onShowResult={showResult}
      onShowHistory={showHistory}
    />
  )
}

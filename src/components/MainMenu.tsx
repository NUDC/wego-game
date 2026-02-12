import { useState } from 'react'
import { GameId, Difficulty, Scores, GAMES } from '../types'
import { gameIntros, knowledgeCards } from '../data/knowledge'
import DifficultySelect from './DifficultySelect'

interface MainMenuProps {
  scores: Scores
  bestScores: Scores
  recordCount: number
  onStartGame: (gameId: GameId, difficulty: Difficulty) => void
  onShowResult: () => void
  onShowHistory: () => void
}

export default function MainMenu({ scores, bestScores, recordCount, onStartGame, onShowResult, onShowHistory }: MainMenuProps) {
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null)
  const [introGame, setIntroGame] = useState<GameId | null>(null)
  const [showAbout, setShowAbout] = useState(false)

  const allCompleted = GAMES.every((game) => scores[game.id] !== null)

  const selectedGameConfig = selectedGame
    ? GAMES.find((g) => g.id === selectedGame)
    : null

  const introGameConfig = introGame
    ? GAMES.find((g) => g.id === introGame)
    : null

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    if (selectedGame) {
      onStartGame(selectedGame, difficulty)
      setSelectedGame(null)
    }
  }

  return (
    <div className="app-container">
      {/* 页头 */}
      <div className="site-header">
        <div className="site-header-inner">
          <span className="site-header-icon">🧠</span>
          <div>
            <div className="site-header-title">认知乐园</div>
            <div className="site-header-sub">脑力训练科普游戏</div>
          </div>
        </div>
        <div className="site-header-actions">
          <button className="site-header-btn" onClick={() => setShowAbout(true)}>
            <span>关于</span>
          </button>
          <button className="site-header-btn" onClick={onShowHistory}>
            <span>📋 记录</span>
            {recordCount > 0 && <span className="badge-dot">{recordCount}</span>}
          </button>
        </div>
      </div>

      {/* 游戏卡片 */}
      <div className="game-grid">
        {GAMES.map((game) => {
          const best = bestScores[game.id]
          const done = scores[game.id] !== null
          return (
            <div
              key={game.id}
              className={`game-card${done ? ' game-card-done' : ''}`}
              onClick={() => setSelectedGame(game.id)}
              style={{ borderColor: done ? game.color : undefined }}
            >
              <div className="game-card-icon">{game.icon}</div>
              <div className="game-card-name">{game.name}</div>
              <div
                className="game-card-domain"
                style={{ backgroundColor: game.color, color: 'white' }}
              >
                {game.domain}
              </div>
              <div className="game-card-desc">{game.description}</div>
              {best !== null && best > 0 && (
                <div className="game-card-best" style={{ color: game.color }}>
                  ★ {best}分
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 认知画像提示 */}
      <div className="radar-prompt">
        {allCompleted ? (
          <button className="radar-prompt-ready" onClick={onShowResult}>
            <span className="radar-prompt-icon">📊</span>
            <div className="radar-prompt-text">
              <strong>认知画像已生成</strong>
              <span>点击查看你的九维认知能力雷达图</span>
            </div>
            <span className="radar-prompt-arrow">→</span>
          </button>
        ) : (
          <div className="radar-prompt-pending">
            <span className="radar-prompt-icon">📊</span>
            <div className="radar-prompt-text">
              <strong>完成全部 {GAMES.length} 项训练，解锁认知画像</strong>
              <span>生成你的九维认知能力雷达图</span>
            </div>
            <span className="radar-prompt-progress">{GAMES.filter(g => scores[g.id] !== null).length}/{GAMES.length}</span>
          </div>
        )}
      </div>

      {/* 页脚 */}
      <div className="site-footer">
        <div className="site-footer-tagline">2026 中国康复医学会认知科普大赛参赛作品 · 闭老师小组</div>
        <div className="site-footer-version">v{APP_VERSION}</div>
      </div>

      {selectedGameConfig && (
        <DifficultySelect
          gameName={selectedGameConfig.name}
          gameIcon={selectedGameConfig.icon}
          howToPlay={selectedGameConfig.howToPlay}
          onSelect={handleSelectDifficulty}
          onClose={() => setSelectedGame(null)}
          onShowIntro={() => {
            setIntroGame(selectedGame)
          }}
        />
      )}

      {introGameConfig && introGame && (
        <div className="intro-overlay" onClick={() => setIntroGame(null)}>
          <div className="intro-modal" onClick={(e) => e.stopPropagation()}>
            <div className="intro-header">
              <span className="intro-header-icon">{introGameConfig.icon}</span>
              <div>
                <h3>{introGameConfig.name}</h3>
                <span className="intro-header-domain" style={{ backgroundColor: introGameConfig.color, color: 'white' }}>
                  {introGameConfig.domain}
                </span>
              </div>
            </div>
            <div className="intro-modal-body">
              <div className="intro-section">
                <div className="intro-section-label">认知科普</div>
                <p>{gameIntros[introGame].content}</p>
              </div>
              <div className="intro-section">
                <div className="intro-section-label">健康贴士</div>
                <div className="intro-tips">
                  {knowledgeCards[introGame].map((card) => (
                    <div key={card.id} className="intro-tip">
                      <div className="intro-tip-title">{card.title}</div>
                      <div className="intro-tip-content">{card.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setIntroGame(null)}>
              知道了
            </button>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="intro-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-modal" onClick={(e) => e.stopPropagation()}>
            <div className="about-badge">参赛作品</div>
            <h3>认知乐园</h3>
            <p className="about-subtitle">脑力训练科普游戏</p>
            <div className="about-modal-body">
              <div className="about-section">
                <div className="about-label">参赛信息</div>
                <p>2026 中国康复医学会认知障碍康复专业委员会第一届认知科普大赛 · 跨界融合组</p>
              </div>
              <div className="about-section">
                <div className="about-label">参赛小组</div>
                <p>闭老师小组</p>
              </div>
              <div className="about-section">
                <div className="about-label">作品简介</div>
                <p>"认知乐园"是一款面向全年龄公众的认知训练科普 Web 应用。包含 {GAMES.length} 个小游戏，覆盖 9 大认知功能域，每个游戏基于临床循证的认知评估/训练范式改编，兼具科学性与趣味性。完成全部游戏后生成个人"认知能力画像"（九维雷达图）。</p>
              </div>
              <div className="about-section">
                <div className="about-label">游戏与临床原型</div>
                <table className="about-table">
                  <thead><tr><th>游戏</th><th>认知域</th><th>临床原型</th></tr></thead>
                  <tbody>
                    <tr><td>记忆翻翻乐</td><td>记忆力</td><td>配对记忆任务</td></tr>
                    <tr><td>舒尔特方格</td><td>注意力</td><td>Schulte Grid</td></tr>
                    <tr><td>颜色词挑战</td><td>执行功能</td><td>Stroop 色词测验</td></tr>
                    <tr><td>词语分类</td><td>语言能力</td><td>语义分类任务</td></tr>
                    <tr><td>路径记忆</td><td>视空间</td><td>Corsi Block Task</td></tr>
                    <tr><td>闪电反应</td><td>处理速度</td><td>简单反应时测试</td></tr>
                    <tr><td>数字倒背</td><td>工作记忆</td><td>数字广度倒背测验</td></tr>
                    <tr><td>心算挑战</td><td>计算能力</td><td>限时心算任务</td></tr>
                    <tr><td>图形推理</td><td>推理判断</td><td>类 Raven 矩阵推理</td></tr>
                  </tbody>
                </table>
                <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>每个游戏提供 3 个难度等级（简单/普通/困难），适配儿童到老年人。</p>
              </div>
              <div className="about-section">
                <div className="about-label">设计理念</div>
                <p>适老化设计，大字体、高对比度、简单交互；三级难度适配全年龄人群；游戏中融入认知康复科普知识，实现"玩中学、学中练"。</p>
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setShowAbout(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

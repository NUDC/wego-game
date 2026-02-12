import { useState } from 'react'
import { GAMES, GameId } from '../types'
import { loadRecords, clearRecords, TrainingRecord } from '../utils/storage'

interface Props {
  onBack: () => void
}

const DIFFICULTY_LABELS = { easy: '简单', normal: '普通', hard: '困难' } as const
const GAME_MAP = Object.fromEntries(GAMES.map(g => [g.id, g])) as Record<GameId, typeof GAMES[number]>

function formatTime(ts: number): string {
  const d = new Date(ts)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${h}:${m}`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default function TrainingHistory({ onBack }: Props) {
  const [records] = useState(() => loadRecords().slice().reverse())
  const [filter, setFilter] = useState<GameId | 'all'>('all')
  const [showConfirm, setShowConfirm] = useState(false)

  const filtered = filter === 'all' ? records : records.filter(r => r.gameId === filter)

  // 按日期分组
  const grouped: Record<string, TrainingRecord[]> = {}
  for (const r of filtered) {
    const key = formatDate(r.timestamp)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(r)
  }

  // 统计
  const totalGames = records.length
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayCount = records.filter(r => r.timestamp >= todayStart.getTime()).length
  const avgScore = totalGames > 0
    ? Math.round(records.reduce((s, r) => s + r.score, 0) / totalGames)
    : 0

  const handleClear = () => {
    clearRecords()
    setShowConfirm(false)
    onBack()
  }

  return (
    <div className="app-container">
      <div className="game-header">
        <div className="game-header-left">
          <button className="game-back-btn" onClick={onBack}>←</button>
          <span className="game-title">训练记录</span>
        </div>
        {totalGames > 0 && (
          <button className="history-clear-btn" onClick={() => setShowConfirm(true)}>
            清除
          </button>
        )}
      </div>

      {/* 统计摘要 */}
      <div className="history-stats">
        <div className="history-stat-item">
          <div className="history-stat-value">{totalGames}</div>
          <div className="history-stat-label">总训练</div>
        </div>
        <div className="history-stat-item">
          <div className="history-stat-value">{todayCount}</div>
          <div className="history-stat-label">今日</div>
        </div>
        <div className="history-stat-item">
          <div className="history-stat-value">{avgScore}</div>
          <div className="history-stat-label">平均分</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="history-filters">
        <button
          className={`history-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        {GAMES.map(g => (
          <button
            key={g.id}
            className={`history-filter-btn ${filter === g.id ? 'active' : ''}`}
            style={filter === g.id ? { background: g.color, borderColor: g.color } : undefined}
            onClick={() => setFilter(g.id)}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>

      {/* 记录列表 */}
      {filtered.length === 0 ? (
        <div className="history-empty">
          <p>暂无训练记录</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>完成游戏后，记录将自动保存在这里</p>
        </div>
      ) : (
        <div className="history-list">
          {Object.entries(grouped).map(([date, dayRecords]) => (
            <div key={date} className="history-day-group">
              <div className="history-day-header">{date}</div>
              {dayRecords.map((r, i) => {
                const game = GAME_MAP[r.gameId]
                return (
                  <div key={i} className="history-record-item">
                    <div className="history-record-icon" style={{ background: game.color }}>
                      {game.icon}
                    </div>
                    <div className="history-record-info">
                      <div className="history-record-name">{game.name}</div>
                      <div className="history-record-meta">
                        {DIFFICULTY_LABELS[r.difficulty]} · {formatTime(r.timestamp)}
                      </div>
                    </div>
                    <div className="history-record-score">{r.score}分</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* 确认弹窗 */}
      {showConfirm && (
        <div className="difficulty-overlay" onClick={() => setShowConfirm(false)}>
          <div className="difficulty-modal" onClick={e => e.stopPropagation()}>
            <h3>确认清除</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>
              将清除所有训练记录和最高分，此操作不可撤销。
            </p>
            <div className="game-over-buttons">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>取消</button>
              <button className="btn btn-primary" style={{ background: 'var(--error)' }} onClick={handleClear}>
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

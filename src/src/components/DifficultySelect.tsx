import { Difficulty } from '../types'

interface DifficultySelectProps {
  gameName: string
  gameIcon: string
  howToPlay: string
  onSelect: (difficulty: Difficulty) => void
  onClose: () => void
}

export default function DifficultySelect({ gameName, gameIcon, howToPlay, onSelect, onClose }: DifficultySelectProps) {
  return (
    <div className="difficulty-overlay" onClick={onClose}>
      <div className="difficulty-modal" onClick={(e) => e.stopPropagation()}>
        <div className="difficulty-header">
          <span className="difficulty-header-icon">{gameIcon}</span>
          <h3>{gameName}</h3>
        </div>
        <div className="difficulty-howto">{howToPlay}</div>
        <div className="difficulty-options">
          <button className="difficulty-btn" onClick={() => onSelect('easy')}>
            <strong>简单</strong>
            <span>适合初次体验</span>
          </button>
          <button className="difficulty-btn" onClick={() => onSelect('normal')}>
            <strong>普通</strong>
            <span>推荐大多数人</span>
          </button>
          <button className="difficulty-btn" onClick={() => onSelect('hard')}>
            <strong>困难</strong>
            <span>挑战你的极限</span>
          </button>
        </div>
        <button className="btn btn-outline btn-block" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  )
}

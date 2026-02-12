import React, { useRef, useEffect } from 'react'

interface Props {
  scores: {
    memory: number
    schulte: number
    stroop: number
    wordSort: number
    pathMemory: number
    reaction: number
    digitSpan: number
    arithmetic: number
    patternReason: number
  }
}

const DIMENSIONS = [
  { key: 'memory', label: '记忆力', color: '#9B59B6' },
  { key: 'schulte', label: '注意力', color: '#3498DB' },
  { key: 'stroop', label: '执行功能', color: '#E74C3C' },
  { key: 'wordSort', label: '语言能力', color: '#2ECC71' },
  { key: 'pathMemory', label: '视空间', color: '#F39C12' },
  { key: 'reaction', label: '处理速度', color: '#E67E22' },
  { key: 'digitSpan', label: '工作记忆', color: '#1ABC9C' },
  { key: 'arithmetic', label: '计算能力', color: '#8E44AD' },
  { key: 'patternReason', label: '推理判断', color: '#2C3E50' },
] as const

const N = DIMENSIONS.length
const SIZE = 460
const CX = 230
const CY = 230
const MAX_RADIUS = 120
const GRID_LEVELS = [0.25, 0.5, 0.75, 1.0]
const FONT_FAMILY = '-apple-system, "Microsoft YaHei", sans-serif'

function getVertex(index: number, radius: number): [number, number] {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / N
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)]
}

const RadarChart: React.FC<Props> = ({ scores }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    canvas.style.width = `${SIZE}px`
    canvas.style.height = `${SIZE}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, SIZE, SIZE)

    // Draw concentric polygons (grid)
    for (const level of GRID_LEVELS) {
      const r = MAX_RADIUS * level
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const [x, y] = getVertex(i, r)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.strokeStyle = '#D5D8DC'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw axis lines from center to each outer vertex
    for (let i = 0; i < N; i++) {
      const [x, y] = getVertex(i, MAX_RADIUS)
      ctx.beginPath()
      ctx.moveTo(CX, CY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = '#D5D8DC'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Compute data vertices
    const scoreValues = DIMENSIONS.map(
      (dim) => scores[dim.key as keyof typeof scores] ?? 0
    )
    const dataVertices = scoreValues.map((score, i) => {
      const clamped = Math.max(0, Math.min(100, score))
      const r = (clamped / 100) * MAX_RADIUS
      return getVertex(i, r)
    })

    // Draw data polygon fill
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const [x, y] = dataVertices[i]
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(74, 144, 217, 0.25)'
    ctx.fill()

    // Draw data polygon stroke
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const [x, y] = dataVertices[i]
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.strokeStyle = '#4A90D9'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Draw dots at each data vertex
    for (let i = 0; i < N; i++) {
      const [x, y] = dataVertices[i]
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = DIMENSIONS[i].color
      ctx.fill()
    }

    // Draw labels at each outer vertex
    for (let i = 0; i < N; i++) {
      const dim = DIMENSIONS[i]
      const score = Math.round(Math.max(0, Math.min(100, scoreValues[i])))
      const [vx, vy] = getVertex(i, MAX_RADIUS)

      const offsetDistance = 34
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / N
      const lx = vx + offsetDistance * Math.cos(angle)
      const ly = vy + offsetDistance * Math.sin(angle)

      const dx = lx - CX
      const dy = ly - CY

      let textAlign: CanvasTextAlign = 'center'
      if (dx > 10) textAlign = 'left'
      else if (dx < -10) textAlign = 'right'

      let textBaseline: CanvasTextBaseline = 'middle'
      if (dy < -10) textBaseline = 'bottom'
      else if (dy > 10) textBaseline = 'top'

      ctx.textAlign = textAlign
      ctx.textBaseline = textBaseline

      // Draw label name
      ctx.font = `13px ${FONT_FAMILY}`
      ctx.fillStyle = dim.color
      ctx.fillText(dim.label, lx, ly)

      // Draw score below label
      const scoreOffsetY = textBaseline === 'bottom' ? -15 : 15
      ctx.font = `bold 13px ${FONT_FAMILY}`
      ctx.fillStyle = dim.color
      ctx.fillText(String(score), lx, ly + scoreOffsetY)
    }
  }, [scores])

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        className="radar-canvas"
      />
    </div>
  )
}

export default RadarChart

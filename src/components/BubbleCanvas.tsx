import { useRef, useEffect, useCallback, useState } from 'react'
import { useBubbleStore } from '@/stores/bubbleStore'
import type { Bubble } from '@/stores/bubbleStore'

export default function BubbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    bubbles,
    relations,
    extensions,
    selectedBubbleId,
    selectBubble,
    moveBubble,
    viewport,
    setViewport,
    filterTag,
    canvasMode,
  } = useBubbleStore()

  const [dragging, setDragging] = useState<string | null>(null)
  const [panning, setPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [editingBubble, setEditingBubble] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [canvasSize, setCanvasSize] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1000, h: typeof window !== 'undefined' ? window.innerHeight : 800 })
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const animRef = useRef<number>(0)

  const filteredBubbles = filterTag === '__untagged__'
    ? bubbles.filter((b) => !b.tag)
    : filterTag
    ? bubbles.filter((b) => b.tag === filterTag)
    : bubbles

  const filteredRelations = relations.filter(
    (r) => filteredBubbles.some((b) => b.id === r.sourceId) && filteredBubbles.some((b) => b.id === r.targetId)
  )

  const worldToScreen = useCallback(
    (wx: number, wy: number) => ({
      x: (wx - viewport.x) * viewport.zoom + canvasSize.w / 2,
      y: (wy - viewport.y) * viewport.zoom + canvasSize.h / 2,
    }),
    [viewport, canvasSize]
  )

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - canvasSize.w / 2) / viewport.zoom + viewport.x,
      y: (sy - canvasSize.h / 2) / viewport.zoom + viewport.y,
    }),
    [viewport, canvasSize]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ w: width, h: height })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.w * dpr
    canvas.height = canvasSize.h * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#fbf9f8'
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h)

    // 绘制网格
    ctx.strokeStyle = '#e4e2e1'
    ctx.lineWidth = 1
    const gridSize = 40 * viewport.zoom
    const offsetX = (-viewport.x * viewport.zoom + canvasSize.w / 2) % gridSize
    const offsetY = (-viewport.y * viewport.zoom + canvasSize.h / 2) % gridSize
    for (let x = offsetX; x < canvasSize.w; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasSize.h)
      ctx.stroke()
    }
    for (let y = offsetY; y < canvasSize.h; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasSize.w, y)
      ctx.stroke()
    }

    // 绘制关系线
    filteredRelations.forEach((rel) => {
      const source = filteredBubbles.find((b) => b.id === rel.sourceId)
      const target = filteredBubbles.find((b) => b.id === rel.targetId)
      if (!source || !target) return

      const sp = worldToScreen(source.x, source.y)
      const tp = worldToScreen(target.x, target.y)

      ctx.beginPath()
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = rel.type === 'contradictory' ? 'rgba(186, 26, 26, 0.4)' : rel.type === 'duplicate' ? 'rgba(121, 89, 0, 0.4)' : 'rgba(36, 106, 82, 0.3)'
      ctx.lineWidth = 2
      ctx.moveTo(sp.x, sp.y)
      ctx.lineTo(tp.x, tp.y)
      ctx.stroke()
      ctx.setLineDash([])
    })

    // 绘制气泡
    filteredBubbles.forEach((bubble) => {
      if (!bubble) return
      const pos = worldToScreen(bubble.x || 0, bubble.y || 0)
      if (isNaN(pos.x) || isNaN(pos.y)) return

      const isSelected = bubble.id === selectedBubbleId
      const isDragging = bubble.id === dragging
      const isInSelection = selectedIds.has(bubble.id)
      const bubbleExts = extensions.filter((e) => e.bubbleId === bubble.id)

      ctx.save()
      ctx.translate(pos.x, pos.y)

      const fontSize = 13 * viewport.zoom
      ctx.font = `${fontSize}px "Inter", "Noto Sans SC", sans-serif`
      const textWidth = ctx.measureText(bubble.content).width
      const padding = 16 * viewport.zoom
      const bubbleWidth = Math.max(textWidth + padding * 2, 80 * viewport.zoom)
      let bubbleHeight = 40 * viewport.zoom

      if (bubbleExts.length > 0) {
        bubbleHeight += bubbleExts.length * 14 * viewport.zoom + 4 * viewport.zoom
      }

      const radius = 16 * viewport.zoom

      if (isSelected || isDragging || isInSelection) {
        ctx.shadowColor = 'rgba(36, 106, 82, 0.3)'
        ctx.shadowBlur = 25
      }

      // 兼容性更好的圆角矩形绘制
      const x = -bubbleWidth / 2
      const y = -bubbleHeight / 2
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + bubbleWidth - radius, y)
      ctx.quadraticCurveTo(x + bubbleWidth, y, x + bubbleWidth, y + radius)
      ctx.lineTo(x + bubbleWidth, y + bubbleHeight - radius)
      ctx.quadraticCurveTo(x + bubbleWidth, y + bubbleHeight, x + bubbleWidth - radius, y + bubbleHeight)
      ctx.lineTo(x + radius, y + bubbleHeight)
      ctx.quadraticCurveTo(x, y + bubbleHeight, x, y + bubbleHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(-bubbleWidth / 2, 0, bubbleWidth / 2, 0)
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(1, '#f0faf5')
      ctx.fillStyle = gradient
      ctx.fill()

      if (isInSelection) {
        ctx.strokeStyle = '#246a52'
        ctx.lineWidth = 3
      } else {
        ctx.strokeStyle = isSelected ? '#246a52' : 'rgba(36, 106, 82, 0.6)'
        ctx.lineWidth = isSelected ? 3 : 1.5
      }
      ctx.stroke()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0

      ctx.fillStyle = '#1b1c1c'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const maxTextWidth = bubbleWidth - padding
      let displayText = bubble.content
      if (ctx.measureText(displayText).width > maxTextWidth) {
        while (ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1)
        }
        displayText += '...'
      }
      ctx.fillText(displayText, 0, -bubbleHeight / 2 + 20 * viewport.zoom)

      if (bubble.tag) {
        const tagFontSize = 9 * viewport.zoom
        ctx.font = `${tagFontSize}px "JetBrains Mono", monospace`
        const tagWidth = ctx.measureText(bubble.tag).width + 8 * viewport.zoom
        const tagHeight = 14 * viewport.zoom
        const tagX = -tagWidth / 2
        const tagY = -bubbleHeight / 2 - tagHeight - 2 * viewport.zoom
        const tr = 4 * viewport.zoom

        ctx.beginPath()
        ctx.moveTo(tagX + tr, tagY)
        ctx.lineTo(tagX + tagWidth - tr, tagY)
        ctx.quadraticCurveTo(tagX + tagWidth, tagY, tagX + tagWidth, tagY + tr)
        ctx.lineTo(tagX + tagWidth, tagY + tagHeight - tr)
        ctx.quadraticCurveTo(tagX + tagWidth, tagY + tagHeight, tagX + tagWidth - tr, tagY + tagHeight)
        ctx.lineTo(tagX + tr, tagY + tagHeight)
        ctx.quadraticCurveTo(tagX, tagY + tagHeight, tagX, tagY + tagHeight - tr)
        ctx.lineTo(tagX, tagY + tr)
        ctx.quadraticCurveTo(tagX, tagY, tagX + tr, tagY)
        ctx.closePath()
        
        ctx.fillStyle = 'rgba(170, 240, 209, 0.3)'
        ctx.fill()

        ctx.fillStyle = '#246a52'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(bubble.tag, 0, tagY + tagHeight / 2)
      }

      if (bubbleExts.length > 0) {
        const extFontSize = 10 * viewport.zoom
        ctx.font = `${extFontSize}px "Inter", sans-serif`
        ctx.fillStyle = '#6f7973'
        ctx.textAlign = 'left'
        const extStartY = -bubbleHeight / 2 + 36 * viewport.zoom
        bubbleExts.forEach((ext, idx) => {
          let extText = ext.content
          const maxExtWidth = bubbleWidth - padding * 1.5
          if (ctx.measureText(extText).width > maxExtWidth) {
            while (ctx.measureText(extText + '...').width > maxExtWidth && extText.length > 0) {
              extText = extText.slice(0, -1)
            }
            extText += '...'
          }
          ctx.fillText(`↳ ${extText}`, -bubbleWidth / 2 + padding * 0.75, extStartY + idx * 14 * viewport.zoom)
        })
      }

      ctx.restore()
    })

    if (selectionBox) {
      const sx = Math.min(selectionBox.startX, selectionBox.endX)
      const sy = Math.min(selectionBox.startY, selectionBox.endY)
      const sw = Math.abs(selectionBox.endX - selectionBox.startX)
      const sh = Math.abs(selectionBox.endY - selectionBox.startY)

      ctx.beginPath()
      ctx.rect(sx, sy, sw, sh)
      ctx.fillStyle = 'rgba(170, 240, 209, 0.1)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(36, 106, 82, 0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    animRef.current = requestAnimationFrame(drawCanvas)
  }, [filteredBubbles, filteredRelations, extensions, selectedBubbleId, selectedIds, viewport, canvasSize, dragging, worldToScreen, selectionBox])

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawCanvas)
    return () => cancelAnimationFrame(animRef.current)
  }, [drawCanvas])

  const findBubbleAt = useCallback(
    (sx: number, sy: number): Bubble | null => {
      const world = screenToWorld(sx, sy)
      for (let i = filteredBubbles.length - 1; i >= 0; i--) {
        const b = filteredBubbles[i]
        const fontSize = 13
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) continue
        ctx.font = `${fontSize}px "Inter", "Noto Sans SC", sans-serif`
        const textWidth = ctx.measureText(b.content).width
        const padding = 16
        const bw = Math.max(textWidth + padding * 2, 80) / 2
        const bh = 20

        if (Math.abs(world.x - b.x) < bw && Math.abs(world.y - b.y) < bh) {
          return b
        }
      }
      return null
    },
    [filteredBubbles, screenToWorld]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (canvasMode === 'pan') {
      setPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      return
    }

    if (canvasMode === 'edit') {
      const bubble = findBubbleAt(sx, sy)
      if (bubble) {
        selectBubble(bubble.id)
        setDragging(bubble.id)
      } else {
        selectBubble(null)
      }
      return
    }

    if (canvasMode === 'select') {
      const bubble = findBubbleAt(sx, sy)
      if (bubble) {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(bubble.id)) next.delete(bubble.id)
          else next.add(bubble.id)
          return next
        })
      } else {
        setSelectionBox({ startX: sx, startY: sy, endX: sx, endY: sy })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if (panning) {
      const dx = (e.clientX - panStart.x) / viewport.zoom
      const dy = (e.clientY - panStart.y) / viewport.zoom
      setViewport({ x: viewport.x - dx, y: viewport.y - dy })
      setPanStart({ x: e.clientX, y: e.clientY })
      return
    }

    if (dragging) {
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const world = screenToWorld(sx, sy)
      moveBubble(dragging, world.x, world.y)
      return
    }

    if (selectionBox) {
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      setSelectionBox((prev) => prev ? { ...prev, endX: sx, endY: sy } : null)
    }
  }

  const handleMouseUp = () => {
    if (selectionBox) {
      const sx1 = Math.min(selectionBox.startX, selectionBox.endX)
      const sy1 = Math.min(selectionBox.startY, selectionBox.endY)
      const sx2 = Math.max(selectionBox.startX, selectionBox.endX)
      const sy2 = Math.max(selectionBox.startY, selectionBox.endY)

      if (Math.abs(sx2 - sx1) > 5 && Math.abs(sy2 - sy1) > 5) {
        const newSelected = new Set(selectedIds)
        filteredBubbles.forEach((b) => {
          const pos = worldToScreen(b.x, b.y)
          if (pos.x >= sx1 && pos.x <= sx2 && pos.y >= sy1 && pos.y <= sy2) {
            newSelected.add(b.id)
          }
        })
        setSelectedIds(newSelected)
      }
      setSelectionBox(null)
    }

    setDragging(null)
    setPanning(false)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (canvasMode !== 'edit') return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const bubble = findBubbleAt(sx, sy)
    if (bubble) {
      setEditingBubble(bubble.id)
      setEditText(bubble.content)
    }
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(3, viewport.zoom * delta))
    setViewport({ zoom: newZoom })
  }, [viewport.zoom, setViewport])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingBubble) return
      if (e.key === 'v' || e.key === 'V') useBubbleStore.getState().setCanvasMode('pan')
      if (e.key === 'e' || e.key === 'E') useBubbleStore.getState().setCanvasMode('edit')
      if (e.key === 's' || e.key === 'S') useBubbleStore.getState().setCanvasMode('select')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingBubble])

  const handleEditSubmit = () => {
    if (editingBubble && editText.trim()) {
      useBubbleStore.getState().updateBubble(editingBubble, { content: editText.trim() })
    }
    setEditingBubble(null)
    setEditText('')
  }

  const cursorMap = {
    pan: 'cursor-grab',
    edit: 'cursor-default',
    select: 'cursor-crosshair',
  }

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${panning ? 'cursor-grabbing' : cursorMap[canvasMode]}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: canvasSize.w, height: canvasSize.h }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />

      {editingBubble && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="glass-panel p-3 flex items-center gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
              className="input-field text-sm min-w-[300px]"
              autoFocus
            />
            <button onClick={handleEditSubmit} className="btn-liquid text-[13px]">
              保存
            </button>
            <button
              onClick={() => { setEditingBubble(null); setEditText('') }}
              className="btn-ghost text-[13px]"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-[10px] text-on-surface-variant/50 font-mono">
        缩放: {(viewport.zoom * 100).toFixed(0)}% | 气泡: {filteredBubbles.length}
        {canvasMode === 'select' && selectedIds.size > 0 && ` | 已选: ${selectedIds.size}`}
      </div>
    </div>
  )
}

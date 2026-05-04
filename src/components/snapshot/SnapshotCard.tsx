import { AlertCircle, ChevronDown, ChevronUp, Eye, KeyRound, Layers3, RotateCcw, Trash2 } from 'lucide-react'
import { createFallbackCognition, type Snapshot } from '@/stores/snapshotStore'

interface SnapshotCardProps {
  snapshot: Snapshot
  expanded: boolean
  deep: boolean
  onToggleExpand: () => void
  onToggleDeep: () => void
  onRestore: () => void
  onDelete?: () => void
  formatTime: (iso: string) => string
  compact?: boolean
}

export default function SnapshotCard({
  snapshot,
  expanded,
  deep,
  onToggleExpand,
  onToggleDeep,
  onRestore,
  onDelete,
  formatTime,
  compact = false,
}: SnapshotCardProps) {
  const cognition = snapshot.cognition || createFallbackCognition(snapshot.canvasState.bubbles)
  const weightedBubbles = [...snapshot.canvasState.bubbles]
    .sort((a, b) => (b.interactionWeight || 0) - (a.interactionWeight || 0))

  return (
    <div className={`glass-panel ${compact ? 'p-3' : 'p-4'} hover:shadow-glass-hover transition-all group`}>
      <div className="flex items-start justify-between gap-4">
        <button onClick={onToggleExpand} className="flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] text-on-surface font-medium">{snapshot.name}</span>
            <span className="text-[11px] text-outline font-mono">{formatTime(snapshot.createdAt)}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container/20 text-primary">
              Level 1
            </span>
          </div>

          <div className="mt-2 text-[13px] text-on-surface leading-relaxed">
            {cognition.statusSnapshot}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {cognition.semanticAnchors.slice(0, 5).map((anchor) => (
              <span key={anchor.label} className="text-[11px] px-2 py-1 rounded-full bg-surface-container/70 text-on-surface-variant">
                {anchor.label}
              </span>
            ))}
          </div>

          <div className="flex gap-3 mt-3 text-[11px] text-on-surface-variant">
            <span>{snapshot.canvasState.bubbles.length} 气泡</span>
            <span>{snapshot.tagState.categories.length} 分类</span>
            <span>{snapshot.tagState.tags.length} 标签</span>
          </div>
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onRestore}
            className="w-8 h-8 rounded-full flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary-container/20 transition-all"
            title="恢复快照"
          >
            <RotateCcw size={14} />
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-full flex items-center justify-center text-error/40 hover:text-error hover:bg-error-container/20 transition-all"
              title="删除快照"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-all"
            title={expanded ? '收起' : '展开'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-4">
          <div className="rounded-xl bg-white/35 border border-outline-variant/20 p-3">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Layers3 size={13} />
              <span className="text-[12px] font-semibold tracking-wider">Level 2 逻辑脉络</span>
            </div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              {cognition.logicFlow}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/30 border border-outline-variant/20 p-3">
              <div className="flex items-center gap-2 mb-2 text-on-surface">
                <KeyRound size={13} className="text-primary" />
                <span className="text-[12px] font-semibold tracking-wider">语义锚点</span>
              </div>
              <div className="space-y-2">
                {cognition.level2.slice(0, 5).map((item) => (
                  <div key={item.anchor} className="text-[12px] text-on-surface-variant leading-relaxed">
                    <span className="text-primary font-medium">{item.anchor}</span>
                    <span>：{item.summary}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white/30 border border-outline-variant/20 p-3">
              <div className="flex items-center gap-2 mb-2 text-on-surface">
                <AlertCircle size={13} className="text-tertiary" />
                <span className="text-[12px] font-semibold tracking-wider">认知待办/缺口</span>
              </div>
              <div className="space-y-1.5">
                {cognition.cognitiveGaps.map((gap) => (
                  <div key={gap} className="text-[12px] text-on-surface-variant leading-relaxed">
                    {gap}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <blockquote className="rounded-xl border-l-2 border-primary bg-primary-container/10 px-3 py-2 text-[12px] text-on-surface-variant leading-relaxed">
            {cognition.wakeTrigger}
          </blockquote>

          <button
            onClick={onToggleDeep}
            className="btn-ghost text-[13px] flex items-center gap-1 !px-3"
          >
            <Eye size={13} />
            {deep ? '收起溯源层' : '深入探查 Level 3'}
          </button>

          {deep && (
            <div className="rounded-xl bg-surface-container/60 border border-outline-variant/20 p-3 space-y-3">
              <div className="text-[12px] text-on-surface font-semibold tracking-wider">
                高频气泡与溯源支持
              </div>
              {weightedBubbles.slice(0, 6).map((bubble) => {
                const deepLayer = cognition.level3.find((item) => item.bubbleId === bubble.id)
                return (
                  <div key={bubble.id} className="border-t border-outline-variant/20 pt-2 first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-2 text-[11px] text-outline mb-1">
                      <span>权重 {bubble.interactionWeight || 0}</span>
                      {bubble.tag && <span>{bubble.tag}</span>}
                    </div>
                    <div className="text-[12px] text-on-surface leading-relaxed">{bubble.content}</div>
                    {deepLayer?.deepLogic && (
                      <div className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                        {deepLayer.deepLogic}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { X, Trash2, Tag, Palette, History, Activity } from 'lucide-react'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useSnapshotStore } from '@/stores/snapshotStore'

const TAG_COLORS = [
  '#4f46e5', '#0891b2', '#7c3aed', '#e11d48',
  '#d97706', '#0f766e', '#64748b', '#db2777',
  '#2563eb', '#ea580c', '#65a30d', '#9333ea',
]

export default function BubbleDetail() {
  const { bubbles, selectedBubbleId, selectBubble, updateBubble, deleteBubble } = useBubbleStore()
  const snapshots = useSnapshotStore((s) => s.snapshots)
  const bubble = bubbles.find((b) => b.id === selectedBubbleId)
  const snapshotCount = bubble
    ? snapshots.filter((snapshot) =>
      snapshot.canvasState.bubbles.some((snapshotBubble) => snapshotBubble.id === bubble.id)
    ).length
    : 0

  if (!bubble) return null

  return (
    <div className="absolute top-20 bottom-48 left-6 z-40 w-[280px] max-w-[calc(100%-3rem)] glass-panel floating-window p-4 space-y-4 overflow-y-auto animate-bubble-in">
      <div className="flex items-center justify-between">
        <span className="text-[15px] text-on-surface font-semibold">气泡详情</span>
        <button onClick={() => selectBubble(null)} className="h-8 w-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container/70 hover:text-on-surface transition-colors">
          <X size={14} />
        </button>
      </div>

      <div>
        <label className="text-[12px] text-on-surface-variant font-semibold block mb-1">内容</label>
        <textarea
          value={bubble.content}
          onChange={(e) => updateBubble(bubble.id, { content: e.target.value })}
          className="w-full input-field text-[14px] min-h-[84px] resize-none leading-relaxed"
          rows={3}
        />
      </div>

      <div>
        <label className="text-[11px] text-on-surface-variant font-semibold tracking-wider block mb-1.5">
          <Tag size={10} className="inline mr-1" />
          标签
        </label>
        <input
          type="text"
          value={bubble.tag}
          onChange={(e) => updateBubble(bubble.id, { tag: e.target.value })}
          placeholder="添加标签..."
          className="w-full input-field text-[13px]"
        />
      </div>

      <div>
        <label className="text-[11px] text-on-surface-variant font-semibold tracking-wider block mb-1.5">
          <Palette size={10} className="inline mr-1" />
          颜色
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateBubble(bubble.id, { color: c })}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                bubble.color === c ? 'border-on-surface' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="text-[11px] text-outline font-mono">
        创建: {new Date(bubble.createdAt).toLocaleString('zh-CN')}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[20px] bg-white/45 border border-white/60 p-3">
          <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant font-semibold">
            <Activity size={11} className="text-primary" />
            交互权重
          </div>
          <div className="text-lg font-semibold text-primary mt-1">{bubble.interactionWeight || 0}</div>
        </div>
        <div className="rounded-[20px] bg-white/45 border border-white/60 p-3">
          <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant font-semibold">
            <History size={11} className="text-primary" />
            参与快照
          </div>
          <div className="text-lg font-semibold text-primary mt-1">{snapshotCount}</div>
        </div>
      </div>

      <button
        onClick={() => deleteBubble(bubble.id)}
        className="w-full flex items-center justify-center gap-1.5 text-[13px] text-error/70 hover:text-error py-2 rounded-full hover:bg-error-container/30 transition-all"
      >
        <Trash2 size={12} />
        删除气泡
      </button>
    </div>
  )
}

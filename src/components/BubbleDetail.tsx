import { X, Trash2, Tag, Palette } from 'lucide-react'
import { useBubbleStore } from '@/stores/bubbleStore'

const TAG_COLORS = [
  '#246a52', '#795900', '#ba1a1a', '#5e5e5b',
  '#6f7973', '#3f4944', '#474744', '#00513b',
]

export default function BubbleDetail() {
  const { bubbles, selectedBubbleId, selectBubble, updateBubble, deleteBubble } = useBubbleStore()
  const bubble = bubbles.find((b) => b.id === selectedBubbleId)

  if (!bubble) return null

  return (
    <div className="absolute top-4 right-[19.5rem] z-40 w-72 glass-panel p-5 space-y-4 animate-bubble-in">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-primary font-semibold tracking-wider">气泡详情</span>
        <button onClick={() => selectBubble(null)} className="text-outline hover:text-on-surface transition-colors">
          <X size={14} />
        </button>
      </div>

      <div>
        <label className="text-[11px] text-on-surface-variant font-semibold tracking-wider block mb-1">内容</label>
        <textarea
          value={bubble.content}
          onChange={(e) => updateBubble(bubble.id, { content: e.target.value })}
          className="w-full input-field text-[13px] min-h-[60px] resize-none"
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

import { useState } from 'react'
import { Tag, Plus } from 'lucide-react'
import { useBubbleStore } from '@/stores/bubbleStore'

const TAG_COLORS = [
  '#246a52', '#795900', '#ba1a1a', '#5e5e5b',
  '#6f7973', '#3f4944', '#474744', '#00513b',
]

export default function TagSidebar() {
  const { bubbles, filterTag, setFilterTag, updateBubble } = useBubbleStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  const tags = [...new Set(bubbles.map((b) => b.tag).filter(Boolean))]
  const tagCounts: Record<string, number> = {}
  bubbles.forEach((b) => {
    if (b.tag) tagCounts[b.tag] = (tagCounts[b.tag] || 0) + 1
  })

  const tagColors: Record<string, string> = {}
  bubbles.forEach((b) => {
    if (b.tag && b.color) tagColors[b.tag] = b.color
  })

  const handleAddTag = () => {
    if (!newTag.trim()) return
    const untagged = bubbles.filter((b) => !b.tag)
    if (untagged.length > 0) {
      updateBubble(untagged[0].id, { tag: newTag.trim(), color: newTagColor })
    }
    setNewTag('')
    setIsAdding(false)
  }

  return (
    <div className="w-56 glass-panel !rounded-none !border-r !border-r-white/40 flex flex-col">
      <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Tag size={14} />
          <span className="text-[13px] font-semibold tracking-wider">标签管理</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container/20 transition-all"
        >
          <Plus size={14} />
        </button>
      </div>

      {isAdding && (
        <div className="px-3 py-2 border-b border-outline-variant/30 space-y-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="新标签名..."
            className="w-full input-field text-xs !py-1.5 !px-2"
          />
          <div className="flex items-center gap-1 flex-wrap">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewTagColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${
                  newTagColor === c ? 'border-on-surface scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={handleAddTag}
            className="w-full text-[13px] font-semibold tracking-wider py-1.5 rounded-full bg-primary-container/30 text-primary hover:bg-primary-container/50 transition-all"
          >
            添加标签
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        <button
          onClick={() => setFilterTag(null)}
          className={`w-full px-4 py-2 text-left text-[13px] font-semibold tracking-wider flex items-center gap-2 transition-all duration-300 ${
            filterTag === null
              ? 'text-primary bg-primary-container/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary-container to-primary" />
          <span>全部气泡</span>
          <span className="ml-auto text-outline">{bubbles.length}</span>
        </button>

        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilterTag(filterTag === tag ? null : tag)}
            className={`w-full px-4 py-2 text-left text-[13px] font-semibold tracking-wider flex items-center gap-2 transition-all duration-300 ${
              filterTag === tag
                ? 'text-primary bg-primary-container/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
            }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: tagColors[tag] || '#6f7973' }}
            />
            <span className="truncate">{tag}</span>
            <span className="ml-auto text-outline">{tagCounts[tag] || 0}</span>
          </button>
        ))}

        {bubbles.some((b) => !b.tag) && (
          <button
            onClick={() => setFilterTag(filterTag === '__untagged__' ? null : '__untagged__')}
            className={`w-full px-4 py-2 text-left text-[13px] font-semibold tracking-wider flex items-center gap-2 transition-all duration-300 ${
              filterTag === '__untagged__'
                ? 'text-tertiary bg-tertiary-container/20'
                : 'text-outline hover:text-on-surface-variant hover:bg-surface-container/50'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full border border-dashed border-outline-variant" />
            <span>未标签</span>
            <span className="ml-auto text-outline">
              {bubbles.filter((b) => !b.tag).length}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

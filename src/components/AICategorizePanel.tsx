import { useState } from 'react'
import { Brain, Check, X, Loader2, ChevronDown, ChevronUp, AlertTriangle, Link2, Copy } from 'lucide-react'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useAiStore } from '@/stores/aiStore'

const TAG_COLORS = [
  '#4f46e5', '#0891b2', '#7c3aed', '#e11d48',
  '#d97706', '#0f766e', '#64748b', '#db2777',
  '#2563eb', '#ea580c', '#65a30d', '#9333ea',
]

interface AICategorizePanelProps {
  onClose?: () => void
}

export default function AICategorizePanel({ onClose }: AICategorizePanelProps) {
  const { bubbles, categories, setCategoriesFromAI, setRelations } = useBubbleStore()
  const { isLoading, categorizeResult, categorize, clearCategorizeResult } = useAiStore()
  const [isExpanded, setIsExpanded] = useState(true)

  const handleCategorize = async () => {
    if (bubbles.length < 2) return
    const bubbleData = bubbles.map((b) => ({
      id: b.id,
      content: b.content,
      tag: b.tag || undefined,
    }))
    const existingTags = [...new Set(bubbles.map((b) => b.tag).filter(Boolean))]
    await categorize(bubbleData, existingTags)
  }

  const handleAccept = () => {
    if (!categorizeResult) return

    setCategoriesFromAI(
      categorizeResult.categories.map((cat, index) => {
        const suggestedTagColor = categorizeResult.suggestedTags.find((tag) => tag.name === cat.suggestedTag)?.color
        return {
          name: cat.name,
          description: cat.description,
          color: suggestedTagColor || TAG_COLORS[index % TAG_COLORS.length],
          confidence: cat.confidence,
          bubbleIds: cat.bubbleIds,
          suggestedTag: cat.suggestedTag,
        }
      })
    )

    const newRelations = categorizeResult.relations.map((r) => ({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      sourceId: r.sourceId,
      targetId: r.targetId,
      type: r.type,
      reason: r.reason,
    }))
    setRelations(newRelations)

    clearCategorizeResult()
  }

  const relationTypeConfig = {
    related: { color: 'text-primary', bg: 'bg-primary-container/30', icon: Link2, label: '关联' },
    contradictory: { color: 'text-error', bg: 'bg-error-container/30', icon: AlertTriangle, label: '矛盾' },
    duplicate: { color: 'text-tertiary', bg: 'bg-tertiary-container/30', icon: Copy, label: '重复' },
  }

  return (
    <div className="h-full w-full glass-panel floating-window flex flex-col overflow-hidden">
      <div
        className="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-on-surface">
          <Brain size={16} className="text-primary" />
          <span className="text-[15px] font-semibold">AI 智能归类</span>
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? <ChevronUp size={14} className="text-outline" /> : <ChevronDown size={14} className="text-outline" />}
          {onClose && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onClose()
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container/70 transition-all"
              title="关闭 AI 归类"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {!categorizeResult ? (
            <div className="p-5 space-y-5">
              <div className="text-[14px] text-on-surface-variant leading-relaxed">
                AI 将分析所有气泡内容，自动归类分组、推荐标签、检测关联与矛盾；接受后会同步整理画布位置，让同类气泡自然聚拢。
              </div>

              <button
                onClick={handleCategorize}
                disabled={isLoading || bubbles.length < 2}
                className="w-full btn-liquid flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Brain size={14} />
                    开始归类分析
                  </>
                )}
              </button>

              {bubbles.length < 2 && (
                <div className="text-[13px] text-tertiary text-center">
                  至少需要 2 个气泡才能进行归类
                </div>
              )}

              {categories.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[14px] text-on-surface font-semibold">已有分类</div>
                  {categories.map((cat) => {
                    const count = bubbles.filter((b) => b.categoryId === cat.id).length
                    return (
                      <div key={cat.id} className="rounded-[22px] bg-white/48 p-3 ring-1 ring-white/60">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-[14px] text-on-surface">{cat.name}</span>
                          <span className="text-[11px] text-outline ml-auto">{count} 气泡</span>
                        </div>
                        {cat.description && (
                          <div className="text-[11px] text-on-surface-variant mt-1 pl-4">{cat.description}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="text-[14px] text-primary font-semibold">归类结果</div>

              {categorizeResult.categories.map((cat, i) => (
                <div key={i} className="rounded-[22px] bg-white/50 p-4 space-y-2 ring-1 ring-white/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-on-surface font-medium">{cat.name}</span>
                    <span className="text-[11px] text-outline">
                      置信度 {(cat.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {cat.description && (
                    <div className="text-[11px] text-on-surface-variant">{cat.description}</div>
                  )}
                  <div className="text-[11px] text-outline">
                    包含 {cat.bubbleIds.length} 个气泡
                    {cat.suggestedTag && ` · 推荐标签: ${cat.suggestedTag}`}
                  </div>
                </div>
              ))}

              {categorizeResult.suggestedTags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[14px] text-on-surface font-semibold">推荐标签</div>
                  <div className="flex flex-wrap gap-1.5">
                    {categorizeResult.suggestedTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: `${tag.color}25`,
                          color: tag.color,
                          border: `1px solid ${tag.color}40`,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {categorizeResult.relations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[14px] text-on-surface font-semibold">关联检测</div>
                  {categorizeResult.relations.map((rel, i) => {
                    const config = relationTypeConfig[rel.type]
                    const Icon = config.icon
                    return (
                      <div key={i} className={`${config.bg} rounded-xl p-2.5`}>
                        <div className="flex items-center gap-1.5">
                          <Icon size={12} className={config.color} />
                          <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant mt-1">{rel.reason}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleAccept} className="flex-1 btn-liquid text-[13px] flex items-center justify-center gap-1">
                  <Check size={12} />
                  接受并整理画布
                </button>
                <button onClick={clearCategorizeResult} className="flex-1 btn-ghost text-[13px] flex items-center justify-center gap-1">
                  <X size={12} />
                  忽略
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

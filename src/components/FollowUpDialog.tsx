import { Loader2, MessageCircle, X } from 'lucide-react'
import { useAiStore } from '@/stores/aiStore'
import { useBubbleStore } from '@/stores/bubbleStore'

export default function FollowUpDialog() {
  const { followUpResult, activeFollowUpBubbleId, isLoading, clearFollowUp } = useAiStore()
  const { addExtension } = useBubbleStore()

  if (!followUpResult || !activeFollowUpBubbleId) return null

  const handleSelect = (option: { id: string; text: string; detail: string }) => {
    if (option.text === '就这样吧') {
      clearFollowUp()
      return
    }

    addExtension(activeFollowUpBubbleId, `${option.text}：${option.detail}`, 'ai_followup')
    clearFollowUp()
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bubble-in">
      <div className="glass-panel-mint p-5 min-w-[380px] max-w-[520px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" />
            <span className="text-[13px] text-primary font-semibold tracking-wider">AI 智能追问</span>
          </div>
          <button
            onClick={clearFollowUp}
            className="text-outline hover:text-on-surface transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="text-[13px] text-on-surface mb-4 leading-relaxed">
          {followUpResult.question}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4 gap-2 text-on-surface-variant">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span className="text-[13px]">思考中...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {followUpResult.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group ${
                  option.text === '就这样吧'
                    ? 'bg-surface-container/50 text-on-surface-variant hover:bg-surface-container-high/60'
                    : 'bg-white/40 hover:bg-white/70 text-on-surface hover:shadow-glass border border-outline-variant/20 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    option.text === '就这样吧' ? 'bg-outline-variant' : 'bg-primary'
                  }`} />
                  <span className="text-[13px] font-medium">{option.text}</span>
                </div>
                {option.detail && option.text !== '就这样吧' && (
                  <div className="text-[11px] text-on-surface-variant mt-1 ml-3.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    {option.detail}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

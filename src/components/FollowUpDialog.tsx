import { Loader2, MessageCircle, X } from 'lucide-react'
import { useAiStore } from '@/stores/aiStore'
import { useBubbleStore } from '@/stores/bubbleStore'

export default function FollowUpDialog() {
  const { followUpResult, activeFollowUpBubbleId, isLoading, clearFollowUp } = useAiStore()
  const { addExtension } = useBubbleStore()

  if (!activeFollowUpBubbleId) return null

  const handleSelect = (option: { id: string; text: string; detail: string }) => {
    if (option.text === '就这样吧') {
      clearFollowUp()
      return
    }

    addExtension(activeFollowUpBubbleId, `${option.text}：${option.detail}`, 'ai_followup')
    clearFollowUp()
  }

  return (
    <div className="absolute left-1/2 top-1/2 z-50 w-[min(620px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2">
      <div className="floating-window rounded-[32px] p-5 animate-bubble-in">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-glow-primary">
              <MessageCircle size={15} />
            </span>
            <span className="text-[14px] font-semibold text-primary">AI 智能追问</span>
          </div>
          <button
            onClick={clearFollowUp}
            className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition-colors hover:bg-primary-fixed/50 hover:text-primary"
            title="关闭追问"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mb-4 rounded-[24px] bg-white/42 px-4 py-3 text-[14px] leading-relaxed text-on-surface ring-1 ring-white/55">
          {followUpResult?.question || '我正在根据这条灵感生成几个追问方向。'}
        </div>

        {isLoading || !followUpResult ? (
          <div className="flex items-center justify-center gap-2 rounded-[24px] bg-white/42 py-6 text-on-surface-variant ring-1 ring-white/55">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span className="text-[13px]">思考中...</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {followUpResult.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className={`group w-full rounded-[24px] px-4 py-3 text-left transition-all duration-300 ${
                  option.text === '就这样吧'
                    ? 'bg-white/28 text-on-surface-variant ring-1 ring-white/45 hover:bg-primary-fixed/34 hover:text-on-surface'
                    : 'bg-white/42 text-on-surface ring-1 ring-white/55 hover:bg-primary-fixed/38 hover:shadow-glass hover:ring-primary/28'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    option.text === '就这样吧' ? 'bg-primary-fixed-dim/60' : 'bg-primary'
                  }`} />
                  <span className="text-[13px] font-semibold">{option.text}</span>
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

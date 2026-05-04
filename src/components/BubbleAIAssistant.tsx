import { useMemo, useState } from 'react'
import { Loader2, MessageCircle, Pencil, Plus, Send, Sparkles, X } from 'lucide-react'
import { useAiStore } from '@/stores/aiStore'
import { useBubbleStore } from '@/stores/bubbleStore'

type AssistantMode = 'add' | 'rewrite' | 'extend' | 'followup'

const modes: Array<{
  id: AssistantMode
  label: string
  icon: typeof Pencil
  placeholder: string
}> = [
  {
    id: 'add',
    label: '添加气泡',
    icon: Plus,
    placeholder: '输入灵感，回车生成气泡...',
  },
  {
    id: 'rewrite',
    label: '改写内容',
    icon: Pencil,
    placeholder: '输入新的气泡内容，或写下你希望它变成什么表达...',
  },
  {
    id: 'extend',
    label: '追加补充',
    icon: Plus,
    placeholder: '补充约束、场景、用户、判断标准，作为这条气泡的追问沉淀...',
  },
  {
    id: 'followup',
    label: '继续追问',
    icon: MessageCircle,
    placeholder: '告诉 AI 你想追问的方向，例如“围绕目标用户继续问”...',
  },
]

export default function BubbleAIAssistant() {
  const {
    bubbles,
    selectedBubbleId,
    selectBubble,
    addBubble,
    updateBubble,
    addExtension,
  } = useBubbleStore()
  const { followUp, isLoading } = useAiStore()
  const [mode, setMode] = useState<AssistantMode>('rewrite')
  const [instruction, setInstruction] = useState('')

  const bubble = useMemo(
    () => bubbles.find((item) => item.id === selectedBubbleId),
    [bubbles, selectedBubbleId],
  )

  const availableModes = bubble ? modes.filter((item) => item.id !== 'add') : modes.filter((item) => item.id === 'add')
  const normalizedMode = bubble && mode === 'add' ? 'rewrite' : !bubble ? 'add' : mode
  const activeMode = modes.find((item) => item.id === normalizedMode) || modes[0]
  const canSubmit = instruction.trim().length > 0 || (bubble && normalizedMode === 'followup')

  const handleSubmit = async () => {
    const value = instruction.trim()

    if (normalizedMode === 'add') {
      if (!value) return
      const id = addBubble(value)
      selectBubble(id)
      useAiStore.setState({ activeFollowUpBubbleId: id })
      await followUp(value, bubbles.map((item) => item.content))
      setInstruction('')
      return
    }

    if (!bubble) return

    if (normalizedMode === 'rewrite') {
      if (!value) return
      updateBubble(bubble.id, { content: value })
      setInstruction('')
      return
    }

    if (normalizedMode === 'extend') {
      if (!value) return
      addExtension(bubble.id, value, 'manual')
      setInstruction('')
      return
    }

    const context = value
      ? `${bubble.content}\n\n用户希望继续追问的方向：${value}`
      : bubble.content
    useAiStore.setState({ activeFollowUpBubbleId: bubble.id })
    await followUp(context, bubbles.map((item) => item.content))
    setInstruction('')
  }

  return (
    <div className="absolute left-1/2 bottom-5 z-50 w-[min(640px,calc(100%-48px))] -translate-x-1/2">
      <div className="glass-panel !rounded-[30px] p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Sparkles size={15} className="text-primary" />
                <span className="truncate text-[13px] font-semibold text-on-surface">
                  {bubble ? `正在处理：${bubble.content}` : '捕捉新的产品构思'}
                </span>
              </div>
              {bubble && (
                <button
                  onClick={() => selectBubble(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-outline hover:bg-surface-container/70 hover:text-on-surface"
                  title="关闭气泡 AI 输入"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              {availableModes.length > 1 && (
                <div className="flex shrink-0 rounded-full bg-white/50 p-1 ring-1 ring-outline-variant/30">
                  {availableModes.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setMode(id)}
                      className={`flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold transition-all ${
                        normalizedMode === id
                          ? 'bg-primary text-on-primary shadow-glow-primary'
                          : 'text-on-surface-variant hover:bg-white/70 hover:text-on-surface'
                      }`}
                      title={label}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex-1">
                <input
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSubmit()
                  }}
                  placeholder={activeMode.placeholder}
                  className="input-field h-12 w-full pr-[72px] text-[13px]"
                />
                <div className="pointer-events-none absolute right-10 top-1/2 h-9 w-16 -translate-y-1/2 bg-gradient-to-r from-white/0 via-white/70 to-white/95" />
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isLoading}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-on-primary transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                  title={normalizedMode === 'add' ? '发送' : activeMode.label}
                >
                  {isLoading && (normalizedMode === 'followup' || normalizedMode === 'add') ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Brain, History, Tags } from 'lucide-react'
import BubbleCanvas from '@/components/BubbleCanvas'
import TagSidebar from '@/components/TagSidebar'
import AICategorizePanel from '@/components/AICategorizePanel'
import BubbleDetail from '@/components/BubbleDetail'
import FollowUpDialog from '@/components/FollowUpDialog'
import SnapshotPanel from '@/components/snapshot/SnapshotPanel'
import BubbleAIAssistant from '@/components/BubbleAIAssistant'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useAiStore } from '@/stores/aiStore'
import { useSnapshotStore } from '@/stores/snapshotStore'

export default function BubbleSpace() {
  const [activePanel, setActivePanel] = useState<'tags' | 'ai' | 'snapshot' | null>(null)
  const selectedBubbleId = useBubbleStore((s) => s.selectedBubbleId)
  const isFollowUpLoading = useAiStore((s) => s.isLoading)
  const followUpResult = useAiStore((s) => s.followUpResult)
  const activeFollowUpBubbleId = useAiStore((s) => s.activeFollowUpBubbleId)
  const latestSnapshot = useSnapshotStore((s) => s.snapshots[0])

  const panelButtons = [
    { id: 'tags' as const, icon: Tags, label: '标签' },
    { id: 'ai' as const, icon: Brain, label: 'AI 归类' },
    { id: 'snapshot' as const, icon: History, label: '快照' },
  ]

  return (
    <div className="h-screen flex flex-col bg-background dot-grid-bg relative overflow-hidden">
      <div className="blob-bg w-[520px] h-[520px] bg-primary-fixed/55 top-[-180px] left-[12%] animate-blob-drift" />
      <div className="blob-bg w-[430px] h-[430px] bg-secondary-container/50 bottom-[-140px] left-[-120px] animate-blob-drift" style={{ animationDelay: '-7s' }} />
      <div className="blob-bg w-[380px] h-[380px] bg-tertiary-fixed/40 top-[24%] right-[-90px] animate-blob-drift" style={{ animationDelay: '-13s' }} />

      <div className="relative z-10 h-full">
        <div className="absolute inset-0 overflow-hidden">
          <BubbleCanvas />

          <div className="absolute right-6 top-6 z-30 glass-panel floating-window !rounded-full flex items-center gap-1 p-1.5">
            {panelButtons.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActivePanel(activePanel === id ? null : id)}
                className={`h-9 px-3 rounded-full flex items-center gap-2 transition-all ${
                  activePanel === id
                    ? 'bg-primary text-on-primary shadow-glow-primary'
                    : 'text-on-surface hover:text-primary hover:bg-primary-fixed/35'
                }`}
                title={label}
              >
                <Icon size={15} />
                <span className="text-[12px] font-semibold">{label}</span>
                {id === 'snapshot' && latestSnapshot && (
                  <span className={`max-w-20 truncate text-[10px] ${activePanel === id ? 'text-on-primary/80' : 'text-outline'}`}>
                    {latestSnapshot.name}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activePanel && (
            <div className="absolute right-6 top-24 bottom-56 z-40 w-[380px] max-w-[calc(100%-3rem)]">
              {activePanel === 'tags' && <TagSidebar onClose={() => setActivePanel(null)} />}
              {activePanel === 'ai' && <AICategorizePanel onClose={() => setActivePanel(null)} />}
              {activePanel === 'snapshot' && (
                <SnapshotPanel embedded contained onClose={() => setActivePanel(null)} />
              )}
            </div>
          )}
          {selectedBubbleId && <BubbleDetail />}
          <BubbleAIAssistant />
          {activeFollowUpBubbleId && (followUpResult || isFollowUpLoading) && <FollowUpDialog />}
        </div>
      </div>
    </div>
  )
}

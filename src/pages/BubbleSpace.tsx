import { useState } from 'react'
import { History, RotateCcw } from 'lucide-react'
import BubbleInput from '@/components/BubbleInput'
import BubbleCanvas from '@/components/BubbleCanvas'
import TagSidebar from '@/components/TagSidebar'
import AICategorizePanel from '@/components/AICategorizePanel'
import BubbleDetail from '@/components/BubbleDetail'
import FollowUpDialog from '@/components/FollowUpDialog'
import CanvasToolbar from '@/components/CanvasToolbar'
import SnapshotPanel from '@/components/snapshot/SnapshotPanel'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useAiStore } from '@/stores/aiStore'
import { useSnapshotStore } from '@/stores/snapshotStore'

export default function BubbleSpace() {
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false)
  const selectedBubbleId = useBubbleStore((s) => s.selectedBubbleId)
  const isFollowUpLoading = useAiStore((s) => s.isLoading)
  const followUpResult = useAiStore((s) => s.followUpResult)
  const activeFollowUpBubbleId = useAiStore((s) => s.activeFollowUpBubbleId)
  const latestSnapshot = useSnapshotStore((s) => s.snapshots[0])
  const restoreSnapshot = useSnapshotStore((s) => s.restoreSnapshot)

  const restoreLatestSnapshot = () => {
    if (!latestSnapshot) return
    const snapshot = restoreSnapshot(latestSnapshot.id)
    if (!snapshot) return

    useBubbleStore.setState({
      bubbles: snapshot.canvasState.bubbles,
      categories: snapshot.tagState.categories,
      relations: snapshot.canvasState.relations || [],
      extensions: snapshot.canvasState.extensions || [],
      viewport: snapshot.canvasState.viewport,
    })
  }

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="blob-bg w-[500px] h-[500px] bg-primary-container/40 top-[-100px] left-[-100px] animate-blob-drift" />
      <div className="blob-bg w-[400px] h-[400px] bg-tertiary-container/30 bottom-[-80px] right-[200px] animate-blob-drift" style={{ animationDelay: '-7s' }} />
      <div className="blob-bg w-[300px] h-[300px] bg-primary-fixed/25 top-[40%] right-[-50px] animate-blob-drift" style={{ animationDelay: '-13s' }} />

      <div className="relative z-10 flex flex-col h-full">
        <BubbleInput />
        <div className="flex-1 flex overflow-hidden relative">
          <TagSidebar />
          <div className="flex-1 relative">
            <CanvasToolbar />
            <BubbleCanvas />
            <button
              onClick={() => setShowSnapshotPanel(true)}
              className="absolute top-4 right-4 z-30 glass-panel !rounded-2xl px-3 h-10 flex items-center gap-2 text-primary hover:bg-primary-container/20 transition-all"
              title="认知快照"
            >
              <History size={15} />
              <span className="text-[12px] font-semibold tracking-wider">快照</span>
              {latestSnapshot && (
                <span className="max-w-28 truncate text-[10px] text-on-surface-variant">
                  {latestSnapshot.name}
                </span>
              )}
            </button>
            {showSnapshotPanel && (
              <SnapshotPanel embedded onClose={() => setShowSnapshotPanel(false)} />
            )}
            {latestSnapshot && !showSnapshotPanel && (
              <div className="absolute bottom-4 right-4 z-30 glass-panel !rounded-2xl px-3 py-2 flex items-center gap-2 max-w-[320px]">
                <div className="min-w-0">
                  <div className="text-[10px] text-outline font-semibold tracking-wider">最近快照</div>
                  <div className="text-[12px] text-on-surface-variant truncate">{latestSnapshot.name}</div>
                </div>
                <button
                  onClick={restoreLatestSnapshot}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary-container/20 transition-all flex-shrink-0"
                  title="恢复最近快照"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}
          </div>
          <AICategorizePanel />
          {selectedBubbleId && <BubbleDetail />}
          {activeFollowUpBubbleId && (followUpResult || isFollowUpLoading) && <FollowUpDialog />}
        </div>
      </div>
    </div>
  )
}

import BubbleInput from '@/components/BubbleInput'
import BubbleCanvas from '@/components/BubbleCanvas'
import TagSidebar from '@/components/TagSidebar'
import AICategorizePanel from '@/components/AICategorizePanel'
import BubbleDetail from '@/components/BubbleDetail'
import FollowUpDialog from '@/components/FollowUpDialog'
import CanvasToolbar from '@/components/CanvasToolbar'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useAiStore } from '@/stores/aiStore'

export default function BubbleSpace() {
  const selectedBubbleId = useBubbleStore((s) => s.selectedBubbleId)
  const followUpResult = useAiStore((s) => s.followUpResult)
  const activeFollowUpBubbleId = useAiStore((s) => s.activeFollowUpBubbleId)

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
          </div>
          <AICategorizePanel />
          {selectedBubbleId && <BubbleDetail />}
          {followUpResult && activeFollowUpBubbleId && <FollowUpDialog />}
        </div>
      </div>
    </div>
  )
}

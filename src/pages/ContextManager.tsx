import SnapshotPanel from '@/components/snapshot/SnapshotPanel'
import { Archive } from 'lucide-react'

export default function ContextManager() {
  return (
    <div className="h-screen bg-background dot-grid-bg relative overflow-hidden">
      <div className="blob-bg w-[520px] h-[520px] bg-primary-fixed/55 top-[-180px] right-[10%] animate-blob-drift" />
      <div className="blob-bg w-[430px] h-[430px] bg-secondary-container/45 bottom-[-140px] left-[-80px] animate-blob-drift" style={{ animationDelay: '-8s' }} />
      <div className="blob-bg w-[360px] h-[360px] bg-tertiary-fixed/35 top-[36%] right-[-90px] animate-blob-drift" style={{ animationDelay: '-13s' }} />

      <div className="relative z-10 h-full">
        <div className="absolute left-[540px] right-6 top-6 z-20 floating-window rounded-full px-5 py-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-fixed/60 text-primary flex items-center justify-center">
            <Archive size={19} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-serif text-on-surface">快照库</h1>
            <p className="text-[12px] text-on-surface-variant truncate">
              浏览、恢复和整理灵感气泡工作区的语义快照
            </p>
          </div>
        </div>

        <section className="absolute left-6 right-6 top-24 bottom-6 floating-window rounded-[32px] p-6 overflow-hidden flex flex-col">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-on-surface">历史快照</h2>
              <p className="text-[12px] text-outline">保存过的工作区语义状态会出现在这里</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <SnapshotPanel />
          </div>
        </section>
      </div>
    </div>
  )
}

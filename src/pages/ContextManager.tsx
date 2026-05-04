import SnapshotPanel from '@/components/snapshot/SnapshotPanel'

export default function ContextManager() {
  return (
    <div className="h-screen bg-background dot-grid-bg relative overflow-hidden">
      <div className="blob-bg w-[520px] h-[520px] bg-primary-fixed/55 top-[-180px] right-[10%] animate-blob-drift" />
      <div className="blob-bg w-[430px] h-[430px] bg-secondary-container/45 bottom-[-140px] left-[-80px] animate-blob-drift" style={{ animationDelay: '-8s' }} />
      <div className="blob-bg w-[360px] h-[360px] bg-tertiary-fixed/35 top-[36%] right-[-90px] animate-blob-drift" style={{ animationDelay: '-13s' }} />

      <div className="relative z-10 h-full">
        <section className="absolute left-6 right-6 top-20 bottom-6 floating-window rounded-[32px] p-6 overflow-hidden flex flex-col">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[16px] font-semibold text-on-surface">快照库</h1>
              <p className="text-[12px] text-outline">浏览、恢复和整理灵感气泡工作区的语义快照</p>
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

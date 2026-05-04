import SnapshotPanel from '@/components/snapshot/SnapshotPanel'

export default function ContextManager() {
  return (
    <div className="h-screen bg-background relative overflow-hidden">
      <div className="blob-bg w-[600px] h-[600px] bg-primary-container/30 top-[-200px] right-[-100px] animate-blob-drift" />
      <div className="blob-bg w-[400px] h-[400px] bg-tertiary-container/20 bottom-[-100px] left-[-50px] animate-blob-drift" style={{ animationDelay: '-10s' }} />

      <div className="relative z-10 p-8 h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-serif text-gradient-primary mb-2">快照库</h1>
            <p className="text-[13px] text-on-surface-variant">
              浏览、恢复和整理灵感气泡工作区的语义快照
            </p>
          </div>

          <SnapshotPanel />
        </div>
      </div>
    </div>
  )
}

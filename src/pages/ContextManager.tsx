import { useState } from 'react'
import { Camera, Clock, RotateCcw, Trash2, Plus } from 'lucide-react'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useSnapshotStore } from '@/stores/snapshotStore'

export default function ContextManager() {
  const { bubbles, categories, viewport, setViewport } = useBubbleStore()
  const { snapshots, createSnapshot, restoreSnapshot, deleteSnapshot } = useSnapshotStore()
  const [snapshotName, setSnapshotName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateSnapshot = () => {
    const name = snapshotName.trim() || `快照 ${snapshots.length + 1}`
    createSnapshot(name, bubbles, viewport, categories)
    setSnapshotName('')
    setIsCreating(false)
  }

  const handleRestore = (id: string) => {
    const snapshot = restoreSnapshot(id)
    if (!snapshot) return

    const store = useBubbleStore.getState()
    store.bubbles = snapshot.canvasState.bubbles
    store.categories = snapshot.tagState.categories
    setViewport(snapshot.canvasState.viewport)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="h-screen bg-background relative overflow-hidden">
      <div className="blob-bg w-[600px] h-[600px] bg-primary-container/30 top-[-200px] right-[-100px] animate-blob-drift" />
      <div className="blob-bg w-[400px] h-[400px] bg-tertiary-container/20 bottom-[-100px] left-[-50px] animate-blob-drift" style={{ animationDelay: '-10s' }} />

      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-serif text-gradient-primary mb-2">认知上下文管理</h1>
            <p className="text-[13px] text-on-surface-variant">保存与恢复你的思考状态，随时无缝切换回深度工作流</p>
          </div>

          <div className="glass-panel p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-primary" />
                <span className="text-[13px] text-on-surface font-semibold tracking-wider">创建快照</span>
              </div>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="btn-glass text-[13px] flex items-center gap-1"
              >
                <Plus size={12} />
                新建快照
              </button>
            </div>

            {isCreating && (
              <div className="flex items-center gap-3 mt-4 animate-bubble-in">
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSnapshot()}
                  placeholder="快照名称..."
                  className="flex-1 input-field text-[13px]"
                  autoFocus
                />
                <button onClick={handleCreateSnapshot} className="btn-liquid text-[13px]">
                  保存
                </button>
              </div>
            )}

            <div className="mt-4 flex gap-4 text-[13px] text-on-surface-variant">
              <span>当前气泡: {bubbles.length}</span>
              <span>分类: {categories.length}</span>
              <span>快照: {snapshots.length}</span>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-16">
              <Camera size={48} className="text-outline-variant mx-auto mb-4" />
              <p className="text-on-surface-variant text-[13px]">暂无快照</p>
              <p className="text-outline text-[11px] mt-1">创建快照以保存当前思考状态</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Clock size={14} className="text-on-surface-variant" />
                <span className="text-[13px] text-on-surface-variant font-semibold tracking-wider">时间线</span>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-outline-variant to-transparent" />

                {snapshots.map((snapshot, index) => (
                  <div key={snapshot.id} className="relative mb-4 animate-bubble-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="absolute -left-5 top-4 w-4 h-4 rounded-full bg-surface flex items-center justify-center"
                      style={{ boxShadow: '0 0 0 2px rgba(36,106,82,0.3)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>

                    <div className="glass-panel p-4 ml-2 hover:shadow-glass-hover transition-all group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] text-on-surface font-medium">{snapshot.name}</span>
                            <span className="text-[11px] text-outline font-mono">
                              {formatTime(snapshot.createdAt)}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-2 text-[11px] text-on-surface-variant">
                            <span>{snapshot.canvasState.bubbles.length} 气泡</span>
                            <span>{snapshot.tagState.categories.length} 分类</span>
                            <span>{snapshot.tagState.tags.length} 标签</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRestore(snapshot.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary-container/20 transition-all"
                            title="恢复快照"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => deleteSnapshot(snapshot.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-error/40 hover:text-error hover:bg-error-container/20 transition-all"
                            title="删除快照"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

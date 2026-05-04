import { useLocation } from 'react-router-dom'
import { Hand, MousePointer2, SquareDashedMousePointer, Target } from 'lucide-react'
import { useBubbleStore } from '@/stores/bubbleStore'

const toolItems = [
  { id: 'pan' as const, icon: Hand, label: '拖拽', shortcut: 'V' },
  { id: 'edit' as const, icon: MousePointer2, label: '编辑', shortcut: 'E' },
  { id: 'select' as const, icon: SquareDashedMousePointer, label: '选区', shortcut: 'S' },
]

export default function Navigation() {
  const location = useLocation()
  const { canvasMode, setCanvasMode, setViewport } = useBubbleStore()

  if (location.pathname !== '/') return null

  return (
    <nav className="fixed left-1/2 top-6 z-50 -translate-x-1/2 glass-panel floating-window !rounded-full p-1.5">
      <div className="flex items-center gap-1">
        {toolItems.map(({ id, icon: Icon, label, shortcut }) => (
          <button
            key={id}
            onClick={() => setCanvasMode(id)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 relative group ${
              canvasMode === id
                ? 'bg-primary text-on-primary shadow-glow-primary'
                : 'text-on-surface-variant hover:text-primary hover:bg-primary-fixed/40'
            }`}
            title={`${label} (${shortcut})`}
          >
            <Icon size={17} />
            <span className="absolute top-full mt-3 px-2 py-1 rounded-lg bg-inverse-surface text-inverse-on-surface text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {label} ({shortcut})
            </span>
          </button>
        ))}
        <button
          onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
          className="h-10 w-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed/40 transition-all relative group"
          title="重置视角"
        >
          <Target size={17} />
          <span className="absolute top-full mt-3 px-2 py-1 rounded-lg bg-inverse-surface text-inverse-on-surface text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            重置视角
          </span>
        </button>
      </div>
    </nav>
  )
}

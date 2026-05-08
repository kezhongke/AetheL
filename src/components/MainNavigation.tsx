import { Link, NavLink } from 'react-router-dom'
import { AlertCircle, Archive, CheckCircle2, FileText, Loader2, Puzzle, Sparkles } from 'lucide-react'
import { usePersistenceStore } from '@/stores/persistenceStore'

const navItems = [
  { to: '/', icon: Sparkles, label: '灵感气泡' },
  { to: '/context', icon: Archive, label: '快照库' },
  { to: '/prd', icon: FileText, label: 'PRD' },
  { to: '/workshop', icon: Puzzle, label: '工坊' },
]

export default function MainNavigation() {
  const { status, error, lastSavedAt } = usePersistenceStore()
  const isBusy = status === 'loading' || status === 'saving'
  const StatusIcon = status === 'error' ? AlertCircle : isBusy ? Loader2 : CheckCircle2
  const statusLabel = status === 'error'
    ? error || '保存失败'
    : status === 'loading'
      ? '正在加载文件层'
      : status === 'saving'
        ? '正在保存'
        : lastSavedAt
          ? `已保存 ${new Date(lastSavedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
          : '已连接文件层'

  return (
    <nav className="fixed left-6 top-5 z-50 floating-window rounded-full p-1 flex items-center gap-0.5">
      <Link to="/settings" className="mr-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/75 ring-1 ring-white/75 shadow-glass hover:opacity-80 transition-opacity cursor-pointer">
        <img src="/aethel-logo-icon.png" alt="Aethel logo" className="h-[88%] w-[88%] object-contain" />
      </Link>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `h-8 rounded-full px-2.5 flex items-center gap-1.5 transition-all ${
              isActive
                ? 'bg-primary text-on-primary shadow-glow-primary'
                : 'text-on-surface hover:text-primary hover:bg-primary-fixed/35'
            }`
          }
        >
          <Icon size={14} />
          <span className="text-[11px] font-semibold">{label}</span>
        </NavLink>
      ))}
      <span className="mx-1 h-4 w-px bg-white/45" />
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          status === 'error'
            ? 'text-error bg-error-container/30'
            : isBusy
              ? 'text-primary bg-primary-fixed/30'
              : 'text-primary bg-white/24'
        }`}
        title={statusLabel}
      >
        <StatusIcon size={14} className={isBusy ? 'animate-spin' : ''} />
      </span>
    </nav>
  )
}

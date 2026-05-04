import { NavLink } from 'react-router-dom'
import { Archive, FileText, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/', icon: Sparkles, label: '灵感气泡' },
  { to: '/context', icon: Archive, label: '快照库' },
  { to: '/prd', icon: FileText, label: 'PRD' },
]

export default function MainNavigation() {
  return (
    <nav className="fixed left-6 top-5 z-50 floating-window rounded-full p-1 flex items-center gap-0.5">
      <div className="mr-1 h-8 w-8 overflow-hidden rounded-full bg-white/75 ring-1 ring-white/75 shadow-glass">
        <img src="/hermit-crab-mascot.png" alt="Aethel mascot" className="h-full w-full object-cover" />
      </div>
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
    </nav>
  )
}

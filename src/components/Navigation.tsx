import { NavLink } from 'react-router-dom'
import { Sparkles, Camera, FileText } from 'lucide-react'

const navItems = [
  { to: '/', icon: Sparkles, label: '灵感气泡' },
  { to: '/context', icon: Camera, label: '上下文' },
  { to: '/prd', icon: FileText, label: 'PRD' },
]

export default function Navigation() {
  return (
    <nav className="fixed left-0 top-0 bottom-0 w-16 bg-surface-bright/10 backdrop-blur-xl border-r border-white/50 z-50 flex flex-col items-center py-6"
      style={{ boxShadow: '8px 0 32px rgba(170,240,209,0.05)' }}>
      <div className="mb-8">
        <div className="w-10 h-10 rounded-glass bg-gradient-to-br from-primary-container to-primary flex items-center justify-center"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px rgba(36,106,82,0.15)' }}>
          <span className="text-on-primary font-bold text-lg font-serif">C</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `w-12 h-12 rounded-glass flex flex-col items-center justify-center gap-0.5 transition-all duration-500 ${
                isActive
                  ? 'glass-panel-mint text-primary shadow-glass-mint'
                  : 'text-on-surface-variant hover:text-primary hover:scale-105'
              }`
            }
          >
            <Icon size={18} />
            <span className="text-[9px] font-semibold tracking-wider">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

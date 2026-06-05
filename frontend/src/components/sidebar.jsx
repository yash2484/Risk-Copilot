import { NavLink, useLocation } from 'react-router-dom'
import { MessageSquare, BarChart3, Shield, ChevronRight, Circle } from 'lucide-react'
import { useState, useEffect } from 'react'

const EXAMPLES = [
  'Show segments with the highest delinquency rate',
  'Investigate customer CUST_000042',
  'What does policy say about credit line increases?',
  'Show cross-border spending spikes',
  'Customer CUST_000042 has high risk — what does policy recommend?',
]

export default function Sidebar({ role, setRole, onExampleClick }) {
  const location = useLocation()
  const isChat = location.pathname === '/'
  const [apiStatus, setApiStatus] = useState('checking')

  // Check API health every 10 seconds
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/health')
        setApiStatus(res.ok ? 'healthy' : 'error')
      } catch {
        setApiStatus('offline')
      }
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="w-72 bg-base-800 border-r border-base-600 flex flex-col h-full shrink-0">

      {/* ── Logo ─────────────────────────────────────── */}
      <div className="p-5 border-b border-base-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-base-50 tracking-wide">Risk Copilot</h1>
            <p className="text-xs text-base-300">Multi-Agent System</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="p-3 space-y-1">
        <NavLink to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
             ${isActive ? 'bg-accent/10 text-accent' : 'text-base-200 hover:bg-base-700 hover:text-base-50'}`
          }>
          <MessageSquare className="w-4 h-4" />
          Chat
        </NavLink>
        <NavLink to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
             ${isActive ? 'bg-accent/10 text-accent' : 'text-base-200 hover:bg-base-700 hover:text-base-50'}`
          }>
          <BarChart3 className="w-4 h-4" />
          Analytics Dashboard
        </NavLink>
      </nav>

      {/* ── Role Selector ────────────────────────────── */}
      <div className="px-5 py-3 border-t border-base-600">
        <label className="text-xs font-medium text-base-300 uppercase tracking-wider">Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="mt-1.5 w-full bg-base-700 border border-base-600 rounded-lg px-3 py-2
                     text-sm text-base-50 focus:outline-none focus:ring-1 focus:ring-accent
                     cursor-pointer appearance-none"
        >
          <option value="analyst">Analyst</option>
          <option value="manager">Manager</option>
          <option value="read_only">Read Only</option>
        </select>
      </div>

      {/* ── Example Queries (only on chat page) ──────── */}
      {isChat && (
        <div className="flex-1 overflow-y-auto px-3 py-3 border-t border-base-600">
          <p className="px-2 text-xs font-medium text-base-300 uppercase tracking-wider mb-2">
            Example Queries
          </p>
          <div className="space-y-1">
            {EXAMPLES.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  // Dispatch custom event that Chat page listens to
                  window.dispatchEvent(new CustomEvent('example-query', { detail: q }))
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-base-200
                           hover:bg-base-700 hover:text-base-50 transition-colors
                           flex items-center gap-2 group"
              >
                <ChevronRight className="w-3 h-3 text-base-400 group-hover:text-accent shrink-0" />
                <span className="line-clamp-2">{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Status Footer ────────────────────────────── */}
      <div className="p-4 border-t border-base-600 mt-auto">
        <div className="flex items-center gap-2">
          <Circle
            className={`w-2.5 h-2.5 fill-current ${
              apiStatus === 'healthy' ? 'text-risk-low glow-green' :
              apiStatus === 'checking' ? 'text-risk-medium animate-pulse' :
              'text-risk-high glow-red'
            }`}
          />
          <span className="text-xs text-base-300">
            API {apiStatus === 'healthy' ? 'Connected' :
                 apiStatus === 'checking' ? 'Checking...' : 'Offline'}
          </span>
        </div>
        <p className="text-xs text-base-400 mt-1">v1.0.0 · FastAPI :8000</p>
      </div>
    </aside>
  )
}
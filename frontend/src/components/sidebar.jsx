import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { MessageSquareText, LayoutGrid, Command, ShieldCheck, ShieldAlert, Eye } from 'lucide-react'
 
const CLEARANCE = {
  analyst:   { label: 'Analyst',   desc: 'Full data access',     icon: ShieldCheck, tone: 'text-risk-low' },
  manager:   { label: 'Manager',   desc: 'Full data access',     icon: ShieldCheck, tone: 'text-risk-low' },
  read_only: { label: 'Read Only', desc: 'Summaries only',       icon: Eye,         tone: 'text-risk-medium' },
}
 
export default function Sidebar({ role, setRole, onOpenPalette }) {
  const location = useLocation()
  const [apiStatus, setApiStatus] = useState('checking')
  const [metrics, setMetrics] = useState(null)
 
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/health')
        setApiStatus(res.ok ? 'online' : 'error')
        const m = await fetch('/metrics')
        if (m.ok) setMetrics(await m.json())
      } catch {
        setApiStatus('offline')
      }
    }
    check()
    const interval = setInterval(check, 12000)
    return () => clearInterval(interval)
  }, [])
 
  const clearance = CLEARANCE[role]
  const ClearanceIcon = clearance.icon
 
  return (
    <aside className="w-64 bg-ink-900 border-r border-ink-700 flex flex-col h-full shrink-0">
 
      {/* ── Monogram ───────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 border-b border-ink-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-gold-dim flex items-center justify-center">
            <span className="font-display text-gold text-lg leading-none">R</span>
          </div>
          <div>
            <h1 className="font-display text-[15px] text-bone tracking-wide">Risk Copilot</h1>
            <p className="font-mono text-[10px] text-ink-300 tracking-widest2 uppercase mt-0.5">Audit Terminal</p>
          </div>
        </div>
      </div>
 
      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="px-3 py-4 space-y-0.5">
        <NavLink to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-[13px] font-medium border-l-2 transition-colors
             ${isActive
               ? 'border-gold text-bone bg-ink-800'
               : 'border-transparent text-ink-300 hover:text-bone hover:bg-ink-800/60'}`
          }>
          <MessageSquareText className="w-4 h-4" />
          Inquiry
        </NavLink>
        <NavLink to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-[13px] font-medium border-l-2 transition-colors
             ${isActive
               ? 'border-gold text-bone bg-ink-800'
               : 'border-transparent text-ink-300 hover:text-bone hover:bg-ink-800/60'}`
          }>
          <LayoutGrid className="w-4 h-4" />
          Portfolio
        </NavLink>
      </nav>
 
      {/* ── Command palette hint ───────────────────────── */}
      <button
        onClick={onOpenPalette}
        className="mx-4 mb-4 flex items-center justify-between px-3 py-2 bg-ink-800 border border-ink-700
                   hover:border-ink-500 text-left group"
      >
        <span className="flex items-center gap-2 text-[12px] text-ink-300 group-hover:text-ink-100">
          <Command className="w-3.5 h-3.5" />
          Query library
        </span>
        <kbd className="font-mono text-[10px] text-ink-400 border border-ink-600 px-1.5 py-0.5">⌘K</kbd>
      </button>
 
      {/* ── Clearance level ────────────────────────────── */}
      <div className="px-5 py-4 border-t border-ink-700">
        <p className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase mb-2">Clearance</p>
        <div className="space-y-1">
          {Object.entries(CLEARANCE).map(([key, c]) => {
            const Icon = c.icon
            const active = role === key
            return (
              <button
                key={key}
                onClick={() => setRole(key)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left border transition-colors
                  ${active
                    ? 'border-gold-dim bg-gold-glow'
                    : 'border-transparent hover:bg-ink-800'}`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? c.tone : 'text-ink-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-medium ${active ? 'text-bone' : 'text-ink-300'}`}>{c.label}</p>
                  {active && <p className="font-mono text-[10px] text-ink-300 mt-0.5">{c.desc}</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
 
      {/* ── Session ledger ─────────────────────────────── */}
      {metrics && metrics.total_queries > 0 && (
        <div className="px-5 py-4 border-t border-ink-700">
          <p className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase mb-2">Session Ledger</p>
          <div className="font-mono text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-300">Queries</span>
              <span className="text-bone">{metrics.total_queries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-300">Avg latency</span>
              <span className="text-bone">{(metrics.avg_latency_ms / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}
 
      {/* ── System status ──────────────────────────────── */}
      <div className="mt-auto px-5 py-4 border-t border-ink-700">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            apiStatus === 'online' ? 'bg-risk-low' :
            apiStatus === 'checking' ? 'bg-risk-medium animate-pulse-soft' :
            'bg-risk-high'
          }`} />
          <span className="font-mono text-[10px] text-ink-300 tracking-widest2 uppercase">
            {apiStatus === 'online' ? 'System Online' : apiStatus === 'checking' ? 'Connecting' : 'API Offline'}
          </span>
        </div>
        <p className="font-mono text-[10px] text-ink-400 mt-1.5">v1.0.0 · LangGraph · :8000</p>
      </div>
    </aside>
  )
}
import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { MessageSquareText, LayoutGrid, Command, ShieldCheck, Eye, PanelLeftClose } from 'lucide-react'

const CLEARANCE = {
  analyst:   { label: 'Analyst',   desc: 'Full data access', icon: ShieldCheck, dot: 'bg-risk-low' },
  manager:   { label: 'Manager',   desc: 'Full data access', icon: ShieldCheck, dot: 'bg-risk-low' },
  read_only: { label: 'Read only', desc: 'Summaries only',   icon: Eye,         dot: 'bg-risk-medium' },
}

// The carved-tile brand mark: a prussian square split by a diagonal seam.
function Mark({ className = 'w-7 h-7' }) {
  return (
    <div className={`${className} bg-accent relative rounded-[3px] overflow-hidden shrink-0`}>
      <div className="absolute inset-0"
           style={{ background: 'linear-gradient(135deg, transparent 46%, #FAF8F3 46%, #FAF8F3 54%, transparent 54%)' }} />
    </div>
  )
}

const navItem = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 text-[13px] rounded-[5px] border-l-2 transition-colors
   ${isActive
      ? 'border-accent bg-accent/[0.08] text-ink font-medium'
      : 'border-transparent text-ink-muted hover:text-ink hover:bg-ink/[0.04]'}`

export default function Sidebar({ role, setRole, open, onClose, onOpenPalette }) {
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

  return (
    <aside
      className={`w-60 shrink-0 h-full bg-paper-raised border-r border-ink/[0.12] flex flex-col
                  transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${open ? 'ml-0' : '-ml-60'}`}
      aria-hidden={!open}
    >
      {/* ── Brand lockup + collapse ─────────────────────── */}
      <div className="px-4 pt-5 pb-4 border-b border-ink/[0.12] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Mark />
          <div className="min-w-0">
            <h1 className="font-mono text-[12px] font-semibold text-ink tracking-[0.14em] leading-none">RISK&nbsp;COPILOT</h1>
            <p className="text-[10.5px] text-ink-faint mt-1 leading-none">Forensic ledger</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Collapse sidebar (Ctrl+B)"
          className="p-1.5 -mr-1 rounded-[5px] text-ink-faint hover:text-ink hover:bg-ink/[0.05]">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="px-3 py-3 space-y-0.5">
        <NavLink to="/" className={navItem}>
          <MessageSquareText className="w-4 h-4" /> Inquiry
        </NavLink>
        <NavLink to="/dashboard" className={navItem}>
          <LayoutGrid className="w-4 h-4" /> Portfolio
        </NavLink>
      </nav>

      {/* ── Query library ───────────────────────────────── */}
      <button onClick={onOpenPalette}
        className="mx-3 mb-3 flex items-center justify-between px-3 py-2 rounded-[5px]
                   bg-paper-raised2 border border-ink/[0.1] hover:border-accent/40 text-left group">
        <span className="flex items-center gap-2 text-[12px] text-ink-muted group-hover:text-ink">
          <Command className="w-3.5 h-3.5" /> Query library
        </span>
        <kbd className="font-mono text-[10px] text-ink-faint border border-ink/[0.14] rounded px-1.5 py-0.5">⌘K</kbd>
      </button>

      {/* ── Clearance ───────────────────────────────────── */}
      <div className="px-4 py-3.5 border-t border-ink/[0.12]">
        <p className="font-mono text-[9.5px] text-ink-faint tracking-widest2 uppercase mb-2">Clearance</p>
        <div className="space-y-1">
          {Object.entries(CLEARANCE).map(([key, c]) => {
            const Icon = c.icon
            const active = role === key
            return (
              <button key={key} onClick={() => setRole(key)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded-[5px] border transition-colors
                  ${active ? 'border-accent/30 bg-accent/[0.07]' : 'border-transparent hover:bg-ink/[0.04]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${active ? c.dot : 'bg-ink-disabled'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] ${active ? 'text-ink font-medium' : 'text-ink-muted'}`}>{c.label}</p>
                  {active && <p className="text-[10.5px] text-ink-faint mt-0.5">{c.desc}</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Session ledger ──────────────────────────────── */}
      {metrics && metrics.total_queries > 0 && (
        <div className="px-4 py-3.5 border-t border-ink/[0.12]">
          <p className="font-mono text-[9.5px] text-ink-faint tracking-widest2 uppercase mb-2">Session ledger</p>
          <div className="font-mono text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-muted">Queries</span>
              <span className="text-ink tabular-nums">{metrics.total_queries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Avg latency</span>
              <span className="text-ink tabular-nums">{(metrics.avg_latency_ms / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}

      {/* ── System status ───────────────────────────────── */}
      <div className="mt-auto px-4 py-3.5 border-t border-ink/[0.12]">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            apiStatus === 'online' ? 'bg-risk-low' :
            apiStatus === 'checking' ? 'bg-risk-medium animate-pulse-soft' : 'bg-risk-high'
          }`} />
          <span className="font-mono text-[10px] text-ink-muted tracking-widest2 uppercase">
            {apiStatus === 'online' ? 'System online' : apiStatus === 'checking' ? 'Connecting' : 'API offline'}
          </span>
        </div>
        <p className="font-mono text-[10px] text-ink-faint mt-1.5">v1.0.0 · LangGraph · :8000</p>
      </div>
    </aside>
  )
}

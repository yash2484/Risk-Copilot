import { useState, useEffect } from 'react'

/*
 * TRACE strip — the signature element, restyled for Forensic Ledger.
 * A horizontal chain of stage names joined by hairline connectors. While a query
 * runs (LiveRail) the connectors flow prussian left-to-right; when the real
 * response lands (TraceRail) the actual tools_used render as a completed chain.
 */

const STAGE_LABEL = {
  orchestrator:    'orchestrate',
  analytics_agent: 'analytics',
  risk_agent:      'risk',
  policy_agent:    'policy',
  security_node:   'mask',
  logging_node:    'log',
}

function StageName({ children, state }) {
  return (
    <span className={`font-mono text-[10px] tracking-wide whitespace-nowrap
      ${state === 'active' ? 'text-accent font-semibold' : state === 'done' ? 'text-ink' : 'text-ink-faint'}`}>
      {children}{state === 'active' ? ' ▸' : ''}
    </span>
  )
}

// ── LIVE MODE: animated while awaiting the API ────────────────
export function LiveRail() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 4200),
      setTimeout(() => setStep(3), 5200),
    ]
    return () => t.forEach(clearTimeout)
  }, [])

  const stages = ['orchestrate', 'routing', 'mask', 'log']
  const nameState = (i) =>
    i === 0 ? (step >= 1 ? 'done' : 'active') :
    i === 1 ? (step === 1 ? 'active' : step > 1 ? 'done' : 'pending') :
    i === 2 ? (step === 2 ? 'active' : step > 2 ? 'done' : 'pending') :
              (step === 3 ? 'active' : 'pending')
  const lineState = (i) =>
    (step === i) ? 'active' : (step > i) ? 'done' : ''

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[9px] tracking-widest2 uppercase text-ink-faint shrink-0">Trace</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {stages.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 last:flex-initial min-w-0">
            <StageName state={nameState(i)}>{s}</StageName>
            {i < stages.length - 1 && <span className={`rail-line ${lineState(i)}`} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TRACE MODE: the real completed pipeline ───────────────────
export function TraceRail({ trace, showFlags = true }) {
  if (!trace?.tools_used?.length) return null
  const { tools_used, intent, latency_ms, risk_flags = [] } = trace
  const stages = tools_used.map(t => STAGE_LABEL[t] || t)

  return (
    <div className="mt-3 pt-3 border-t border-ink/[0.1]">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-mono text-[10px] text-ink-faint tracking-widest2 uppercase">Execution trace</span>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-accent uppercase tracking-widest2">{intent}</span>
          <span className="text-ink-muted tabular-nums">{(latency_ms / 1000).toFixed(1)}s</span>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {stages.map((label, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <StageName state="done">{label}</StageName>
            {i < stages.length - 1 && <span className="rail-line done w-6" />}
          </div>
        ))}
      </div>

      {showFlags && risk_flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {risk_flags.map((flag, i) => (
            <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded-[3px] border
                                     border-risk-medium/40 bg-risk-medium/[0.07] text-risk-medium">
              {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
 
/*
 * PipelineRail — the signature element.
 *
 * While a query is processing (live mode), the rail animates through the
 * expected LangGraph path: orchestrator lights first, then a routing hold,
 * then security/log. When the real response arrives (trace mode), the rail
 * re-renders with the ACTUAL tools_used from the backend, each node stamped
 * complete, with intent and latency.
 */
 
const NODE_META = {
  orchestrator:    { label: 'ORCHESTRATE', tone: 'text-gold',      ring: 'border-gold-dim' },
  analytics_agent: { label: 'ANALYTICS',   tone: 'text-steel',     ring: 'border-steel-dim' },
  risk_agent:      { label: 'RISK/FRAUD',  tone: 'text-risk-medium', ring: 'border-risk-medium/40' },
  policy_agent:    { label: 'POLICY RAG',  tone: 'text-risk-low',  ring: 'border-risk-low/40' },
  security_node:   { label: 'PII MASK',    tone: 'text-risk-high', ring: 'border-risk-high/40' },
  logging_node:    { label: 'AUDIT LOG',   tone: 'text-ink-200',   ring: 'border-ink-500' },
}
 
function Node({ id, state }) {
  const meta = NODE_META[id] || { label: id.toUpperCase(), tone: 'text-ink-200', ring: 'border-ink-500' }
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className={`rail-node w-7 h-7 border bg-ink-900 flex items-center justify-center
        ${state === 'active' ? 'active' : state === 'done' ? `done ${meta.ring}` : 'border-ink-600'}`}>
        {state === 'done'
          ? <Check className={`w-3 h-3 ${meta.tone}`} />
          : state === 'active'
            ? <span className="w-1.5 h-1.5 bg-gold animate-pulse-soft" />
            : <span className="w-1.5 h-1.5 bg-ink-600" />}
      </div>
      <span className={`font-mono text-[9px] tracking-widest2 ${
        state === 'pending' ? 'text-ink-500' : meta.tone
      }`}>
        {meta.label}
      </span>
    </div>
  )
}
 
// ── LIVE MODE: animates while waiting for the API ─────────────
export function LiveRail() {
  const [step, setStep] = useState(0)
  // Simulated progression: orchestrator → routing hold → masking → logging
  // Steps advance on a timer; real completion replaces this component.
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 900),    // orchestrator done, agents working
      setTimeout(() => setStep(2), 4200),   // agents done, security working
      setTimeout(() => setStep(3), 5200),   // security done, logging
    ]
    return () => timers.forEach(clearTimeout)
  }, [])
 
  const nodes = ['orchestrator', 'agents', 'security_node', 'logging_node']
  const agentMeta = { label: 'ROUTING…', tone: 'text-ink-200' }
 
  return (
    <div className="flex items-center gap-2 py-1">
      {nodes.map((id, i) => (
        <div key={id} className="flex items-center gap-2 flex-1 min-w-0 last:flex-initial">
          {id === 'agents' ? (
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`rail-node w-7 h-7 border bg-ink-900 flex items-center justify-center
                ${step === 1 ? 'active' : step > 1 ? 'done border-ink-500' : 'border-ink-600'}`}>
                {step > 1 ? <Check className="w-3 h-3 text-ink-200" />
                  : step === 1 ? <span className="w-1.5 h-1.5 bg-gold animate-pulse-soft" />
                  : <span className="w-1.5 h-1.5 bg-ink-600" />}
              </div>
              <span className="font-mono text-[9px] tracking-widest2 text-ink-300">{agentMeta.label}</span>
            </div>
          ) : (
            <Node id={id} state={
              (id === 'orchestrator' && step >= 1) ? 'done' :
              (id === 'orchestrator') ? 'active' :
              (id === 'security_node' && step >= 3) ? 'done' :
              (id === 'security_node' && step === 2) ? 'active' :
              (id === 'logging_node' && step === 3) ? 'active' :
              'pending'
            } />
          )}
          {i < nodes.length - 1 && (
            <div className={`rail-connector flex-1 min-w-4 mb-4 ${
              (i === 0 && step === 0) || (i === 1 && step === 1) || (i === 2 && step === 2) ? 'active' :
              (i === 0 && step >= 1) || (i === 1 && step >= 2) || (i === 2 && step >= 3) ? 'done' : ''
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}
 
// ── TRACE MODE: renders the real pipeline after completion ────
export function TraceRail({ trace }) {
  if (!trace?.tools_used?.length) return null
  const { tools_used, intent, latency_ms, risk_flags = [] } = trace
 
  return (
    <div className="mt-3 pt-3 border-t border-ink-700">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase">Execution Trace</span>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-gold uppercase tracking-widest2">{intent}</span>
          <span className="text-ink-300">{(latency_ms / 1000).toFixed(1)}s</span>
        </div>
      </div>
 
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tools_used.map((tool, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <Node id={tool} state="done" />
            {i < tools_used.length - 1 && <div className="rail-connector done w-5 mb-4" />}
          </div>
        ))}
      </div>
 
      {risk_flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {risk_flags.map((flag, i) => (
            <span key={i} className="font-mono text-[10px] px-2 py-0.5 border border-risk-medium/30
                                     bg-risk-medium/10 text-risk-medium">
              ⚑ {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
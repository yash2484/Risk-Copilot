import { Clock, Cpu, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

// Map agent names to display labels and colors
const NODE_STYLES = {
  orchestrator:    { label: 'Orchestrator',   color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  analytics_agent: { label: 'Analytics',      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  risk_agent:      { label: 'Risk / Fraud',   color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  policy_agent:    { label: 'Policy RAG',     color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  security_node:   { label: 'Security',       color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  logging_node:    { label: 'Audit Log',      color: 'bg-base-500/20 text-base-200 border-base-500/30' },
}

const INTENT_COLORS = {
  analytics:  'text-blue-400',
  risk_fraud: 'text-orange-400',
  policy:     'text-green-400',
  mixed:      'text-purple-400',
}

export default function AgentTrace({ data }) {
  const [expanded, setExpanded] = useState(false)
  if (!data) return null

  const { intent, tools_used = [], risk_flags = [], latency_ms } = data

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-base-300 hover:text-base-100 transition-colors"
      >
        <Cpu className="w-3.5 h-3.5" />
        <span className="font-medium">Agent Trace</span>
        <span className={`font-mono ${INTENT_COLORS[intent] || 'text-base-200'}`}>
          {intent}
        </span>
        <span className="text-base-400">·</span>
        <Clock className="w-3 h-3 text-base-400" />
        <span className="text-base-400 font-mono">{latency_ms?.toFixed(0)}ms</span>
        {risk_flags.length > 0 && (
          <>
            <span className="text-base-400">·</span>
            <AlertTriangle className="w-3 h-3 text-risk-medium" />
            <span className="text-risk-medium">{risk_flags.length} flag{risk_flags.length > 1 ? 's' : ''}</span>
          </>
        )}
        {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-base-800/50 rounded-lg border border-base-600 animate-fade-in">
          {/* Pipeline flow */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tools_used.map((tool, i) => {
              const style = NODE_STYLES[tool] || { label: tool, color: 'bg-base-600/30 text-base-200 border-base-500/30' }
              return (
                <div key={i} className="trace-node flex items-center gap-1.5">
                  <span className={`px-2 py-1 rounded-md text-xs font-mono border ${style.color}`}>
                    {style.label}
                  </span>
                  {i < tools_used.length - 1 && (
                    <span className="text-base-400 text-xs">→</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Risk flags */}
          {risk_flags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-base-600">
              <div className="flex flex-wrap gap-1.5">
                {risk_flags.map((flag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs font-mono bg-risk-medium/10 text-risk-medium border border-risk-medium/20">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
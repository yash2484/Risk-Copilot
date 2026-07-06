import { useState, useEffect, useRef } from 'react'
import { TraceRail } from './PipelineRail'

/* ── Parse the risk-agent response into structured data ──────────────────────
   Format (from src/nodes/risk_node.py, after PII masking):
   "Customer CUST_****: combined risk score 65.7 (rule=45, ml=86.5%).
    Key drivers: times 90d late increases risk (+0.305); … . Flags: A, B."
   Returns null for any response that isn't a single-customer risk score, so
   analytics / policy / mixed answers fall through to plain text. */
function parseRisk(text) {
  if (!text) return null
  const score = text.match(/combined risk score ([\d.]+)\s*\(rule=(\d+),\s*ml=([\d.]+)%\)/i)
  if (!score) return null
  const subject = text.match(/Customer\s+(CUST_[*\d]+)/i)?.[1] ?? 'CUST_****'
  const driversBlock = text.match(/Key drivers:\s*(.+?)\.\s*Flags:/is)?.[1] ?? ''
  const drivers = driversBlock
    .split(';')
    .map(s => s.trim().match(/^(.+?)\s+(increases|decreases)\s+risk\s*\(([+-][\d.]+)\)/i))
    .filter(Boolean)
    .map(m => ({ feature: m[1].trim(), dir: m[2].toLowerCase(), value: parseFloat(m[3]) }))
  const flagsRaw = text.match(/Flags:\s*(.+?)\.?\s*$/is)?.[1]?.trim() ?? ''
  const flags = (!flagsRaw || /^none$/i.test(flagsRaw)) ? [] : flagsRaw.split(',').map(f => f.trim())
  return {
    subject,
    combined: parseFloat(score[1]),
    rule: parseInt(score[2], 10),
    ml: parseFloat(score[3]),
    drivers,
    flags,
  }
}

const scoreBand = (v) => v >= 60 ? 'high' : v >= 35 ? 'medium' : 'low'
const BAND = {
  high:   { label: 'HIGH',   text: 'text-risk-high',   bg: 'bg-risk-high' },
  medium: { label: 'MEDIUM', text: 'text-risk-medium', bg: 'bg-risk-medium' },
  low:    { label: 'LOW',    text: 'text-risk-low',    bg: 'bg-risk-low' },
}

const RED_FLAGS = new Set(['HIGH_UTILIZATION', 'CHARGE_OFF', 'BRUTE_FORCE_SUSPECT'])
const AMBER_FLAGS = new Set(['DELINQUENT', 'MULTIPLE_FAILED_LOGINS'])
const flagTone = (f) =>
  RED_FLAGS.has(f)   ? 'text-risk-high border-risk-high/40 bg-risk-high/[0.06]' :
  AMBER_FLAGS.has(f) ? 'text-risk-medium border-risk-medium/40 bg-risk-medium/[0.07]' :
                       'text-accent border-accent/35 bg-accent/[0.06]'

// One SHAP driver as a diverging bar around a centre (zero) axis.
function ShapBar({ feature, value, maxAbs }) {
  const positive = value > 0
  const width = `${Math.max(4, (Math.abs(value) / maxAbs) * 46)}%`
  return (
    <div className="grid grid-cols-[120px_1fr_54px] items-center gap-3">
      <span className="text-[12.5px] text-ink-text truncate">{feature}</span>
      <div className="relative h-[10px] bg-ink/[0.05] rounded-[2px]">
        <div className="absolute left-1/2 -top-0.5 -bottom-0.5 w-px bg-ink/20" />
        <div
          className={`shap-bar absolute top-0 bottom-0 animate-draw ${positive ? 'bg-risk-high' : 'bg-risk-low'}`}
          style={{
            width,
            [positive ? 'left' : 'right']: '50%',
            '--origin': positive ? 'left' : 'right',
            borderRadius: positive ? '0 2px 2px 0' : '2px 0 0 2px',
          }}
        />
      </div>
      <span className={`font-mono text-[11px] tabular-nums text-right ${positive ? 'text-risk-high' : 'text-risk-low'}`}>
        {value > 0 ? '+' : '−'}{Math.abs(value).toFixed(3)}
      </span>
    </div>
  )
}

function RiskReport({ data }) {
  const band = BAND[scoreBand(data.combined)]
  const maxAbs = Math.max(...data.drivers.map(d => Math.abs(d.value)), 0.001)
  return (
    <div>
      {/* Subject + the single loud number */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest2 uppercase text-ink-faint">Subject</p>
          <p className="text-[16px] font-semibold text-ink mt-0.5">{data.subject}</p>
          <p className="font-mono text-[11px] text-ink-muted mt-0.5 tabular-nums">
            rule {data.rule} · ml {data.ml.toFixed(1)}%
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-widest2 uppercase text-ink-faint">Combined risk</p>
          <div className="flex items-baseline gap-2 justify-end mt-0.5">
            <span className="text-[38px] leading-none font-semibold text-ink tabular-nums tracking-[-0.02em]">
              {data.combined.toFixed(1)}
            </span>
            <span className={`text-[10px] font-semibold text-white ${band.bg} px-1.5 py-0.5 rounded-[3px]`}>{band.label}</span>
          </div>
        </div>
      </div>

      {data.drivers.length > 0 && (
        <>
          <div className="h-px bg-ink/[0.12] my-4" />
          <p className="font-mono text-[10px] tracking-widest2 uppercase text-ink-faint mb-2.5">Key drivers · SHAP</p>
          <div className="flex flex-col gap-2.5">
            {data.drivers.map((d, i) => <ShapBar key={i} feature={d.feature} value={d.value} maxAbs={maxAbs} />)}
          </div>
        </>
      )}

      {data.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {data.flags.map((f, i) => (
            <span key={i} className={`font-mono text-[10.5px] px-2 py-0.5 rounded-[3px] border ${flagTone(f)}`}>{f}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeWriter({ text, onComplete }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!text) return
    indexRef.current = 0
    setDisplayed('')
    setDone(false)
    const chunk = text.length > 400 ? 4 : text.length > 200 ? 3 : 2
    const interval = setInterval(() => {
      indexRef.current += 1
      const next = Math.min(indexRef.current * chunk, text.length)
      setDisplayed(text.slice(0, next))
      if (next >= text.length) { clearInterval(interval); setDone(true); onComplete?.() }
    }, 11)
    return () => clearInterval(interval)
  }, [text])

  return <span className={done ? '' : 'typing-cursor'}>{displayed}</span>
}

export default function ChatMessage({ message }) {
  const { role, content, trace, isTyping, timestamp } = message
  const [typingDone, setTypingDone] = useState(!isTyping)
  const risk = role === 'assistant' ? parseRisk(content) : null

  if (role === 'user') {
    return (
      <div className="animate-rise mb-6">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-mono text-[10px] text-ink-faint tracking-widest2 uppercase">Inquiry</span>
          {timestamp && <span className="font-mono text-[10px] text-ink-faint tabular-nums">{timestamp}</span>}
        </div>
        <div className="border-l-2 border-accent pl-4 py-0.5">
          <p className="text-[14px] text-ink leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise mb-8">
      <div className="bg-paper-raised border border-ink/[0.12] rounded-[7px] shadow-card p-5">
        {/* Report header + workflow stamp */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-ink/[0.1]">
          <span className="font-mono text-[10px] text-ink-faint tracking-widest2 uppercase">Response</span>
          {trace?.workflow_id && (
            <span className="stamp font-mono text-[10px] text-accent border border-accent/35 rounded px-2 py-0.5">
              REF {trace.workflow_id.slice(0, 8).toUpperCase()}
            </span>
          )}
        </div>

        {/* Structured risk report, or narrative text */}
        {risk ? (
          <RiskReport data={risk} />
        ) : (
          <div className="text-[14px] text-ink-text leading-[1.7] whitespace-pre-wrap">
            {isTyping ? <TypeWriter text={content} onComplete={() => setTypingDone(true)} /> : content}
          </div>
        )}

        {(risk || !isTyping || typingDone) && trace && <TraceRail trace={trace} showFlags={!risk} />}
      </div>
    </div>
  )
}

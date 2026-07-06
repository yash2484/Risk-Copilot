import { useState, useEffect, useRef } from 'react'
import { RefreshCw, AlertTriangle, PanelLeft } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ZAxis
} from 'recharts'

// Segment identity colours, tuned to the ledger palette (accent + semaphore + steel).
const SEGMENT_TONES = {
  Subprime:      '#B23A31', // risk-high
  Standard:      '#21456E', // accent
  New_To_Credit: '#9C6612', // risk-medium
  High_Value:    '#2E7D46', // risk-low
  Premium:       '#5B7A9E', // steel
}

const AXIS_TICK = { fill: '#726B5D', fontSize: 10, fontFamily: 'IBM Plex Mono' }
const GRID_STROKE = 'rgba(27,23,18,0.08)'
const AXIS_STROKE = 'rgba(27,23,18,0.14)'

function CountUp({ value, decimals = 0, suffix = '', duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  useEffect(() => {
    if (value == null) return
    startRef.current = null
    let raf
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>
}

function Metric({ label, value, decimals = 0, suffix = '', note, tone = 'text-ink' }) {
  return (
    <div className="bg-paper-raised border border-ink/[0.12] rounded-[7px] shadow-card p-5">
      <p className="font-mono text-[10px] text-ink-faint tracking-widest2 uppercase">{label}</p>
      <p className={`font-mono text-[28px] mt-2 tabular-nums ${tone}`}>
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </p>
      {note && <p className="font-mono text-[10px] text-ink-faint mt-1">{note}</p>}
    </div>
  )
}

function Panel({ title, children, right }) {
  return (
    <div className="bg-paper-raised border border-ink/[0.12] rounded-[7px] shadow-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-mono text-[10px] text-ink-faint tracking-widest2 uppercase">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

function LedgerTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-paper-raised border border-ink/[0.16] rounded-[5px] px-3 py-2 shadow-lift">
      <p className="font-mono text-[11px] text-ink mb-1">{label || payload[0]?.payload?.segment}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-[11px] text-ink-text tabular-nums">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard({ onToggleNav }) {
  const [segments, setSegments] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [segRes, metRes] = await Promise.all([fetch('/analytics/segments'), fetch('/metrics')])
      if (!segRes.ok) throw new Error('Segment data unavailable')
      setSegments(await segRes.json())
      setMetrics(metRes.ok ? await metRes.json() : null)
    } catch (err) {
      setError(`${err.message}. Start the API: uvicorn src.api.main:app --reload --port 8000`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const Header = () => (
    <header className="px-6 py-3.5 border-b border-ink/[0.12] bg-paper/70 backdrop-blur-sm flex items-center gap-3 sticky top-0 z-10">
      <button onClick={onToggleNav} aria-label="Toggle sidebar (Ctrl+B)"
        className="p-1.5 -ml-1 rounded-[5px] text-ink-muted hover:text-ink hover:bg-ink/[0.05]">
        <PanelLeft className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <h2 className="text-[16px] font-semibold text-ink tracking-[-0.01em] leading-tight">Portfolio Ledger</h2>
        <p className="font-mono text-[10px] text-ink-muted tracking-widest2 uppercase mt-0.5">50,000 accounts · live DuckDB aggregation</p>
      </div>
      <button onClick={fetchData} className="p-2 rounded-[5px] border border-ink/[0.12] hover:border-accent/40 text-ink-muted hover:text-ink" aria-label="Refresh">
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </header>
  )

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-[11px] text-ink-muted tracking-widest2 uppercase animate-pulse-soft">Loading portfolio…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <AlertTriangle className="w-6 h-6 text-risk-high mx-auto mb-3" />
            <p className="text-[13px] text-ink-text mb-4">{error}</p>
            <button onClick={fetchData}
              className="px-4 py-2 rounded-[6px] border border-ink/[0.16] hover:border-accent/50 text-[13px] text-ink-text hover:text-ink">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalCustomers = segments?.reduce((s, r) => s + r.customers, 0) || 0
  const weightedDelinq = totalCustomers
    ? segments.reduce((s, r) => s + r.delinq_pct * r.customers, 0) / totalCustomers : 0
  const highest = segments?.[0]
  const totalDelinquents = segments?.reduce((s, r) => s + (r.delinq_pct / 100) * r.customers, 0) || 1
  const concentration = segments?.map(r => ({
    ...r,
    delinquents: Math.round((r.delinq_pct / 100) * r.customers),
    share: ((r.delinq_pct / 100) * r.customers) / totalDelinquents * 100,
  }))

  return (
    <div className="h-full overflow-y-auto">
      <Header />
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric label="Accounts" value={totalCustomers} note="5 segments" />
          <Metric label="Portfolio Delinquency" value={weightedDelinq} decimals={2} suffix="%"
                  note="weighted by segment size" tone="text-risk-medium" />
          <Metric label="Highest Risk Segment" value={highest?.delinq_pct} decimals={2} suffix="%"
                  note={highest?.segment} tone="text-risk-high" />
          <Metric label="Queries Logged" value={metrics?.total_queries || 0}
                  note={metrics?.avg_latency_ms ? `avg ${(metrics.avg_latency_ms / 1000).toFixed(1)}s` : 'audit trail'} tone="text-accent" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Delinquency by Segment" right={<span className="font-mono text-[10px] text-ink-faint">%</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={segments} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="segment" tick={AXIS_TICK} axisLine={{ stroke: AXIS_STROKE }} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<LedgerTooltip />} cursor={{ fill: 'rgba(33,69,110,0.05)' }} />
                <Bar dataKey="delinq_pct" name="Delinquency %" maxBarSize={42} radius={[2, 2, 0, 0]}>
                  {segments?.map((row, i) => (
                    <Cell key={i} fill={SEGMENT_TONES[row.segment] || '#21456E'} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Utilization vs Delinquency" right={<span className="font-mono text-[10px] text-ink-faint">bubble = accounts</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                <XAxis dataKey="util_pct" name="Utilization %" unit="%" tick={AXIS_TICK} axisLine={{ stroke: AXIS_STROKE }} tickLine={false} />
                <YAxis dataKey="delinq_pct" name="Delinquency %" unit="%" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <ZAxis dataKey="customers" range={[120, 900]} name="Accounts" />
                <Tooltip content={<LedgerTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(27,23,18,0.2)' }} />
                <Scatter data={segments}>
                  {segments?.map((row, i) => (
                    <Cell key={i} fill={SEGMENT_TONES[row.segment] || '#21456E'} fillOpacity={0.82} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <Panel title="Where the Delinquents Are" right={<span className="font-mono text-[10px] text-ink-faint">share of all delinquent accounts</span>}>
          <div className="flex h-8 overflow-hidden rounded-[4px] border border-ink/[0.12]">
            {concentration?.map((row, i) => (
              <div key={i} style={{ width: `${row.share}%`, backgroundColor: SEGMENT_TONES[row.segment] }}
                className="relative transition-opacity hover:opacity-90"
                title={`${row.segment}: ${row.delinquents.toLocaleString()} delinquents (${row.share.toFixed(1)}%)`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
            {concentration?.map((row, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: SEGMENT_TONES[row.segment] }} />
                <span className="font-mono text-[10px] text-ink-muted">
                  {row.segment} <span className="text-ink tabular-nums">{row.share.toFixed(1)}%</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Segment Ledger">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink/[0.14]">
                {['Segment', 'Accounts', 'Delinquency', 'Utilization', 'Avg Risk'].map((h, i) => (
                  <th key={h} className={`font-mono text-[10px] text-ink-faint tracking-widest2 uppercase py-2
                    ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {segments?.map((row, i) => (
                <tr key={i} className="border-b border-ink/[0.08] hover:bg-ink/[0.03] transition-colors">
                  <td className="py-2.5 text-[13px] text-ink flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-[2px]" style={{ backgroundColor: SEGMENT_TONES[row.segment] }} />
                    {row.segment}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[12px] text-ink-text tabular-nums">{row.customers?.toLocaleString()}</td>
                  <td className={`py-2.5 text-right font-mono text-[12px] tabular-nums ${
                    row.delinq_pct > 10 ? 'text-risk-high' : row.delinq_pct > 5 ? 'text-risk-medium' : 'text-risk-low'
                  }`}>{row.delinq_pct}%</td>
                  <td className="py-2.5 text-right font-mono text-[12px] text-ink-text tabular-nums">{row.util_pct}%</td>
                  <td className="py-2.5 text-right font-mono text-[12px] text-ink-text tabular-nums">{row.avg_risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}

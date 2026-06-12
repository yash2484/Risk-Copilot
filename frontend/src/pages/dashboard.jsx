import { useState, useEffect, useRef } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ZAxis
} from 'recharts'
 
const SEGMENT_TONES = {
  Subprime:      '#E06450',
  Standard:      '#6B9BD2',
  New_To_Credit: '#E0A83E',
  High_Value:    '#3FB970',
  Premium:       '#C9A961',
}
 
// ── Count-up number animation ─────────────────────────────────
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
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
 
  return <>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>
}
 
function Metric({ label, value, decimals = 0, suffix = '', note, tone = 'text-bone' }) {
  return (
    <div className="bg-ink-900 border border-ink-700 p-5">
      <p className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase">{label}</p>
      <p className={`font-mono text-[28px] mt-2 ${tone}`}>
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </p>
      {note && <p className="font-mono text-[10px] text-ink-400 mt-1">{note}</p>}
    </div>
  )
}
 
function Panel({ title, children, right }) {
  return (
    <div className="bg-ink-900 border border-ink-700 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}
 
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-800 border border-ink-600 px-3 py-2 shadow-xl">
      <p className="font-mono text-[11px] text-bone mb-1">{label || payload[0]?.payload?.segment}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-[11px] text-ink-200">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
        </p>
      ))}
    </div>
  )
}
 
export default function Dashboard() {
  const [segments, setSegments] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
 
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [segRes, metRes] = await Promise.all([
        fetch('/analytics/segments'),
        fetch('/metrics'),
      ])
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
 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-mono text-[11px] text-ink-300 tracking-widest2 uppercase animate-pulse-soft">
          Loading portfolio…
        </p>
      </div>
    )
  }
 
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-6 h-6 text-risk-high mx-auto mb-3" />
          <p className="text-[13px] text-ink-200 mb-4">{error}</p>
          <button onClick={fetchData}
            className="px-4 py-2 border border-ink-600 hover:border-gold-dim text-[13px] text-ink-200 hover:text-bone">
            Retry
          </button>
        </div>
      </div>
    )
  }
 
  const totalCustomers = segments?.reduce((s, r) => s + r.customers, 0) || 0
  const weightedDelinq = totalCustomers
    ? segments.reduce((s, r) => s + r.delinq_pct * r.customers, 0) / totalCustomers
    : 0
  const highest = segments?.[0]
 
  // Risk concentration: share of delinquents per segment
  const totalDelinquents = segments?.reduce((s, r) => s + (r.delinq_pct / 100) * r.customers, 0) || 1
  const concentration = segments?.map(r => ({
    ...r,
    delinquents: Math.round((r.delinq_pct / 100) * r.customers),
    share: ((r.delinq_pct / 100) * r.customers) / totalDelinquents * 100,
  }))
 
  return (
    <div className="h-full overflow-y-auto">
      <header className="px-8 py-4 border-b border-ink-700 bg-ink-900/60 backdrop-blur-sm flex items-baseline justify-between sticky top-0 z-10">
        <div>
          <h2 className="font-display text-[17px] text-bone">Portfolio Ledger</h2>
          <p className="font-mono text-[10px] text-ink-300 tracking-widest2 uppercase mt-0.5">
            50,000 accounts · live DuckDB aggregation
          </p>
        </div>
        <button onClick={fetchData} className="p-2 border border-ink-700 hover:border-ink-500 text-ink-300 hover:text-bone" aria-label="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>
 
      <div className="px-8 py-6 max-w-6xl mx-auto space-y-5">
 
        {/* ── Headline metrics ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric label="Accounts" value={totalCustomers} note="5 segments" />
          <Metric label="Portfolio Delinquency" value={weightedDelinq} decimals={2} suffix="%"
                  note="weighted by segment size" tone="text-risk-medium" />
          <Metric label="Highest Risk Segment" value={highest?.delinq_pct} decimals={2} suffix="%"
                  note={highest?.segment} tone="text-risk-high" />
          <Metric label="Queries Logged" value={metrics?.total_queries || 0}
                  note={metrics?.avg_latency_ms ? `avg ${(metrics.avg_latency_ms / 1000).toFixed(1)}s` : 'audit trail'} tone="text-gold" />
        </div>
 
        {/* ── Charts ────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Delinquency by Segment" right={<span className="font-mono text-[10px] text-ink-400">%</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={segments} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#222837" vertical={false} />
                <XAxis dataKey="segment" tick={{ fill: '#8B93A7', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                       axisLine={{ stroke: '#222837' }} tickLine={false} />
                <YAxis tick={{ fill: '#8B93A7', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                       axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(201,169,97,0.05)' }} />
                <Bar dataKey="delinq_pct" name="Delinquency %" maxBarSize={42}>
                  {segments?.map((row, i) => (
                    <Cell key={i} fill={SEGMENT_TONES[row.segment] || '#6B9BD2'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
 
          <Panel title="Utilization vs Delinquency" right={<span className="font-mono text-[10px] text-ink-400">bubble = accounts</span>}>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#222837" />
                <XAxis dataKey="util_pct" name="Utilization %" unit="%"
                       tick={{ fill: '#8B93A7', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                       axisLine={{ stroke: '#222837' }} tickLine={false} />
                <YAxis dataKey="delinq_pct" name="Delinquency %" unit="%"
                       tick={{ fill: '#8B93A7', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                       axisLine={false} tickLine={false} />
                <ZAxis dataKey="customers" range={[120, 900]} name="Accounts" />
                <Tooltip content={<DarkTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#3D4556' }} />
                <Scatter data={segments}>
                  {segments?.map((row, i) => (
                    <Cell key={i} fill={SEGMENT_TONES[row.segment] || '#6B9BD2'} fillOpacity={0.75} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>
        </div>
 
        {/* ── Risk concentration strip ──────────────────── */}
        <Panel title="Where the Delinquents Are" right={<span className="font-mono text-[10px] text-ink-400">share of all delinquent accounts</span>}>
          <div className="flex h-8 overflow-hidden border border-ink-700">
            {concentration?.map((row, i) => (
              <div key={i}
                style={{ width: `${row.share}%`, backgroundColor: SEGMENT_TONES[row.segment] }}
                className="relative group transition-opacity hover:opacity-90"
                title={`${row.segment}: ${row.delinquents.toLocaleString()} delinquents (${row.share.toFixed(1)}%)`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
            {concentration?.map((row, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2" style={{ backgroundColor: SEGMENT_TONES[row.segment] }} />
                <span className="font-mono text-[10px] text-ink-300">
                  {row.segment} <span className="text-bone">{row.share.toFixed(1)}%</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>
 
        {/* ── Segment ledger table ──────────────────────── */}
        <Panel title="Segment Ledger">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-700">
                {['Segment', 'Accounts', 'Delinquency', 'Utilization', 'Avg Risk'].map((h, i) => (
                  <th key={h} className={`font-mono text-[10px] text-ink-400 tracking-widest2 uppercase py-2
                    ${i === 0 ? 'text-left' : 'text-right'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {segments?.map((row, i) => (
                <tr key={i} className="border-b border-ink-800 hover:bg-ink-800/50 transition-colors">
                  <td className="py-2.5 text-[13px] text-bone flex items-center gap-2">
                    <span className="w-1.5 h-1.5" style={{ backgroundColor: SEGMENT_TONES[row.segment] }} />
                    {row.segment}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[12px] text-ink-200">{row.customers?.toLocaleString()}</td>
                  <td className={`py-2.5 text-right font-mono text-[12px] ${
                    row.delinq_pct > 10 ? 'text-risk-high' : row.delinq_pct > 5 ? 'text-risk-medium' : 'text-risk-low'
                  }`}>{row.delinq_pct}%</td>
                  <td className="py-2.5 text-right font-mono text-[12px] text-ink-200">{row.util_pct}%</td>
                  <td className="py-2.5 text-right font-mono text-[12px] text-ink-200">{row.avg_risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, PieChart, Pie, Legend
} from 'recharts'

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#22C55E', '#06B6D4']

function MetricCard({ label, value, sub, icon: Icon, color = 'text-accent' }) {
  return (
    <div className="bg-base-700 border border-base-600 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-base-300 uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-base-400 mt-1">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-base-700 border border-base-600 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-base-100 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// Custom tooltip for dark theme
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-base-800 border border-base-600 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-base-100 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-base-300">
          <span style={{ color: p.color }}>{p.name}:</span> {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
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
      if (!segRes.ok) throw new Error('Failed to fetch segment data')
      setSegments(await segRes.json())
      setMetrics(metRes.ok ? await metRes.json() : null)
    } catch (err) {
      setError(err.message + '. Is the FastAPI server running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-base-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
          <p className="text-sm text-base-300">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-base-900">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-8 h-8 text-risk-high mx-auto mb-3" />
          <p className="text-sm text-base-200 mb-3">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-accent rounded-lg text-sm text-white hover:bg-accent-hover">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const totalCustomers = segments?.reduce((s, r) => s + r.customers, 0) || 0
  const avgDelinquency = segments?.length
    ? (segments.reduce((s, r) => s + r.delinq_pct * r.customers, 0) / totalCustomers).toFixed(2)
    : '0'
  const highestRiskSeg = segments?.[0]?.segment || 'N/A'

  return (
    <div className="h-full overflow-y-auto bg-base-900">
      {/* Header */}
      <header className="px-6 py-4 border-b border-base-600 bg-base-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-base-50">Portfolio Analytics Dashboard</h2>
          <p className="text-xs text-base-300 mt-0.5">Real-time portfolio health from DuckDB queries on 750K+ synthetic rows</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg hover:bg-base-700 text-base-300 hover:text-base-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <div className="p-6 space-y-6">
        {/* ── Metric Cards ──────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Total Customers" value={totalCustomers.toLocaleString()} sub="Across 5 segments" icon={Users} />
          <MetricCard label="Avg Delinquency" value={`${avgDelinquency}%`} sub="Weighted by segment size" icon={TrendingUp} color="text-risk-medium" />
          <MetricCard label="Highest Risk" value={highestRiskSeg} sub={`${segments?.[0]?.delinq_pct}% delinquency`} icon={AlertTriangle} color="text-risk-high" />
          <MetricCard label="Queries Processed" value={metrics?.total_queries || 0} sub={`Avg ${metrics?.avg_latency_ms?.toFixed(0) || 0}ms latency`} icon={BarChart3} />
        </div>

        {/* ── Charts Row ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Delinquency by Segment */}
          <ChartCard title="Delinquency Rate by Segment">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={segments} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="segment" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="delinq_pct" name="Delinquency %" radius={[4, 4, 0, 0]}>
                  {segments?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Utilization vs Delinquency scatter */}
          <ChartCard title="Utilization vs Delinquency by Segment">
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="util_pct" name="Utilization %" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} />
                <YAxis dataKey="delinq_pct" name="Delinquency %" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} />
                <Tooltip content={<DarkTooltip />} />
                <Scatter data={segments} name="Segments">
                  {segments?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Segment Distribution Pie + Table ──────────── */}
        <div className="grid grid-cols-3 gap-4">
          <ChartCard title="Customer Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="customers"
                  nameKey="segment"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {segments?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Segment Summary Table */}
          <div className="col-span-2 bg-base-700 border border-base-600 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-base-100 mb-4">Segment Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-base-600">
                    <th className="text-left py-2 px-3 text-xs font-medium text-base-300 uppercase tracking-wider">Segment</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-base-300 uppercase tracking-wider">Customers</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-base-300 uppercase tracking-wider">Delinquency %</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-base-300 uppercase tracking-wider">Utilization %</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-base-300 uppercase tracking-wider">Avg Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {segments?.map((row, i) => (
                    <tr key={i} className="border-b border-base-600/50 hover:bg-base-600/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-base-100">{row.segment}</td>
                      <td className="py-2.5 px-3 text-right text-base-200 font-mono">{row.customers?.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={row.delinq_pct > 10 ? 'text-risk-high' : row.delinq_pct > 5 ? 'text-risk-medium' : 'text-risk-low'}>
                          {row.delinq_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-base-200 font-mono">{row.util_pct}%</td>
                      <td className="py-2.5 px-3 text-right text-base-200 font-mono">{row.avg_risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Intent Breakdown (from /metrics) ──────────── */}
        {metrics?.intent_breakdown && Object.keys(metrics.intent_breakdown).length > 0 && (
          <ChartCard title="Query Intent Distribution">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(metrics.intent_breakdown).map(([k, v]) => ({ intent: k, count: v }))}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="intent" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Queries" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  )
}
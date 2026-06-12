import { useState, useEffect, useRef } from 'react'
import { Search, BarChart3, ShieldAlert, BookOpen, GitMerge } from 'lucide-react'
 
const QUERIES = [
  { cat: 'Analytics', icon: BarChart3, tone: 'text-steel', items: [
    'Show segments with the highest delinquency rate',
    'Show cross-border spending patterns by segment',
  ]},
  { cat: 'Risk / Fraud', icon: ShieldAlert, tone: 'text-risk-medium', items: [
    'Investigate customer CUST_000042',
    'Investigate customer CUST_029679 and summarize their risk',
  ]},
  { cat: 'Policy', icon: BookOpen, tone: 'text-risk-low', items: [
    'What does policy say about credit line increases?',
    'When does an account get charged off?',
    'What are the escalation steps for cross-border transactions?',
  ]},
  { cat: 'Mixed', icon: GitMerge, tone: 'text-gold', items: [
    'Customer CUST_000042 has a high risk score — what action does policy recommend?',
    'Customer CUST_029679 shows login anomalies — what does the incident playbook say?',
  ]},
]
 
export default function CommandPalette({ open, onClose }) {
  const [filter, setFilter] = useState('')
  const inputRef = useRef(null)
 
  useEffect(() => {
    if (open) {
      setFilter('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])
 
  if (!open) return null
 
  const send = (query) => {
    window.dispatchEvent(new CustomEvent('example-query', { detail: query }))
    onClose()
  }
 
  const lowerFilter = filter.toLowerCase()
  const filtered = QUERIES.map(group => ({
    ...group,
    items: group.items.filter(q => q.toLowerCase().includes(lowerFilter)),
  })).filter(g => g.items.length > 0)
 
  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-start justify-center pt-[18vh] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-ink-900 border border-ink-600 shadow-2xl animate-rise"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-700">
          <Search className="w-4 h-4 text-ink-400" />
          <input
            ref={inputRef}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search the query library…"
            className="flex-1 bg-transparent text-[14px] text-bone placeholder-ink-400 focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-ink-400 border border-ink-600 px-1.5 py-0.5">ESC</kbd>
        </div>
 
        {/* Query groups */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-ink-400">
              No matching queries. Type your own in the inquiry bar.
            </p>
          )}
          {filtered.map(group => {
            const Icon = group.icon
            return (
              <div key={group.cat} className="px-2 pb-2">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Icon className={`w-3 h-3 ${group.tone}`} />
                  <span className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase">{group.cat}</span>
                </div>
                {group.items.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="w-full text-left px-3 py-2 text-[13px] text-ink-200
                               hover:bg-ink-800 hover:text-bone border-l-2 border-transparent
                               hover:border-gold transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
 
        <div className="px-4 py-2 border-t border-ink-700 flex items-center justify-between">
          <span className="font-mono text-[10px] text-ink-400">↵ to run · esc to close</span>
          <span className="font-mono text-[10px] text-ink-400">{filtered.reduce((s, g) => s + g.items.length, 0)} queries</span>
        </div>
      </div>
    </div>
  )
}
 
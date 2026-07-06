import { useState, useRef, useEffect } from 'react'
import { ArrowUp, PanelLeft, ArrowRight } from 'lucide-react'
import ChatMessage from '../components/ChatMessage'
import { LiveRail } from '../components/PipelineRail'

const now = () =>
  new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

// Starter inquiries surfaced on the empty desk — real routes through the graph.
const STARTERS = [
  { tag: 'Risk',      q: 'Investigate customer CUST_029679 and summarize their risk' },
  { tag: 'Analytics', q: 'Show segments with the highest delinquency rate' },
  { tag: 'Policy',    q: 'What does policy say about credit line increases?' },
  { tag: 'Mixed',     q: 'Customer CUST_029679 has a high risk score — what action does policy recommend?' },
]

const TAG_TONE = {
  Risk: 'text-risk-high', Analytics: 'text-accent', Policy: 'text-risk-low', Mixed: 'text-ink',
}

export default function Chat({ role, onToggleNav }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const handler = (e) => sendMessage(e.detail)
    window.addEventListener('example-query', handler)
    return () => window.removeEventListener('example-query', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, loading])

  const sendMessage = async (overrideText) => {
    const query = (overrideText ?? input).trim()
    if (!query || loading) return

    setMessages(prev => [...prev, { role: 'user', content: query, timestamp: now() }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, user_role: role }),
      })
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'No response generated.',
        trace: {
          workflow_id: data.workflow_id,
          intent:      data.intent,
          tools_used:  data.tools_used,
          risk_flags:  data.risk_flags,
          latency_ms:  data.latency_ms,
        },
        isTyping: true,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Connection failed: ${err.message}. Start the API with: uvicorn src.api.main:app --reload --port 8000`,
        isTyping: false,
      }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="px-6 py-3.5 border-b border-ink/[0.12] bg-paper/70 backdrop-blur-sm flex items-center gap-3">
        <button onClick={onToggleNav} aria-label="Toggle sidebar (Ctrl+B)"
          className="p-1.5 -ml-1 rounded-[5px] text-ink-muted hover:text-ink hover:bg-ink/[0.05]">
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-semibold text-ink tracking-[-0.01em] leading-tight">Inquiry Desk</h2>
          <p className="text-[11px] text-ink-muted leading-tight mt-0.5">Analytics · Risk · Policy — routed automatically</p>
        </div>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest2 shrink-0">
          Clearance <span className={role === 'read_only' ? 'text-risk-medium' : 'text-risk-low'}>· {role.replace('_', ' ')}</span>
        </span>
      </header>

      {/* ── Conversation ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">

          {messages.length === 0 && !loading && (
            <div className="pt-[9vh] animate-fade-in">
              <p className="font-mono text-[10.5px] text-accent tracking-widest2 uppercase mb-3">Multi-agent risk intelligence</p>
              <h3 className="text-[30px] leading-[1.1] font-semibold text-ink tracking-[-0.02em] max-w-lg">
                Ask the portfolio anything.
              </h3>
              <p className="text-[14px] text-ink-muted max-w-md mt-3 leading-relaxed">
                Plain-English questions about delinquency, fraud signals, or internal policy —
                answered with real data, model scores, and cited documents.
              </p>

              {/* Ledger of starting inquiries */}
              <div className="mt-8 border-t border-ink/[0.12]">
                {STARTERS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.q)}
                    className="w-full flex items-center gap-4 py-3 px-1 border-b border-ink/[0.1]
                               text-left group hover:bg-ink/[0.03] transition-colors">
                    <span className={`font-mono text-[10px] tracking-widest2 uppercase w-16 shrink-0 ${TAG_TONE[s.tag]}`}>{s.tag}</span>
                    <span className="flex-1 text-[13.5px] text-ink-text group-hover:text-ink">{s.q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-accent shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}

          {/* Live pipeline while the graph executes */}
          {loading && (
            <div className="animate-rise mb-8">
              <div className="bg-paper-raised border border-ink/[0.12] rounded-[7px] shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] text-ink-muted tracking-widest2 uppercase">Executing pipeline</span>
                  <span className="font-mono text-[10px] text-accent flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft" /> LIVE
                  </span>
                </div>
                <LiveRail />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* ── Input bar ────────────────────────────────────── */}
      <div className="px-6 pb-6 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 border border-ink/[0.16] bg-paper-raised rounded-[8px]
                          focus-within:border-accent/60 focus-within:shadow-focus transition-shadow">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="State your inquiry…"
              rows={1}
              className="flex-1 bg-transparent px-4 py-3.5 text-[14px] text-ink placeholder-ink-faint
                         focus:outline-none resize-none"
              style={{ minHeight: '50px', maxHeight: '140px' }}
              onInput={e => { e.target.style.height = '50px'; e.target.style.height = e.target.scrollHeight + 'px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="m-2 w-9 h-9 rounded-[6px] bg-accent hover:bg-accent-rich disabled:bg-ink-disabled
                         disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              aria-label="Send inquiry"
            >
              <ArrowUp className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="font-mono text-[10px] text-ink-faint mt-2 text-center tracking-wide">
            ENTER to send · SHIFT+ENTER newline · ⌘K library · ⌘B rail
          </p>
        </div>
      </div>
    </div>
  )
}

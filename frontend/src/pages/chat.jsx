import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Command } from 'lucide-react'
import ChatMessage from '../components/ChatMessage'
import { LiveRail } from '../components/PipelineRail'
 
const now = () =>
  new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
 
export default function Chat({ role }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)
 
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])
 
  // Receives queries from the command palette
  useEffect(() => {
    const handler = (e) => {
      sendMessage(e.detail)
    }
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
 
      {/* ── Header ─────────────────────────────────────── */}
      <header className="px-8 py-4 border-b border-ink-700 bg-ink-900/60 backdrop-blur-sm flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-[17px] text-bone">Inquiry Desk</h2>
          <p className="font-mono text-[10px] text-ink-300 tracking-widest2 uppercase mt-0.5">
            Analytics · Risk · Policy — routed automatically
          </p>
        </div>
        <span className="font-mono text-[10px] text-ink-400 uppercase tracking-widest2">
          Clearance: <span className={role === 'read_only' ? 'text-risk-medium' : 'text-risk-low'}>{role.replace('_', ' ')}</span>
        </span>
      </header>
 
      {/* ── Conversation ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
 
          {messages.length === 0 && !loading && (
            <div className="pt-[16vh] text-center animate-fade-in">
              <p className="font-mono text-[11px] text-gold-dim tracking-widest2 uppercase mb-4">
                Multi-Agent Risk Intelligence
              </p>
              <h3 className="font-display text-[34px] leading-[1.15] text-bone max-w-lg mx-auto">
                Ask the portfolio anything.
              </h3>
              <p className="text-[14px] text-ink-300 max-w-md mx-auto mt-4 leading-relaxed">
                Plain-English questions about delinquency, fraud signals, or internal
                policy — answered with real data, model scores, and cited documents.
              </p>
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                className="mt-8 inline-flex items-center gap-2 px-4 py-2 border border-ink-600
                           hover:border-gold-dim text-[13px] text-ink-200 hover:text-bone"
              >
                <Command className="w-3.5 h-3.5" />
                Browse the query library
                <kbd className="font-mono text-[10px] text-ink-400 border border-ink-600 px-1.5 py-0.5 ml-1">⌘K</kbd>
              </button>
            </div>
          )}
 
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
 
          {/* Live pipeline rail while the graph executes */}
          {loading && (
            <div className="animate-rise mb-8">
              <div className="bg-ink-900 border border-ink-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase">
                    Executing Pipeline
                  </span>
                  <span className="font-mono text-[10px] text-gold animate-pulse-soft">● LIVE</span>
                </div>
                <LiveRail />
              </div>
            </div>
          )}
 
          <div ref={endRef} />
        </div>
      </div>
 
      {/* ── Input bar ──────────────────────────────────── */}
      <div className="px-8 pb-6 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-0 border border-ink-600 bg-ink-900 focus-within:border-gold-dim">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="State your inquiry…"
              rows={1}
              className="flex-1 bg-transparent px-4 py-3.5 text-[14px] text-bone placeholder-ink-400
                         focus:outline-none resize-none"
              style={{ minHeight: '50px', maxHeight: '140px' }}
              onInput={e => {
                e.target.style.height = '50px'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="m-2 w-9 h-9 bg-gold hover:bg-gold-bright disabled:bg-ink-700
                         disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              aria-label="Send inquiry"
            >
              <ArrowUp className="w-4 h-4 text-ink-950" />
            </button>
          </div>
          <p className="font-mono text-[10px] text-ink-400 mt-2 text-center tracking-wide">
            ENTER to send · SHIFT+ENTER for newline · ⌘K for query library
          </p>
        </div>
      </div>
    </div>
  )
}
 
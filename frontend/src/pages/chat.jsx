import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import ChatMessage from '../components/ChatMessage'

export default function Chat({ role }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for example query clicks from sidebar
  useEffect(() => {
    const handler = (e) => {
      setInput(e.detail)
      inputRef.current?.focus()
    }
    window.addEventListener('example-query', handler)
    return () => window.removeEventListener('example-query', handler)
  }, [])

  const sendMessage = async () => {
    const query = input.trim()
    if (!query || loading) return

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: query }])
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

      // Add assistant message with typing animation enabled
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'No response generated.',
        trace: {
          intent:     data.intent,
          tools_used: data.tools_used,
          risk_flags: data.risk_flags,
          latency_ms: data.latency_ms,
        },
        isTyping: true,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}. Is the FastAPI server running on port 8000?`,
        isTyping: false,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-base-900">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="px-6 py-4 border-b border-base-600 bg-base-800/50 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-base-50">Agentic Risk & Insights Copilot</h2>
        <p className="text-xs text-base-300 mt-0.5">
          Ask about risk, fraud, analytics, or policy — the system routes to the right agents automatically
        </p>
      </header>

      {/* ── Messages Area ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-lg font-medium text-base-100 mb-2">Start a conversation</h3>
              <p className="text-sm text-base-300 leading-relaxed">
                Ask a question about portfolio risk, investigate a customer,
                query internal policies, or request a cross-border analysis.
                Try an example from the sidebar.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex mb-4 animate-slide-up">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-base-600 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              </div>
              <div className="bg-base-700 border border-base-600 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-base-300">
                  <span>Agents working</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ──────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-base-600 bg-base-800/50">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about risk, fraud, analytics, or policy..."
              rows={1}
              className="w-full bg-base-700 border border-base-600 rounded-xl px-4 py-3 pr-12
                         text-sm text-base-50 placeholder-base-400
                         focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                         resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={e => {
                e.target.style.height = '44px'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-accent hover:bg-accent-hover disabled:bg-base-600
                       disabled:cursor-not-allowed flex items-center justify-center transition-colors
                       shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-base-400 mt-2">
          Role: <span className="font-mono text-base-300">{role}</span> · Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'
import { TraceRail } from './PipelineRail'
 
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
      if (next >= text.length) {
        clearInterval(interval)
        setDone(true)
        onComplete?.()
      }
    }, 11)
 
    return () => clearInterval(interval)
  }, [text])
 
  return (
    <span className={done ? '' : 'typing-cursor'}>
      {displayed}
    </span>
  )
}
 
export default function ChatMessage({ message }) {
  const { role, content, trace, isTyping, timestamp } = message
  const [typingDone, setTypingDone] = useState(!isTyping)
 
  if (role === 'user') {
    return (
      <div className="animate-rise mb-6">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase">Inquiry</span>
          {timestamp && <span className="font-mono text-[10px] text-ink-500">{timestamp}</span>}
        </div>
        <div className="border-l-2 border-gold pl-4 py-1">
          <p className="text-[14px] text-bone leading-relaxed">{content}</p>
        </div>
      </div>
    )
  }
 
  // Assistant response — a filed report card
  return (
    <div className="animate-rise mb-8">
      <div className="bg-ink-900 border border-ink-700 p-5">
        {/* Report header with workflow reference stamp */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-ink-700">
          <span className="font-mono text-[10px] text-ink-400 tracking-widest2 uppercase">Response</span>
          {trace?.workflow_id && (
            <span className="stamp font-mono text-[10px] text-gold-dim border border-gold-dim/40 px-2 py-0.5">
              REF {trace.workflow_id.slice(0, 8).toUpperCase()}
            </span>
          )}
        </div>
 
        {/* Body */}
        <div className="text-[14px] text-ink-100 leading-[1.7] whitespace-pre-wrap">
          {isTyping
            ? <TypeWriter text={content} onComplete={() => setTypingDone(true)} />
            : content}
        </div>
 
        {/* Execution trace — only after typing completes */}
        {(!isTyping || typingDone) && trace && <TraceRail trace={trace} />}
      </div>
    </div>
  )
}
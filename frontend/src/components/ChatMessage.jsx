import { useState, useEffect, useRef } from 'react'
import { User, Bot } from 'lucide-react'
import AgentTrace from './AgentTrace'

function TypeWriter({ text, speed = 12, onComplete }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!text) return
    indexRef.current = 0
    setDisplayed('')
    setDone(false)

    const interval = setInterval(() => {
      indexRef.current += 1
      // Speed up: render 2-4 chars at a time for long responses
      const chunkSize = text.length > 300 ? 3 : text.length > 150 ? 2 : 1
      const nextIndex = Math.min(indexRef.current * chunkSize, text.length)
      setDisplayed(text.slice(0, nextIndex))

      if (nextIndex >= text.length) {
        clearInterval(interval)
        setDone(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text])

  return (
    <span>
      {displayed}
      {!done && <span className="typing-cursor" />}
    </span>
  )
}

export default function ChatMessage({ message }) {
  const { role, content, trace, isTyping } = message

  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4 animate-slide-up">
        <div className="max-w-[70%] flex gap-3">
          <div className="bg-accent/15 border border-accent/20 rounded-2xl rounded-tr-md px-4 py-3">
            <p className="text-sm text-base-50 leading-relaxed">{content}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-1">
            <User className="w-4 h-4 text-accent" />
          </div>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex mb-4 animate-slide-up">
      <div className="max-w-[75%] flex gap-3">
        <div className="w-8 h-8 rounded-full bg-base-600 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-base-200" />
        </div>
        <div className="bg-base-700 border border-base-600 rounded-2xl rounded-tl-md px-4 py-3">
          <div className="text-sm text-base-100 leading-relaxed whitespace-pre-wrap">
            {isTyping ? (
              <TypeWriter text={content} speed={10} />
            ) : (
              content
            )}
          </div>
          {trace && <AgentTrace data={trace} />}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, Send, User, Bot, ChevronDown } from 'lucide-react'

const DETAILS_DELIMITER = '\n---DETAILS---\n'

interface Message {
  role: 'user' | 'assistant'
  content: string
  /** When set, show summary first and "More details" to expand */
  summary?: string
  expanded?: boolean
}

const WELCOME_MESSAGE =
  "Hi there! I'm your Rise2gether career coach — here to help with anything about the program or your career journey. What's on your mind today?"

const SUGGESTED_PROMPTS = [
  'What is Rise2gether?',
  'How can I build executive presence?',
  'Tips for transitioning roles',
  'How to resolve conflicts at work',
]

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const showPrompts = messages.length === 1 && !isLoading

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Request failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let buffer = ''
      let fullText = ''

      // Add a placeholder assistant message that we'll update as we stream
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', summary: undefined, expanded: false },
      ])
      setIsLoading(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line) as { text?: string; done?: boolean; error?: string }
            if (data.error) throw new Error(data.error)
            if (data.text) {
              fullText += data.text
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.role === 'assistant')
                  next[next.length - 1] = { ...last, content: fullText }
                return next
              })
            }
            if (data.done) {
              const parts = fullText.split(DETAILS_DELIMITER)
              const hasDetails = parts.length >= 2
              const summary = hasDetails ? parts[0].trim() : undefined
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.role === 'assistant')
                  next[next.length - 1] = {
                    ...last,
                    content: fullText,
                    summary: hasDetails ? summary : undefined,
                  }
                return next
              })
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue
            throw parseErr
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          return [
            ...prev.slice(0, -1),
            {
              role: 'assistant',
              content:
                "Something went wrong on my side — could you try again in a moment? I'm here whenever you're ready.",
            },
          ]
        }
        return [
          ...prev,
          {
            role: 'assistant',
            content:
              "Something went wrong on my side — could you try again in a moment? I'm here whenever you're ready.",
          },
        ]
      })
    }
  }

  const handlePromptClick = (text: string) => {
    setInput(text)
  }

  const expandMessage = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index && msg.role === 'assistant' && msg.summary
          ? { ...msg, expanded: true }
          : msg
      )
    )
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-icon-wrap">
          <Sparkles size={22} strokeWidth={2} className="header-sparkles" />
        </div>
        <h1>Rise2gether AI Career Coach</h1>
        <p>Your friendly career development partner</p>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-avatar" aria-hidden>
              {message.role === 'user' ? (
                <User size={20} strokeWidth={2} />
              ) : (
                <Bot size={20} strokeWidth={2} />
              )}
            </div>
            <div className="message-content">
              {message.role === 'assistant' ? (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {message.summary && !message.expanded
                      ? message.summary
                      : message.content}
                  </ReactMarkdown>
                  {message.summary && !message.expanded && (
                    <button
                      type="button"
                      className="more-details-btn"
                      onClick={() => expandMessage(index)}
                    >
                      More details
                      <ChevronDown size={16} strokeWidth={2} aria-hidden />
                    </button>
                  )}
                </>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {showPrompts && (
          <div className="welcome-block">
            <p>Try asking something like:</p>
            <div className="prompt-chips">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="prompt-chip"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar" aria-hidden>
              <Bot size={20} strokeWidth={2} />
            </div>
            <div className="message-content">
              <div className="loading">
                <div className="loading-dot" aria-hidden />
                <div className="loading-dot" aria-hidden />
                <div className="loading-dot" aria-hidden />
                <span className="loading-text">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Ask anything about your career or Rise2gether..."
              rows={1}
              disabled={isLoading}
              aria-label="Message"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="send-button"
            aria-label="Send message"
          >
            <Send size={18} strokeWidth={2.2} aria-hidden />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  )
}

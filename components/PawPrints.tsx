'use client'

import { PAW_PRINT_TYPES, PawPrint, PawPrintType } from '@/lib/paw-prints'
import { useCallback, useEffect, useState } from 'react'

/** Simple paw SVG (cat-style) */
function PawIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <ellipse cx="12" cy="16" rx="5" ry="4" />
      <circle cx="8" cy="11" r="2.5" />
      <circle cx="12" cy="8" r="2.5" />
      <circle cx="16" cy="11" r="2.5" />
      <circle cx="10" cy="7" r="1.8" />
      <circle cx="14" cy="7" r="1.8" />
    </svg>
  )
}

const TYPE_LABELS: Record<PawPrintType, string> = {
  reflection: 'Reflection',
  question: 'Question',
  topic_for_r2g: 'Topic I’d like to see in R2G',
}

export default function PawPrints() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'write' | 'read'>('write')
  const [list, setList] = useState<PawPrint[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'reflection' as PawPrintType,
    content: '',
    nickname: '',
  })

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/paw-prints')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setList(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load paw prints. Please try again.')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && tab === 'read') fetchList()
  }, [open, tab, fetchList])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.content.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/paw-prints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          content: form.content.trim(),
          nickname: form.nickname.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setForm({ type: 'reflection', content: '', nickname: '' })
      setError(null)
      setTab('read')
      setList((prev) => [data, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* 透明浮动箭头：引导用户点击猫爪，始终显示 */}
      <div className="paw-arrow-hint" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <button
        type="button"
        className="paw-float-btn"
        onClick={() => setOpen(true)}
        aria-label="Leave a paw print"
      >
        <PawIcon />
      </button>

      {open && (
        <div
          className="paw-modal-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="paw-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="paw-modal-title"
            aria-modal="true"
          >
            <div className="paw-modal-header">
              <h2 id="paw-modal-title" className="paw-modal-title">
                <PawIcon className="paw-title-icon" />
                Leave a paw print
              </h2>
              <button
                type="button"
                className="paw-modal-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="paw-tabs">
              <button
                type="button"
                className={`paw-tab ${tab === 'write' ? 'active' : ''}`}
                onClick={() => setTab('write')}
              >
                Leave a paw print
              </button>
              <button
                type="button"
                className={`paw-tab ${tab === 'read' ? 'active' : ''}`}
                onClick={() => setTab('read')}
              >
                See others’ paw prints
              </button>
            </div>

            {tab === 'write' ? (
              <form onSubmit={handleSubmit} className="paw-form">
                <label className="paw-label">
                  Type
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as PawPrintType,
                      }))
                    }
                    className="paw-select"
                  >
                    {PAW_PRINT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="paw-label">
                  Content
                  <textarea
                    value={form.content}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, content: e.target.value }))
                    }
                    placeholder="Share a reflection, question, or a topic you’d like to see in R2G…"
                    className="paw-textarea"
                    rows={4}
                    maxLength={2000}
                  />
                  <span className="paw-char-count">{form.content.length}/2000</span>
                </label>
                <label className="paw-label">
                  Nickname (optional)
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nickname: e.target.value }))
                    }
                    placeholder="Leave blank to show “A little paw”"
                    className="paw-input"
                    maxLength={32}
                  />
                </label>
                {error && <p className="paw-error">{error}</p>}
                <button
                  type="submit"
                  disabled={!form.content.trim() || submitting}
                  className="paw-submit"
                >
                  {submitting ? 'Submitting…' : 'Leave paw print'}
                </button>
              </form>
            ) : (
              <div className="paw-feed">
                {loading ? (
                  <p className="paw-loading">Loading…</p>
                ) : error && list.length === 0 ? (
                  <p className="paw-error">{error}</p>
                ) : list.length === 0 ? (
                  <p className="paw-empty">No paw prints yet. Be the first!</p>
                ) : (
                  <ul className="paw-list">
                    {list.map((item) => (
                      <li key={item.id} className="paw-card">
                        <span className="paw-card-type">{TYPE_LABELS[item.type]}</span>
                        <p className="paw-card-content">{item.content}</p>
                        <span className="paw-card-meta">
                          {item.nickname || 'A little paw'} ·{' '}
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

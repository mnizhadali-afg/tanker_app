import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  className,
}: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search & highlight current on open
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value)
      setHighlighted(idx >= 0 ? idx : 0)
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return
    const item = listRef.current.children[highlighted] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  const select = (opt: SelectOption) => {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  const clear = () => {
    onChange('')
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); return }
    if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlighted]) select(filtered[highlighted]); return }
  }

  const triggerClass = [
    'w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 flex items-center justify-between gap-2 text-start',
    disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-400',
    open ? 'ring-2 ring-primary-500 border-primary-500' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={triggerClass}
      >
        <span className={selected ? 'text-gray-900 dark:text-slate-100 truncate' : 'text-gray-400 dark:text-slate-500 truncate'}>
          {selected ? selected.label : (placeholder ?? '—')}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Hidden native input for HTML5 required validation */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none w-full"
        />
      )}

      {open && (
        <div className="absolute z-50 start-0 end-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-slate-700">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlighted(0) }}
              onKeyDown={handleKeyDown}
              placeholder={`${t('app.search')}…`}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <ul ref={listRef} className="max-h-52 overflow-y-auto py-1">
            {!required && value && (
              <li
                onClick={clear}
                className="px-3 py-2 text-sm text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                — {placeholder ?? '—'} —
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-slate-500 text-center">{t('app.noItems')}</li>
            )}
            {filtered.map((opt, i) => (
              <li
                key={opt.value}
                onClick={() => select(opt)}
                className={[
                  'px-3 py-2 text-sm cursor-pointer transition-colors',
                  opt.value === value
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                    : i === highlighted
                      ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

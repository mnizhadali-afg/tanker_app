import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/axios'

const LANGUAGES = [
  { code: 'fa', label: 'فارسی' },
  { code: 'en', label: 'English' },
]

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function TopNav() {
  const { t, i18n } = useTranslation()
  const { user, clearAuth } = useAuthStore()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const now = useClock()
  const locale = i18n.language

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const setLang = (code: string) => {
    i18n.changeLanguage(code)
    document.documentElement.lang = code
    document.documentElement.dir = code === 'fa' ? 'rtl' : 'ltr'
    setLangOpen(false)
  }

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {})
    clearAuth()
  }

  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Left: welcome message */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">{t('app.welcome')}</span>
        <span className={`text-lg font-bold text-gray-800 leading-tight ${locale === 'fa' ? 'font-[Vazirmatn]' : 'font-sans'}`}>
          {user?.username}
        </span>
      </div>

      {/* Right: clock + language dropdown + logout */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className={`flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 tabular-nums ${locale === 'fa' ? 'font-[Vazirmatn]' : 'font-mono'}`}>
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          </svg>
          {formatTime(now, locale)}
        </div>

        {/* Language dropdown */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer transition-colors hover:border-gray-400"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
            {currentLang.label}
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
            </svg>
          </button>

          {langOpen && (
            <div className="absolute inset-e-0 mt-1.5 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLang(lang.code)}
                  className={`w-full text-start px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    lang.code === locale
                      ? 'font-semibold text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title={t('auth.logout')}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg px-3 py-1.5 cursor-pointer transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('auth.logout')}
        </button>
      </div>
    </header>
  )
}

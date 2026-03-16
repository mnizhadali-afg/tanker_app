import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../lib/axios'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const locale = i18n.language
  const isRtl = locale === 'fa'

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const switchLang = () => {
    i18n.changeLanguage(locale === 'fa' ? 'en' : 'fa')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (activeTab !== 'signin') return
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      setAuth(data.user, data.accessToken)
      navigate('/dashboard')
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Language toggle — always at top-end (over illustration side) ── */}
      <button
        onClick={switchLang}
        className="absolute top-5 inset-e-5 z-50 flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 backdrop-blur-sm rounded-full px-3 py-1.5 cursor-pointer transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {locale === 'fa' ? 'English' : 'فارسی'}
      </button>

      {/* ── FORM PANEL ── */}
      <div className="flex flex-col w-full lg:w-115 shrink-0 bg-white px-10 py-8 justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">{t('app.title')}</span>
        </div>

        {/* Form area */}
        <div className="w-full max-w-85 mx-auto space-y-6">

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('auth.loginTitle')}</h1>
            <p className="text-sm text-gray-500">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              disabled
              className="flex-1 py-2 text-sm font-medium rounded-lg text-gray-300 cursor-not-allowed"
            >
              {t('auth.registerTab')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('auth.username')}</label>
              <div
                dir="ltr"
                className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={activeTab === 'signin'}
                  autoFocus
                  autoComplete="username"
                  className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                  placeholder="your_username"
                />
                {username.length > 0 && (
                  <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
                    <circle cx="12" cy="12" r="10" fill="#22c55e" />
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
              <div
                dir="ltr"
                className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={activeTab === 'signin'}
                  autoComplete="current-password"
                  className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-blue-200 cursor-pointer mt-1"
            >
              {loading ? t('app.loading') : activeTab === 'signin' ? t('auth.loginButton') : t('auth.registerTab')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {isRtl ? 'یا از طریق' : 'Or continue with'}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social buttons — decorative */}
          <div className="flex justify-center gap-3">
            <button type="button" className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
            <button type="button" className="w-11 h-11 rounded-full bg-black flex items-center justify-center hover:bg-gray-900 cursor-pointer transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </button>
            <button type="button" className="w-11 h-11 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center hover:bg-blue-100 cursor-pointer transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078d4">
                <path d="M11.4 2H2v9.4h9.4V2zm10.6 0h-9.4v9.4H22V2zM11.4 12.6H2V22h9.4v-9.4zm10.6 0h-9.4V22H22v-9.4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-gray-400 leading-relaxed max-w-xs mx-auto">
          {isRtl
            ? 'مورد اعتماد شرکت‌های توزیع سوخت برای مدیریت حساب‌ها، فاکتورها و عملیات مالی.'
            : 'Trusted by fuel distribution companies to manage accounts, invoices & financial operations.'}
        </p>
      </div>

      {/* ── ILLUSTRATION PANEL ── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #060d1f 0%, #0b1d42 50%, #0d2f6a 100%)' }}
      >
        {/* Dot grid background */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" opacity="0.06">
          <defs>
            <pattern id="dotgrid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1.2" fill="#93c5fd" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)" />
        </svg>

        {/* Radial ambient glow */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 48%, rgba(37,99,235,0.18) 0%, transparent 70%)' }}
        />

        {/* ── Network Visualization ── */}
        <svg
          viewBox="0 0 560 440"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-130 max-w-[86%]"
        >
          <defs>
            {/* Hub gradient */}
            <radialGradient id="hubG" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </radialGradient>
            {/* Node gradients */}
            <radialGradient id="ng1" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#5b21b6" />
            </radialGradient>
            <radialGradient id="ng2" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#065f46" />
            </radialGradient>
            <radialGradient id="ng3" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#f9a8d4" />
              <stop offset="100%" stopColor="#9d174d" />
            </radialGradient>
            <radialGradient id="ng4" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#92400e" />
            </radialGradient>
            <radialGradient id="ng5" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#075985" />
            </radialGradient>
            {/* Glow filters */}
            <filter id="fglow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="fhub" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Orbit rings ── */}
          <circle cx="280" cy="218" r="158" fill="none" stroke="rgba(96,165,250,0.07)" strokeWidth="1" strokeDasharray="6 10" />
          <circle cx="280" cy="218" r="108" fill="none" stroke="rgba(96,165,250,0.05)" strokeWidth="1" />

          {/* ── Connection lines (hub edge → node edge) ── */}
          {/* To Node1 (top, 280,80): hub edge (280,172) → node edge (280,104) */}
          <line x1="280" y1="172" x2="280" y2="104" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" strokeDasharray="5 4" />
          {/* To Node2 (top-right, 418,146): hub edge (321,197) → node edge (397,158) */}
          <line x1="321" y1="197" x2="397" y2="158" stroke="rgba(110,231,183,0.5)" strokeWidth="1.5" strokeDasharray="5 4" />
          {/* To Node3 (bottom-right, 386,312): hub edge (315,250) → node edge (368,296) */}
          <line x1="315" y1="250" x2="368" y2="296" stroke="rgba(249,168,212,0.5)" strokeWidth="1.5" strokeDasharray="5 4" />
          {/* To Node4 (bottom-left, 174,312): hub edge (245,250) → node edge (192,296) */}
          <line x1="245" y1="250" x2="192" y2="296" stroke="rgba(252,211,77,0.5)" strokeWidth="1.5" strokeDasharray="5 4" />
          {/* To Node5 (top-left, 142,146): hub edge (239,197) → node edge (163,158) */}
          <line x1="239" y1="197" x2="163" y2="158" stroke="rgba(125,211,252,0.5)" strokeWidth="1.5" strokeDasharray="5 4" />

          {/* ── Flow dots (animated feel via position on lines) ── */}
          {/* Line 1 */}
          <circle cx="280" cy="152" r="2.5" fill="#c4b5fd" opacity="0.9" />
          <circle cx="280" cy="128" r="1.8" fill="#c4b5fd" opacity="0.55" />
          {/* Line 2 */}
          <circle cx="370" cy="171" r="2.5" fill="#6ee7b7" opacity="0.9" />
          <circle cx="393" cy="160" r="1.8" fill="#6ee7b7" opacity="0.55" />
          {/* Line 3 */}
          <circle cx="345" cy="272" r="2.5" fill="#f9a8d4" opacity="0.9" />
          <circle cx="360" cy="286" r="1.8" fill="#f9a8d4" opacity="0.55" />
          {/* Line 4 */}
          <circle cx="215" cy="272" r="2.5" fill="#fde68a" opacity="0.9" />
          <circle cx="200" cy="286" r="1.8" fill="#fde68a" opacity="0.55" />
          {/* Line 5 */}
          <circle cx="192" cy="172" r="2.5" fill="#7dd3fc" opacity="0.9" />
          <circle cx="170" cy="161" r="1.8" fill="#7dd3fc" opacity="0.55" />

          {/* ── Hub ── */}
          <circle cx="280" cy="218" r="58" fill="rgba(29,78,216,0.12)" />
          <circle cx="280" cy="218" r="46" fill="url(#hubG)" filter="url(#fhub)" />
          <circle cx="280" cy="218" r="46" fill="none" stroke="rgba(147,197,253,0.25)" strokeWidth="1.5" />
          {/* Hub: bar chart icon */}
          <g opacity="0.92">
            <rect x="264" y="207" width="32" height="22" rx="2.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <rect x="268" y="221" width="5" height="6" rx="1" fill="white" opacity="0.9" />
            <rect x="276" y="215" width="5" height="12" rx="1" fill="white" opacity="0.9" />
            <rect x="284" y="210" width="5" height="17" rx="1" fill="white" opacity="0.9" />
          </g>
          {/* Hub highlight */}
          <ellipse cx="272" cy="206" rx="16" ry="9" fill="rgba(255,255,255,0.07)" />

          {/* ── Satellite Nodes ── */}

          {/* Node 1 — Invoices (top, 280, 82) */}
          <circle cx="280" cy="82" r="32" fill="rgba(91,33,182,0.18)" />
          <circle cx="280" cy="82" r="24" fill="url(#ng1)" filter="url(#fglow)" />
          <circle cx="280" cy="82" r="24" fill="none" stroke="rgba(196,181,253,0.2)" strokeWidth="1" />
          <g fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.88">
            <rect x="271" y="72" width="18" height="20" rx="2" fill="rgba(255,255,255,0.08)" strokeWidth="1.3" />
            <line x1="274" y1="78" x2="286" y2="78" />
            <line x1="274" y1="82" x2="286" y2="82" />
            <line x1="274" y1="86" x2="281" y2="86" />
          </g>
          <text x="280" y="48" textAnchor="middle" fill="rgba(196,181,253,0.85)" fontSize="10" fontWeight="600" fontFamily="Vazirmatn, Inter, system-ui">
            {isRtl ? 'فاکتورها' : 'Invoices'}
          </text>

          {/* Node 2 — Payments (top-right, 418, 146) */}
          <circle cx="418" cy="146" r="29" fill="rgba(6,95,70,0.2)" />
          <circle cx="418" cy="146" r="22" fill="url(#ng2)" filter="url(#fglow)" />
          <circle cx="418" cy="146" r="22" fill="none" stroke="rgba(110,231,183,0.2)" strokeWidth="1" />
          <g fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.88">
            <rect x="409" y="137" width="18" height="18" rx="3" fill="rgba(255,255,255,0.08)" strokeWidth="1.3" />
            <path d="M412 143 h12 M412 147 h8" />
            <circle cx="421" cy="151" r="3" fill="rgba(255,255,255,0.2)" strokeWidth="1" />
          </g>
          <text x="454" y="182" textAnchor="middle" fill="rgba(110,231,183,0.85)" fontSize="10" fontWeight="600" fontFamily="Vazirmatn, Inter, system-ui">
            {isRtl ? 'پرداخت‌ها' : 'Payments'}
          </text>

          {/* Node 3 — Reports (bottom-right, 386, 312) */}
          <circle cx="386" cy="312" r="29" fill="rgba(157,23,77,0.2)" />
          <circle cx="386" cy="312" r="22" fill="url(#ng3)" filter="url(#fglow)" />
          <circle cx="386" cy="312" r="22" fill="none" stroke="rgba(249,168,212,0.2)" strokeWidth="1" />
          <g fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.88">
            <path d="M376 320 L376 306 L381 306 L381 313 L387 313 L387 303 L393 303 L393 320 Z" fill="rgba(255,255,255,0.08)" strokeWidth="1.3" />
          </g>
          <text x="386" y="350" textAnchor="middle" fill="rgba(249,168,212,0.85)" fontSize="10" fontWeight="600" fontFamily="Vazirmatn, Inter, system-ui">
            {isRtl ? 'گزارش‌ها' : 'Reports'}
          </text>

          {/* Node 4 — Tankers (bottom-left, 174, 312) */}
          <circle cx="174" cy="312" r="29" fill="rgba(146,64,14,0.2)" />
          <circle cx="174" cy="312" r="22" fill="url(#ng4)" filter="url(#fglow)" />
          <circle cx="174" cy="312" r="22" fill="none" stroke="rgba(252,211,77,0.2)" strokeWidth="1" />
          <g fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.88">
            <rect x="163" y="308" width="22" height="10" rx="2" fill="rgba(255,255,255,0.08)" strokeWidth="1.2" />
            <rect x="169" y="303" width="8" height="7" rx="1.5" fill="rgba(255,255,255,0.12)" strokeWidth="1" />
            <circle cx="167" cy="320" r="3" fill="rgba(255,255,255,0.18)" strokeWidth="1.1" />
            <circle cx="181" cy="320" r="3" fill="rgba(255,255,255,0.18)" strokeWidth="1.1" />
          </g>
          <text x="174" y="350" textAnchor="middle" fill="rgba(252,211,77,0.85)" fontSize="10" fontWeight="600" fontFamily="Vazirmatn, Inter, system-ui">
            {isRtl ? 'تانکرها' : 'Tankers'}
          </text>

          {/* Node 5 — Contracts (top-left, 142, 146) */}
          <circle cx="142" cy="146" r="29" fill="rgba(7,89,133,0.2)" />
          <circle cx="142" cy="146" r="22" fill="url(#ng5)" filter="url(#fglow)" />
          <circle cx="142" cy="146" r="22" fill="none" stroke="rgba(125,211,252,0.2)" strokeWidth="1" />
          <g fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.88">
            <rect x="133" y="136" width="18" height="20" rx="2" fill="rgba(255,255,255,0.08)" strokeWidth="1.3" />
            <line x1="136" y1="142" x2="148" y2="142" />
            <line x1="136" y1="146" x2="148" y2="146" />
            <line x1="136" y1="150" x2="144" y2="150" />
          </g>
          <text x="106" y="182" textAnchor="middle" fill="rgba(125,211,252,0.85)" fontSize="10" fontWeight="600" fontFamily="Vazirmatn, Inter, system-ui">
            {isRtl ? 'قراردادها' : 'Contracts'}
          </text>

          {/* ── Floating Data Cards ── */}

          {/* Card: Top-right — AFN balance */}
          <g>
            <rect x="440" y="52" width="106" height="66" rx="8" fill="rgba(8,20,60,0.88)" stroke="rgba(96,165,250,0.22)" strokeWidth="1" />
            <text x="452" y="70" fill="rgba(148,163,184,0.75)" fontSize="8" fontFamily="Inter, system-ui">Outstanding</text>
            <text x="452" y="88" fill="#93c5fd" fontSize="13.5" fontWeight="700" fontFamily="Inter, system-ui" letterSpacing="-0.3">1,240,500</text>
            <text x="452" y="102" fill="rgba(148,163,184,0.55)" fontSize="8" fontFamily="Vazirmatn, Inter, system-ui">افغانی · AFN</text>
            {/* Up trend */}
            <path d="M528 63 L534 57 L540 63" stroke="#34d399" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <line x1="534" y1="57" x2="534" y2="72" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Card: Bottom-right — USD */}
          <g>
            <rect x="440" y="278" width="106" height="66" rx="8" fill="rgba(8,20,60,0.88)" stroke="rgba(52,211,153,0.22)" strokeWidth="1" />
            <text x="452" y="296" fill="rgba(148,163,184,0.75)" fontSize="8" fontFamily="Inter, system-ui">Total USD</text>
            <text x="452" y="314" fill="#6ee7b7" fontSize="13.5" fontWeight="700" fontFamily="Inter, system-ui" letterSpacing="-0.3">45,280</text>
            <text x="452" y="328" fill="rgba(148,163,184,0.55)" fontSize="8" fontFamily="Inter, system-ui">USD · دلار</text>
          </g>

          {/* Card: Top-left — invoices count */}
          <g>
            <rect x="14" y="78" width="100" height="66" rx="8" fill="rgba(8,20,60,0.88)" stroke="rgba(167,139,250,0.22)" strokeWidth="1" />
            <text x="26" y="96" fill="rgba(148,163,184,0.75)" fontSize="8" fontFamily="Vazirmatn, Inter, system-ui">{isRtl ? 'فاکتورها' : 'Invoices'}</text>
            <text x="26" y="118" fill="#c4b5fd" fontSize="22" fontWeight="700" fontFamily="Inter, system-ui">24</text>
            <text x="26" y="132" fill="rgba(52,211,153,0.75)" fontSize="8" fontFamily="Vazirmatn, Inter, system-ui">● {isRtl ? '۱۸ فعال' : '18 Active'}</text>
          </g>

          {/* Card: Bottom-left — contracts */}
          <g>
            <rect x="14" y="278" width="100" height="66" rx="8" fill="rgba(8,20,60,0.88)" stroke="rgba(125,211,252,0.22)" strokeWidth="1" />
            <text x="26" y="296" fill="rgba(148,163,184,0.75)" fontSize="8" fontFamily="Vazirmatn, Inter, system-ui">{isRtl ? 'قراردادها' : 'Contracts'}</text>
            <text x="26" y="318" fill="#7dd3fc" fontSize="22" fontWeight="700" fontFamily="Inter, system-ui">12</text>
            <text x="26" y="332" fill="rgba(148,163,184,0.55)" fontSize="8" fontFamily="Vazirmatn, Inter, system-ui">{isRtl ? 'قرارداد فعال' : 'Active'}</text>
          </g>

          {/* ── Mini bar chart — bottom center ── */}
          <g transform="translate(186, 392)">
            <text x="0" y="-4" fill="rgba(148,163,184,0.45)" fontSize="7.5" fontFamily="Inter, system-ui">Monthly Volume (AFN M)</text>
            {[18, 28, 22, 38, 34, 48, 42].map((h, i) => (
              <rect
                key={i}
                x={i * 26}
                y={32 - h}
                width="18"
                height={h}
                rx="3"
                fill={i === 6 ? '#3b82f6' : 'rgba(59,130,246,0.28)'}
                stroke={i === 6 ? 'rgba(147,197,253,0.4)' : 'none'}
                strokeWidth="0.5"
              />
            ))}
            <line x1="0" y1="33" x2="182" y2="33" stroke="rgba(96,165,250,0.18)" strokeWidth="0.8" />
          </g>
        </svg>

        {/* Subtle corner glow blobs */}
        <div className="absolute top-0 inset-s-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 inset-e-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

        {/* Floating micro dots */}
        <div className="absolute top-20 inset-s-20 w-2.5 h-2.5 rounded-full opacity-30" style={{ background: '#60a5fa', boxShadow: '0 0 10px #60a5fa' }} />
        <div className="absolute bottom-24 inset-s-16 w-2 h-2 rounded-full opacity-25" style={{ background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
        <div className="absolute top-1/3 inset-e-8 w-2 h-2 rounded-full opacity-20" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />

        {/* Bottom bilingual label */}
        <div className="absolute bottom-8 text-center px-8 space-y-1">
          <p className="text-blue-300/70 text-xs font-semibold tracking-widest uppercase">Fuel Distribution Management</p>
          <p className="text-blue-400/50 text-xs" style={{ fontFamily: 'Vazirmatn, system-ui' }}>سیستم حسابداری تانکرها</p>
        </div>
      </div>

    </div>
  )
}

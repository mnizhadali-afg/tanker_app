import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/axios'

export default function TopNav() {
  const { t, i18n } = useTranslation()
  const { user, clearAuth } = useAuthStore()

  const toggleLang = () => {
    const next = i18n.language === 'fa' ? 'en' : 'fa'
    i18n.changeLanguage(next)
    document.documentElement.lang = next
    document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr'
  }

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {})
    clearAuth()
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <button
          onClick={toggleLang}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1"
        >
          {i18n.language === 'fa' ? 'English' : 'فارسی'}
        </button>
        <span className="text-sm text-gray-700">{user?.username}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-danger-600 hover:text-danger-700"
        >
          {t('auth.logout')}
        </button>
      </div>
    </header>
  )
}

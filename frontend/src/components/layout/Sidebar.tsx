import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  key: string
  path: string
  roles?: string[]
}

interface NavGroup {
  labelKey: string | null
  items: NavItem[]
  roles?: string[]
}

const navGroups: NavGroup[] = [
  {
    labelKey: null,
    items: [{ key: 'dashboard', path: '/dashboard' }],
  },
  {
    labelKey: 'nav.group.data',
    items: [
      { key: 'accounts', path: '/accounts' },
      { key: 'products', path: '/products' },
      { key: 'ports', path: '/ports' },
      { key: 'licenses', path: '/licenses' },
    ],
  },
  {
    labelKey: 'nav.group.operations',
    items: [
      { key: 'contracts', path: '/contracts' },
      { key: 'invoices', path: '/invoices' },
      { key: 'payments', path: '/payments' },
    ],
  },
  {
    labelKey: 'nav.group.analytics',
    items: [{ key: 'reports', path: '/reports' }],
  },
  {
    labelKey: 'nav.group.system',
    items: [{ key: 'users', path: '/users', roles: ['admin'] }],
    roles: ['admin'],
  },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  return (
    <aside className="w-56 shrink-0 bg-white dark:bg-slate-800 border-e border-gray-200 dark:border-slate-700 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-slate-700 px-4">
        <span className="text-primary-700 dark:text-primary-400 font-bold text-sm text-center leading-tight">
          {t('app.title')}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto pb-4">
        {navGroups.map((group, gi) => {
          if (group.roles && (!user || !group.roles.includes(user.role))) return null

          const visibleItems = group.items.filter(
            (item) => !item.roles || (user && item.roles.includes(user.role)),
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={gi}>
              {group.labelKey && (
                <div className="px-4 pt-5 pb-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    {t(group.labelKey)}
                  </span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
                </div>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium border-s-2 border-primary-600'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100'
                    }`
                  }
                >
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

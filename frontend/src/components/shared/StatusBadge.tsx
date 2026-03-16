const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  final: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400',
}

interface Props {
  status: string
  label: string
}

export default function StatusBadge({ status, label }: Props) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

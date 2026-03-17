const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)])
}

export function formatNumber(
  value: number | string | null | undefined,
  locale: string,
  decimals = 2,
): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })

  return locale === 'fa' ? toPersianDigits(formatted) : formatted
}

// Extract a translated error message from an API error.
// If the backend returned an i18n key (e.g. "errors.invoiceNotDraft"),
// the caller should pass it through t(). This helper returns the raw key so
// the component can do: t(extractApiError(err)) — i18next will translate
// known keys and return the key itself as a fallback for unknown ones.
export function extractApiError(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  if (typeof msg === 'string' && msg.length > 0) return msg
  return 'errors.serverError'
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '—'

  if (locale === 'fa') {
    const farsi = date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return farsi
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

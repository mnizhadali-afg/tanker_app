import { useEffect, useState, createContext, useContext, useCallback } from 'react'

type ToastType = 'error' | 'warning' | 'success'

interface ToastMessage {
  id: number
  type: ToastType
  text: string
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

let _counter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((text: string, type: ToastType = 'error') => {
    const id = ++_counter
    setToasts((prev) => [...prev, { id, type, text }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const colorMap: Record<ToastType, string> = {
    error:   'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    success: 'bg-green-600 text-white',
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 inset-e-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start gap-2 rounded-lg px-4 py-3 shadow-lg text-sm pointer-events-auto ${colorMap[toast.type]}`}
            >
              <span className="flex-1">{toast.text}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="opacity-70 hover:opacity-100 leading-none text-base font-bold shrink-0"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

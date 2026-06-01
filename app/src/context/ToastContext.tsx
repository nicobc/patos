import { createContext, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import './ToastContext.css'

interface ToastAction {
  label: string
  onAction: () => void
}

interface ToastOptions {
  action?: ToastAction
  duration?: number
}

interface ToastValue {
  showToast: (message: string, options?: ToastOptions) => void
}

interface ToastState {
  id: number
  message: string
  action?: ToastAction
}

const ToastContext = createContext<ToastValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast]         = useState<ToastState | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const autoRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef      = useRef(0)

  function clearTimers() {
    if (autoRef.current)  clearTimeout(autoRef.current)
    if (leaveRef.current) clearTimeout(leaveRef.current)
  }

  function dismiss() {
    setDismissing(true)
    leaveRef.current = setTimeout(() => {
      setToast(null)
      setDismissing(false)
    }, 150)
  }

  function showToast(message: string, options: ToastOptions = {}) {
    clearTimers()
    setDismissing(false)
    idRef.current += 1
    setToast({ id: idRef.current, message, action: options.action })
    autoRef.current = setTimeout(dismiss, options.duration ?? 2500)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className={`toast${dismissing ? ' toast--leaving' : ''}`}
          role="status"
          aria-live="polite"
        >
          <FontAwesomeIcon icon={faCheck} className="toast-icon" />
          <span className="toast-message">{toast.message}</span>
          {toast.action && (
            <button
              className="toast-action"
              onClick={() => {
                clearTimers()
                toast.action!.onAction()
                setToast(null)
                setDismissing(false)
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export { ToastContext }

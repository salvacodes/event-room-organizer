import { X } from 'lucide-react'
import { useEffect } from 'react'

type Props = {
  message: string
  variant: 'success' | 'warning'
  onDismiss: () => void
}

const variantBorder: Record<Props['variant'], string> = {
  success: 'border-l-indigo-500',
  warning: 'border-l-amber-500'
}

export default function ToastNotification({ message, variant, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      className={`fixed top-6 right-6 z-50 animate-slideInRight flex items-center gap-3 min-w-64 max-w-sm rounded-lg border-l-4 bg-white shadow-xl px-4 py-3 ${variantBorder[variant]}`}
    >
      <span className="text-sm font-medium text-slate-800 flex-1">{message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 transition-colors duration-150 rounded p-0.5 -mr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        <X size={15} />
      </button>
    </div>
  )
}

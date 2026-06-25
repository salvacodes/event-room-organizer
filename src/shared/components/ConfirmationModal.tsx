import { useEffect } from 'react'

type Props = {
  title: string
  message: string
  confirmLabel: string
  confirmVariant: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmationModal({
  title,
  message,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const confirmButtonClass =
    confirmVariant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500 text-white'

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-dismiss is an intentional interactive pattern; Escape key is handled via useEffect
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop is a non-semantic interactive overlay, not a button
    <div
      data-testid="modal-backdrop"
      onClick={onCancel}
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation is only present to prevent backdrop dismissal; keyboard handling (Escape) is handled globally via useEffect */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="animate-fadeIn w-full max-w-md bg-white rounded-xl shadow-2xl ring-1 ring-slate-100 p-6 flex flex-col gap-4"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{message}</p>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 ${confirmButtonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

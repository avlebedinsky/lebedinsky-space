import { createPortal } from 'react-dom'
import { TriangleAlert } from 'lucide-react'

interface Props {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-700/60 bg-gray-900 shadow-2xl">
        {destructive && (
          <div className="flex items-center gap-3 border-b border-gray-800 px-5 py-4">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <TriangleAlert size={14} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-400/80">Опасное действие</p>
          </div>
        )}

        <div className="px-5 py-5">
          <p className="text-base font-semibold text-soft">{title}</p>
          {message && <p className="mt-1.5 text-sm leading-relaxed text-dim">{message}</p>}
        </div>

        <div className="flex gap-2 border-t border-gray-800 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-2 text-sm text-dim cursor-pointer transition hover:border-gray-600 hover:text-soft"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition ${
              destructive
                ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:border-red-500/50'
                : 'border border-gray-700 bg-gray-800 text-soft hover:border-gray-600 hover:text-medium'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

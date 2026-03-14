import { Link } from 'react-router-dom'
import { AlertTriangle, KeyRound, FolderX } from 'lucide-react'

interface ErrorBlockProps {
  message: string
}

export function ErrorBlock({ message }: ErrorBlockProps) {
  const isAuth =
    message.includes('токен') ||
    message.includes('token') ||
    message.includes('Unauthorized') ||
    message.includes('запрещён') ||
    message.includes('права')
  const isNotFound = message.includes('не найден') || message.includes('Not Found')
  const Icon = isAuth ? KeyRound : isNotFound ? FolderX : AlertTriangle
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-2 text-amber-400">
        <Icon size={15} className="shrink-0" />
        <span className="text-sm font-medium">
          {isAuth ? 'Ошибка доступа' : isNotFound ? 'Репозиторий не найден' : 'Ошибка'}
        </span>
      </div>
      <p className="text-xs text-dim">{message}</p>
      {(isAuth || isNotFound) && (
        <p className="text-xs text-subtle">
          Проверь настройки в{' '}
          <Link
            to="/admin"
            className="underline underline-offset-2 transition hover:opacity-80"
            style={{ color: 'var(--color-accent)' }}
          >
            Управлении
          </Link>
          .
        </p>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Pencil, Eye, EyeOff, Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { api } from '../../lib/api'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { KBNode } from '../../lib/types'

export function KnowledgeSection() {
  const { settings, updateSettings } = useThemeStore()

  const [editing, setEditing] = useState(false)
  const [phase, setPhase] = useState<'connection' | 'folders'>('connection')
  const [repoURL, setRepoURL] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [topFolders, setTopFolders] = useState<KBNode[]>([])
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [allowedFolders, setAllowedFolders] = useState<string[]>([])

  const [clearConfirm, setClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  const handleStartEdit = () => {
    setRepoURL(settings.kbRepoURL ?? '')
    setToken('')
    setError(null)
    setAllowedFolders(settings.kbAllowedFolders ?? [])
    setTopFolders([])

    if (settings.kbRepoURL) {
      setPhase('folders')
      setFoldersLoading(true)
      setEditing(true)
      api.knowledge.tree()
        .then(nodes => setTopFolders(nodes))
        .catch(() => setTopFolders([]))
        .finally(() => setFoldersLoading(false))
    } else {
      setPhase('connection')
      setEditing(true)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setError(null)
    setTopFolders([])
  }

  const toggleFolder = (name: string) => {
    setAllowedFolders(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name],
    )
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setError(null)
    try {
      await updateSettings({
        ...settings,
        kbRepoURL: repoURL,
        kbGithubToken: token || (settings.kbGithubToken ?? ''),
        kbAllowedFolders: settings.kbAllowedFolders ?? [],
      })
      setTopFolders([])
      setFoldersLoading(true)
      setPhase('folders')
      const nodes = await api.knowledge.tree().catch(() => [])
      setTopFolders(nodes)
    } catch {
      setError('Ошибка подключения к репозиторию')
    } finally {
      setConnecting(false)
      setFoldersLoading(false)
    }
  }

  const handleSaveFolders = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateSettings({
        ...settings,
        kbAllowedFolders: allowedFolders,
      })
      setEditing(false)
      setTopFolders([])
    } catch {
      setError('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setClearing(true)
    setClearConfirm(false)
    try {
      await updateSettings({
        ...settings,
        kbRepoURL: '',
        kbGithubToken: '',
        kbAllowedFolders: [],
      })
      setTopFolders([])
      setAllowedFolders([])
      setEditing(false)
    } finally {
      setClearing(false)
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-subtle">База знаний</h2>
      </div>

      {clearConfirm && (
        <ConfirmDialog
          title="Очистить базу знаний?"
          message="URL репозитория, токен и список папок будут удалены. Это действие необратимо."
          confirmLabel="Очистить"
          destructive
          onConfirm={() => { setClearConfirm(false); handleClear() }}
          onCancel={() => setClearConfirm(false)}
        />
      )}

      <div className="rounded-2xl border border-gray-800 bg-gray-900">
        {!editing ? (
          <div className="flex items-center gap-2 px-4 min-h-[56px]">
            <div className="flex-1 min-w-0">
              {settings.kbRepoURL ? (
                <div className="flex flex-col gap-0.5">
                  <p className="truncate text-sm text-soft">{settings.kbRepoURL}</p>
                  {(settings.kbAllowedFolders?.length ?? 0) > 0 && (
                    <p className="text-xs text-subtle">
                      Папки: {settings.kbAllowedFolders.join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-subtle">Репозиторий не настроен</p>
              )}
            </div>
            <button
              onClick={handleStartEdit}
              title="Редактировать"
              className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium"
            >
              <Pencil size={14} />
            </button>
            {settings.kbRepoURL && (
              <button
                onClick={() => setClearConfirm(true)}
                disabled={clearing}
                title="Очистить базу знаний"
                className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-red-400 disabled:opacity-50"
              >
                {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
        ) : phase === 'connection' ? (
          <form onSubmit={handleConnect} className="flex flex-col gap-4 p-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-dim">URL репозитория *</span>
              <input
                required
                type="url"
                value={repoURL}
                onChange={e => setRepoURL(e.target.value)}
                placeholder="https://github.com/owner/repo"
                autoFocus
                className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none transition focus:border-gray-600"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-dim">GitHub Personal Access Token</span>
              <div className="flex gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Оставь пустым, чтобы не менять"
                  autoComplete="off"
                  className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none transition focus:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="flex items-center rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-dim cursor-pointer transition hover:border-gray-600 hover:text-soft"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span className="text-xs text-subtle">
                Нужен для приватных репозиториев. Хранится на сервере, фронтенду не передаётся.{' '}
                Создай{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=lebedinsky-space+knowledge+base"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:opacity-80 transition"
                  style={{ color: 'var(--color-accent)' }}
                >
                  классический токен
                </a>{' '}
                с правом <code className="rounded bg-gray-800 px-1 py-0.5 text-[11px]">repo</code> или{' '}
                <a
                  href="https://github.com/settings/personal-access-tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:opacity-80 transition"
                  style={{ color: 'var(--color-accent)' }}
                >
                  fine-grained токен
                </a>{' '}
                с правом <code className="rounded bg-gray-800 px-1 py-0.5 text-[11px]">Contents: Read-only</code>.
              </span>
            </label>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-dim cursor-pointer transition hover:border-gray-600 hover:text-soft"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={connecting || !repoURL}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition hover:opacity-85 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text)' }}
              >
                {connecting && <Loader2 size={13} className="animate-spin" />}
                {connecting ? 'Подключаю…' : 'Подключить →'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setPhase('connection'); setTopFolders([]) }}
                className="flex items-center gap-1.5 text-xs text-subtle cursor-pointer transition hover:text-soft"
              >
                <ArrowLeft size={12} /> Изменить подключение
              </button>
              <div className="flex-1 h-px bg-gray-800" />
              <p className="text-xs text-subtle truncate max-w-xs">{repoURL}</p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-dim">
                Показывать папки{' '}
                <span className="text-subtle">(если не выбрано — показывать все)</span>
              </span>
              {foldersLoading ? (
                <div className="flex items-center gap-2 text-xs text-subtle">
                  <Loader2 size={12} className="animate-spin" /> Загрузка папок…
                </div>
              ) : topFolders.length === 0 ? (
                <p className="text-xs text-subtle">Нет папок или не удалось загрузить</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topFolders.map(folder => {
                    const checked = allowedFolders.includes(folder.name)
                    return (
                      <button
                        key={folder.name}
                        type="button"
                        onClick={() => toggleFolder(folder.name)}
                        className={`rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition ${
                          checked
                            ? 'border-transparent font-medium'
                            : 'border-gray-700 bg-gray-800 text-dim hover:border-gray-600 hover:text-soft'
                        }`}
                        style={checked ? { backgroundColor: 'var(--color-accent)20', borderColor: 'var(--color-accent)60', color: 'var(--color-text)' } : {}}
                      >
                        {folder.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-dim cursor-pointer transition hover:border-gray-600 hover:text-soft"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveFolders}
                disabled={saving}
                className="rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition hover:opacity-85 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text)' }}
              >
                {saving ? 'Сохраняю…' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

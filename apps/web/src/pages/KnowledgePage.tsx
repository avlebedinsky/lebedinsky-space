import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Search,
  X,
  AlertTriangle,
  KeyRound,
  FolderX,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { useThemeStore } from '../store/themeStore'
import { api } from '../lib/api'
import type { KBNode } from '../lib/types'

function ErrorBlock({ message }: { message: string }) {
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
          {isAuth ? 'Ошибка доступа' : isNotFound ? 'Репозиторий не найден' : 'Ошибка GitHub'}
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

function matchesSearch(node: KBNode, query: string): boolean {
  if (node.type === 'file') return node.name.toLowerCase().includes(query)
  return (node.children ?? []).some(c => matchesSearch(c, query))
}

function filterTree(nodes: KBNode[], query: string): KBNode[] {
  if (!query) return nodes
  return nodes
    .filter(n => matchesSearch(n, query))
    .map(n => (n.type === 'dir' ? { ...n, children: filterTree(n.children ?? [], query) } : n))
}

interface TreeNodeProps {
  node: KBNode
  selectedPath: string | null
  onSelect: (path: string) => void
  depth?: number
  forceOpen?: boolean
}

function TreeNode({ node, selectedPath, onSelect, depth = 0, forceOpen = false }: TreeNodeProps) {
  const [open, setOpen] = useState(forceOpen)

  if (forceOpen && !open) setOpen(true)

  if (node.type === 'file') {
    const displayName = node.name.endsWith('.md') ? node.name.slice(0, -3) : node.name
    const isSelected = selectedPath === node.path
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
          isSelected
            ? 'font-medium'
            : 'text-dim hover:text-soft'
        }`}
        style={{
          paddingLeft: `${depth * 14 + 12}px`,
          ...(isSelected ? { backgroundColor: 'var(--color-accent)20', color: 'var(--color-text)' } : {}),
        }}
      >
        <FileText size={13} className="shrink-0 opacity-50" />
        <span className="min-w-0 truncate">{displayName}</span>
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-soft transition hover:text-medium"
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <span className="shrink-0 text-subtle">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        {open
          ? <FolderOpen size={13} className="shrink-0 opacity-50" />
          : <Folder size={13} className="shrink-0 opacity-50" />}
        <span className="min-w-0 truncate font-medium">{node.name}</span>
      </button>
      {open && (
        <div>
          {(node.children ?? []).map(child => (
            <TreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
              forceOpen={forceOpen}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Breadcrumb({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean)
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-dim">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1
        const name = isLast && part.endsWith('.md') ? part.slice(0, -3) : part
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={10} className="shrink-0 text-faint" />}
            <span className={isLast ? 'text-soft' : ''}>{name}</span>
          </span>
        )
      })}
    </div>
  )
}

export default function KnowledgePage() {
  const { settings } = useThemeStore()

  const [tree, setTree] = useState<KBNode[]>([])
  const [treeLoading, setTreeLoading] = useState(true)
  const [treeError, setTreeError] = useState('')

  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState('')

  const [search, setSearch] = useState('')
  const [mobilePanel, setMobilePanel] = useState<'tree' | 'reader'>('tree')

  useEffect(() => {
    api.knowledge
      .tree()
      .then(setTree)
      .catch(e => setTreeError(e.message ?? 'Ошибка загрузки'))
      .finally(() => setTreeLoading(false))
  }, [])

  const handleSelectFile = (path: string) => {
    if (path === selectedPath) return
    setSelectedPath(path)
    setContent('')
    setContentError('')
    setContentLoading(true)
    setMobilePanel('reader')
    api.knowledge
      .file(path)
      .then(r => setContent(r.content))
      .catch(e => setContentError(e.message ?? 'Ошибка загрузки файла'))
      .finally(() => setContentLoading(false))
  }

  const searchQuery = search.toLowerCase().trim()
  const filteredTree = useMemo(() => {
    const allowed = settings.kbAllowedFolders
    const base = allowed?.length
      ? tree.filter(n => allowed.includes(n.name))
      : tree
    return filterTree(base, searchQuery)
  }, [tree, searchQuery, settings.kbAllowedFolders])

  const bgStyle = settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'var(--color-text)' }
    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }

  return (
    <div className="flex h-screen flex-col overflow-hidden px-4" style={bgStyle}>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col min-h-0">

        <header className="shrink-0 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
            >
              <ArrowLeft size={13} /> Назад
            </Link>
            <div className="h-5 w-px bg-gray-800" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">База знаний</h1>
          </div>

          {selectedPath && (
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => setMobilePanel('tree')}
                className={`rounded-xl border px-3 py-2 text-xs transition ${
                  mobilePanel === 'tree'
                    ? 'border-gray-600 bg-gray-800 text-medium'
                    : 'border-gray-700 bg-gray-800 text-dim hover:border-gray-600 hover:text-medium'
                }`}
              >
                Файлы
              </button>
              <button
                onClick={() => setMobilePanel('reader')}
                className={`rounded-xl border px-3 py-2 text-xs transition ${
                  mobilePanel === 'reader'
                    ? 'border-gray-600 bg-gray-800 text-medium'
                    : 'border-gray-700 bg-gray-800 text-dim hover:border-gray-600 hover:text-medium'
                }`}
              >
                Заметка
              </button>
            </div>
          )}
        </header>

        <div className="flex min-h-0 flex-1 gap-4 pb-4">

          <aside
            className={`rounded-2xl border border-gray-800 flex flex-col overflow-hidden
              ${selectedPath ? (mobilePanel === 'tree' ? 'flex' : 'hidden') : 'flex'}
              md:flex w-full md:w-64 lg:w-72 shrink-0`}
            style={{ backgroundColor: 'var(--color-card)' }}
          >
            <div className="shrink-0 p-3 border-b border-gray-800">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2 pl-8 pr-7 text-sm outline-none transition focus:border-gray-600"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-subtle hover:text-soft"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="kb-scroll flex-1 overflow-y-auto p-2">
              {treeLoading ? (
                <div className="space-y-1 p-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-7 animate-pulse rounded-xl bg-gray-800" style={{ width: `${50 + (i % 3) * 20}%` }} />
                  ))}
                </div>
              ) : treeError ? (
                <div className="p-2">
                  <ErrorBlock message={treeError} />
                </div>
              ) : filteredTree.length === 0 ? (
                <p className="p-3 text-sm text-subtle">
                  {searchQuery ? 'Ничего не найдено' : 'Нет файлов'}
                </p>
              ) : (
                filteredTree.map(node => (
                  <TreeNode
                    key={node.path}
                    node={node}
                    selectedPath={selectedPath}
                    onSelect={handleSelectFile}
                    forceOpen={!!searchQuery}
                  />
                ))
              )}
            </div>
          </aside>

          <div
            className={`min-w-0 flex-1
              ${selectedPath ? (mobilePanel === 'reader' ? 'flex' : 'hidden') : 'flex'}
              md:flex flex-col rounded-2xl border border-gray-800 overflow-hidden`}
            style={{ backgroundColor: 'var(--color-card)' }}
          >
            {!selectedPath ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-subtle">
                <FileText size={36} className="opacity-20" />
                <p className="text-sm">Выбери файл для чтения</p>
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-gray-800 px-5 py-3 flex items-center gap-3">
                  <button
                    onClick={() => setMobilePanel('tree')}
                    className="flex items-center gap-1 text-xs text-dim md:hidden hover:text-soft transition"
                  >
                    <ArrowLeft size={12} /> Файлы
                  </button>
                  <Breadcrumb path={selectedPath} />
                </div>

                <div className="kb-scroll flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                  {contentLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-4 animate-pulse rounded-lg bg-gray-800" style={{ width: `${55 + (i % 4) * 11}%` }} />
                      ))}
                    </div>
                  ) : contentError ? (
                    <ErrorBlock message={contentError} />
                  ) : (
                    <div className="kb-prose">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

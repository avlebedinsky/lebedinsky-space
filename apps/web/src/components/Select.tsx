import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  value: string | number
  options: SelectOption[]
  onChange: (value: string) => void
  label?: string
}

export function Select({ value, options, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => String(o.value) === String(value))

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-dim">{label}</span>}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-soft transition hover:border-gray-600 focus:outline-none focus:border-gray-600"
        >
          <span>{selected?.label ?? value}</span>
          <ChevronDown
            size={14}
            className={`shrink-0 text-subtle transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 shadow-xl [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
            {options.map(opt => {
              const active = String(opt.value) === String(value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(String(opt.value)); setOpen(false) }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-gray-800 ${active ? 'text-white' : 'text-soft'}`}
                >
                  <span>{opt.label}</span>
                  {active && <Check size={13} className="shrink-0 text-subtle" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

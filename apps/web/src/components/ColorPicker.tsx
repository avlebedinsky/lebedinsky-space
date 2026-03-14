import { useRef } from 'react'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
}

export function ColorPicker({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hex = value.startsWith('#') && value.length <= 9 ? value.slice(0, 7) : value

  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs text-dim">{label}</span>
      <div
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 transition hover:border-gray-600"
        onClick={() => inputRef.current?.click()}
      >
        <div className="size-6 rounded-md border border-gray-700 shadow-sm" style={{ backgroundColor: hex }} />
        <span className="font-mono text-sm text-soft">{hex}</span>
        <input
          ref={inputRef}
          type="color"
          value={hex}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
      </div>
    </label>
  )
}

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { AppearanceForm } from '../../components/AppearanceForm'

export function AppearanceSection() {
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-subtle">Внешний вид</p>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-2.5">
        {editing ? (
          <div className="py-2">
            <AppearanceForm onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <p className="flex-1 font-medium">Тема и цвета</p>
            <button
              onClick={() => setEditing(true)}
              className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

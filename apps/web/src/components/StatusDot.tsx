interface Props {
  status: 'up' | 'down' | 'unknown'
}

const config = {
  up: 'bg-emerald-400',
  down: 'bg-red-500',
  unknown: 'bg-gray-600',
}

export function StatusDot({ status }: Props) {
  return (
    <span
      className={`size-2 rounded-full ${config[status]}`}
      title={status}
    />
  )
}

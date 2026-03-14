import type { Service } from '../../lib/types'

export type ServiceFormData = Omit<Service, 'id' | 'createdAt'>

export const EMPTY_SERVICE: ServiceFormData = {
  name: '', description: '', url: '', iconName: 'Globe', color: '#6366f1', sortOrder: 0, hidden: false,
}

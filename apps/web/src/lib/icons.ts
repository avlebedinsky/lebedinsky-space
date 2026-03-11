import {
  Shield,
  Workflow,
  MessageSquare,
  Globe,
  Database,
  Server,
  Cloud,
  Lock,
  Code,
  Monitor,
  Cpu,
  HardDrive,
  Network,
  Mail,
  Music,
  Video,
  Camera,
  BookOpen,
  FileText,
  Home,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Workflow,
  MessageSquare,
  Globe,
  Database,
  Server,
  Cloud,
  Lock,
  Code,
  Monitor,
  Cpu,
  HardDrive,
  Network,
  Mail,
  Music,
  Video,
  Camera,
  BookOpen,
  FileText,
  Home,
}

export const ICON_NAMES = Object.keys(iconMap)

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Globe
}

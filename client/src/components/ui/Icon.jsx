import {
  Users,
  ClipboardList,
  Building2,
  Package,
  Ruler,
  BarChart3,
  FileText,
  User,
  Bell,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns,
  Search,
  TrendingUp,
  LineChart,
  Factory,
  Trash2,
  Moon,
  ChevronsUpDown,
  BellDot,
  FileBadge,
  ClipboardCheck
} from 'lucide-react';
import styles from '@styles/Icon.module.css';

const ICONS = {
  users: Users,
  issue: ClipboardList,
  objects: Building2,
  items: Package,
  norms: Ruler,
  certificates: FileBadge,
  reports: BarChart3,
  forms: ClipboardCheck,
  user: User,
  bell: Bell,
  logout: LogOut,
  bellDot: BellDot,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  sidebar: Columns,
  search: Search,
  analytics: TrendingUp,
  reporting: LineChart,
  orders: FileText,
  manufactures: Factory,
  trash: Trash2,
  moon: Moon,
  chevronsUpDown: ChevronsUpDown
};

export default function Icon({ name, size = 18, className }) {
  const LucideIcon = ICONS[name];
  if (!LucideIcon) return null;
  return (
    <span
      className={`${styles.icon} ${className || ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size
      }}
    >
      <LucideIcon size={size} strokeWidth={2} />
    </span>
  );
}

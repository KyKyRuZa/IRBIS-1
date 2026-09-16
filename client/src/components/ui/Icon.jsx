import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  // Существующие иконки
  faUsers,
  faClipboardList,
  faBuilding,
  faBox,
  faRuler,
  faCertificate,
  faChartBar,
  faFileAlt,
  faUser,
  faBell,
  faRightFromBracket,
  faChevronDown,
  faChevronLeft,
  faChevronRight,

  // Новые иконки для сайдбара
  faAsterisk,
  faTableColumns,
  faMagnifyingGlass,
  faTableCells,
  faChartSimple,
  faChartLine,
  faFileLines,
  faFileInvoice,
  faIndustry,
  faTrash,
  faMoon,
  faSort
} from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/Icon.module.css';

const ICONS = {
  // Существующие
  users: faUsers,
  issue: faClipboardList,
  objects: faBuilding,
  items: faBox,
  norms: faRuler,
  certificates: faCertificate,
  reports: faChartBar,
  forms: faFileAlt,
  user: faUser,
  bell: faBell,
  logout: faRightFromBracket,
  bellDot: faBell,
  chevronDown: faChevronDown,
  chevronLeft: faChevronLeft,
  chevronRight: faChevronRight,

  // Новые (для нового дизайна сайдбара)
  asterisk: faAsterisk,           // Логотип
  sidebar: faTableColumns,        // Кнопка сворачивания сайдбара
  search: faMagnifyingGlass,      // Поиск
  dashboard: faTableCells,        // Dashboard (сетка)
  analytics: faChartSimple,       // Product analytics
  reporting: faChartLine,         // Reporting
  orders: faFileLines,            // Order summary
  invoices: faFileInvoice,        // Invoices
  manufactures: faIndustry,       // Manufactures
  trash: faTrash,                 // Trash
  moon: faMoon,                   // Dark mode
  chevronsUpDown: faSort,         // Иконка сортировки/переключения у профиля
};

export default function Icon({ name, size = 18, className }) {
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
      <FontAwesomeIcon icon={ICONS[name]} width={size} height={size} />
    </span>
  );
}

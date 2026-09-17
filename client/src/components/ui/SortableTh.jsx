import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import styles from '@styles/SortableTh.module.css';

export default function SortableTh({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort && sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      className={`sortable ${className}`}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <span className={`${styles.sortIndicator} ${active ? styles.active : ''}`}>
        <Icon size={14} strokeWidth={2.5} />
      </span>
    </th>
  );
}

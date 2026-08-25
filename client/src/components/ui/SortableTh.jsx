import styles from '@styles/SortableTh.module.css';

export default function SortableTh({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort && sort.key === sortKey;
  const indicator = !active ? '↕' : sort.dir === 'asc' ? '↑' : '↓';

  return (
    <th
      className={`sortable ${className}`}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <span className={`sort-indicator ${active ? 'active' : ''}`}>{indicator}</span>
    </th>
  );
}

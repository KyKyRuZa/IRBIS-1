import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/SearchBox.module.css';

export default function SearchBox({ value, onChange, placeholder = 'Поиск...' }) {
  return (
    <div className={`${styles.root} filter-field`}>
      <label className={styles.iconLabel} aria-hidden="true">&nbsp;</label>
      <div className={styles.inputWrap}>
        <Icon name="search" size={16} className={styles.icon} aria-hidden="true" />
        <input
          type="text"
          name="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

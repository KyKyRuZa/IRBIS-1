import { useState, useRef, useEffect, Children } from 'react';
import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/Dropdown.module.css';

const getOptionValue = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option;
  }
  if (option && option.props) {
    return option.props.value;
  }
  return null;
};

const getOptionLabel = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option;
  }
  if (option && option.props) {
    return option.props.children;
  }
  return null;
};

export default function Dropdown({ value, onChange, children, placeholder = 'Выберите...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (newValue) => {
    onChange(newValue);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    const items = Children.toArray(children);
    for (const child of items) {
      const optionValue = getOptionValue(child);
      if (optionValue != null && String(optionValue) === String(value)) {
        return getOptionLabel(child);
      }
    }
    return placeholder;
  };

  const renderItems = () => {
    const items = Children.toArray(children);
    return items.map((child, index) => {
      const optionValue = getOptionValue(child);
      const optionLabel = getOptionLabel(child);

      if (optionValue == null || optionLabel == null) return null;

      const isSelected = String(optionValue) === String(value);
      const key = optionValue != null ? String(optionValue) : index;

      return (
        <li
          key={key}
          className={`${styles.item} ${isSelected ? styles.active : ''}`}
          role="option"
          aria-selected={isSelected}
          onClick={() => handleSelect(optionValue)}
        >
          {optionLabel}
        </li>
      );
    });
  };

  return (
    <div className={styles.root} ref={containerRef}>
      <button
        type="button"
        className={`${styles.trigger} form-control`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.value}>{getDisplayValue()}</span>
        <Icon name="chevronDown" size={16} className={styles.chevron} />
      </button>
      {isOpen && (
        <ul className={styles.menu} role="listbox">
          {renderItems()}
        </ul>
      )}
    </div>
  );
}

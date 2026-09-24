import { useState, useRef, useEffect, Children, useCallback, useMemo } from 'react';
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const typeAheadRef = useRef('');
  const typeAheadTimerRef = useRef(null);

  const items = useMemo(() => {
    const arr = Children.toArray(children);
    return arr
      .map((child, index) => {
        const optionValue = getOptionValue(child);
        const optionLabel = getOptionLabel(child);
        if (optionValue == null || optionLabel == null) return null;
        return { value: optionValue, label: optionLabel, index };
      })
      .filter(Boolean);
  }, [children]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const scrollToIndex = (index) => {
    const menu = containerRef.current?.querySelector(`.${styles.menu}`);
    const item = menu?.children[index];
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelect = useCallback((newValue) => {
    onChange(newValue);
    setIsOpen(false);
    setActiveIndex(-1);
  }, [onChange]);

  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex(items.findIndex(item => String(item.value) === String(value)));
        return;
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(prev => {
          const next = prev < items.length - 1 ? prev + 1 : 0;
          scrollToIndex(next);
          return next;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(prev => {
          const next = prev > 0 ? prev - 1 : items.length - 1;
          scrollToIndex(next);
          return next;
        });
        break;
      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < items.length) {
          handleSelect(items[activeIndex].value);
        }
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        scrollToIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(items.length - 1);
        scrollToIndex(items.length - 1);
        break;
      case 'Tab':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    const currentIndex = items.findIndex(item => String(item.value) === String(value));
    setActiveIndex(currentIndex);
  }, [isOpen, items, value]);

  const getDisplayValue = () => {
    const item = items.find(item => String(item.value) === String(value));
    return item ? item.label : placeholder;
  };

  return (
    <div className={styles.root} ref={containerRef}>
      <button
        type="button"
        className={`${styles.trigger} form-control`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-activedescendant={activeIndex >= 0 ? `dropdown-option-${activeIndex}` : undefined}
      >
        <span className={styles.value}>{getDisplayValue()}</span>
        <Icon name="chevronDown" size={16} className={styles.chevron} />
      </button>
      {isOpen && (
        <ul className={styles.menu} role="listbox">
          {items.map((item, index) => (
            <li
              key={item.value}
              id={`dropdown-option-${index}`}
              className={`${styles.item} ${String(item.value) === String(value) ? styles.active : ''} ${index === activeIndex ? styles.highlighted : ''}`}
              role="option"
              aria-selected={String(item.value) === String(value)}
              onClick={() => handleSelect(item.value)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

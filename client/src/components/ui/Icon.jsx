import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faBell } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/Icon.module.css';

const ICONS = {
  bell: <FontAwesomeIcon icon={faBell} />,
  user: (
    <path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      fill="currentColor"
    />
  ),
  logout: <FontAwesomeIcon icon={faRightFromBracket} />,
  bellDot: (
    <>
      <FontAwesomeIcon icon={faBell} />
      <circle cx="17" cy="5" r="2" fill="currentColor" />
    </>
  ),
};

export default function Icon({ name, size = 18, className }) {
  return (
    <svg
      className={`${styles.icon} ${className || ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

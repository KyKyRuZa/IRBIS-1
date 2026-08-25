import { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceFrown } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className={styles.wrapper} role="alert">
          <div className={styles.icon}>
            <FontAwesomeIcon icon={faFaceFrown} />
          </div>
          <h2 className={styles.title}>Что-то пошло не так</h2>
          <p className={styles.message}>
            {this.state.error.message || 'Неизвестная ошибка приложения'}
          </p>
          <button type="button" className="btn" onClick={this.handleReset}>
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component } from 'react';
import { childLogger } from '@/lib/logger.js';

const log = childLogger('ErrorBoundary');

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    log.error(
      { message: error?.message, stack: error?.stack, componentStack: info?.componentStack },
      'React render error'
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Что-то пошло не так</h1>
            <p>Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

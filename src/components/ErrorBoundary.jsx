import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('MythCrit crashed due to persisted state.', error, info);
  }

  handleSafeMode = () => {
    try {
      window.localStorage.clear();
    } catch (err) {
      console.error('Failed to clear storage for safe mode', err);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem' }}>
          <div style={{ maxWidth: 520, textAlign: 'center', background: 'rgba(255,255,255,0.04)', padding: '2rem', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
            <h1 style={{ marginBottom: '1rem' }}>Что-то пошло не так 😢</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Похоже, сохранённые данные повреждены. Вы можете очистить localStorage и запустить MythCrit в безопасном режиме.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn" onClick={this.handleSafeMode}>
                Запустить в safe-mode (очистить сохранения)
              </button>
              <button className="btn btn-secondary" onClick={() => this.setState({ hasError: false, error: null })}>
                Попробовать продолжить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


import { useEffect, useState } from 'react';
=======

import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import VTT from './pages/VTT.jsx';
import HelpModal from './components/HelpModal.jsx';

import Modal from './components/Modal.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const App = () => {
  const [panicOpen, setPanicOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.altKey && event.key === 'Backspace') {
        event.preventDefault();
        setPanicOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePanicConfirm = () => {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Не удалось очистить localStorage', error);
    }
    window.location.reload();
  };

  return (
    <ErrorBoundary>
=======

const App = () => {
  return (
    <>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/vtt" element={<VTT />} />
      </Routes>
      <HelpModal />

      <Modal isOpen={panicOpen} onClose={() => setPanicOpen(false)} title="Паник-сброс">
        <p style={{ color: 'var(--text-muted)' }}>
          Очистить все сохранения и перезагрузить MythCrit? Это действие необратимо.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setPanicOpen(false)}>
            Отмена
          </button>
          <button className="btn" onClick={handlePanicConfirm}>
            Очистить и перезагрузить
          </button>
        </div>
      </Modal>
    </ErrorBoundary>
=======
    </>

  );
};

export default App;

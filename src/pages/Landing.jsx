import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUIStore } from '../store/useUIStore.js';
import { useSceneStore } from '../store/useSceneStore.js';

const Landing = () => {
  const navigate = useNavigate();
  const mode = useUIStore((state) => state.mode);
  const setMode = useUIStore((state) => state.setMode);
  const toggleHelp = useUIStore((state) => state.toggleHelp);
  const scene = useSceneStore((state) => state.scene);
  const importScene = useSceneStore((state) => state.importScene);

  const fileInputRef = useRef(null);
  const [hasSavedScene, setHasSavedScene] = useState(false);

  useEffect(() => {
    document.title = 'MythCrit — мини VTT';
    const storedScene = window.localStorage.getItem('mythcrit-scene');
    setHasSavedScene(Boolean(storedScene));
  }, []);

  useEffect(() => {
    if (scene && scene.tokens) {
      const storedScene = window.localStorage.getItem('mythcrit-scene');
      setHasSavedScene(Boolean(storedScene));
    }
  }, [scene]);

  const handleStart = () => navigate('/vtt');
  const handleContinue = () => navigate('/vtt');
  const handleOpenScene = () => fileInputRef.current?.click();

  const handleImportScene = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importScene(reader.result);
      navigate('/vtt');
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, rgba(201,162,39,0.15), transparent 55%), var(--bg-primary)',
        padding: '2rem'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ textAlign: 'center', maxWidth: 520 }}
      >
        <img src="/icons/app-logo.svg" alt="MythCrit" style={{ width: 160, marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>MythCrit</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Минималистичный виртуальный стол для приключений. Управляйте картой, токенами и заметками в одном месте.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn" onClick={handleStart}>
            Начать
          </button>
          {hasSavedScene && (
            <button className="btn btn-secondary" onClick={handleContinue}>
              Продолжить последнюю сцену
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleOpenScene}>
            Открыть сцену (.json)
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportScene} />
          <button className="btn btn-secondary" onClick={toggleHelp}>
            Справка
          </button>
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ background: mode === 'desktop' ? 'rgba(201,162,39,0.3)' : undefined }}
            onClick={() => setMode('desktop')}
          >
            Режим ПК
          </button>
          <button
            className="btn btn-secondary"
            style={{ background: mode === 'mobile' ? 'rgba(201,162,39,0.3)' : undefined }}
            onClick={() => setMode('mobile')}
          >
            Режим телефона
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;

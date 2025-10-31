import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneStore } from '../store/useSceneStore.js';
import { useUIStore } from '../store/useUIStore.js';

const emptyToken = {
  name: 'Новый токен',
  image: '/icons/token-default.png',
  size: 64,
  visible: true,
  x: 0,
  y: 0,
  scale: 1,
  rotationDeg: 0,
  locked: false
};

const TokenList = () => {
  const tokens = useSceneStore((state) => state.scene.tokens);
  const addToken = useSceneStore((state) => state.addToken);
  const removeToken = useSceneStore((state) => state.removeToken);
  const updateToken = useSceneStore((state) => state.updateToken);
  const openInspector = useUIStore((state) => state.openTokenInspector);
  const selectedTokenId = useUIStore((state) => state.selectedTokenId);
  const tokenSnapToGrid = useUIStore((state) => state.tokenSnapToGrid);
  const setTokenSnapToGrid = useUIStore((state) => state.setTokenSnapToGrid);

  const [isAdding, setIsAdding] = useState(false);

  const handleAddToken = () => {
    const id = addToken(emptyToken);
    setIsAdding(true);
    if (id) {
      openInspector(id);
    }
  };

  const handleToggleVisibility = (token) => {
    updateToken(token.id, { visible: !(token.visible !== false) });
  };

  const handleToggleLock = (token) => {
    updateToken(token.id, { locked: !token.locked });
  };

  return (
    <div className="tab-panel">
      <div className="section">
        <h3>Токены</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Управляйте существующими токенами, применяйте снап и редактируйте свойства.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
          <button className="btn" onClick={handleAddToken}>
            Добавить токен
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={tokenSnapToGrid}
              onChange={(event) => setTokenSnapToGrid(event.target.checked)}
            />
            Снэп к сетке
          </label>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <AnimatePresence>
            {tokens.map((token) => (
              <motion.div
                key={token.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`token-card${selectedTokenId === token.id ? ' token-card--active' : ''}`}
              >
                <div className="token-info">
                  <img src={token.image || '/icons/token-default.png'} alt={token.name} className="token-thumb" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{token.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                      <span>{Math.round(token.size || 64)} px</span>
                      <span>{token.visible === false ? 'Скрыт' : 'Виден'}</span>
                      <span>{token.locked ? '🔒' : '🔓'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => openInspector(token.id)}>
                    Настроить
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleToggleVisibility(token)}>
                    {token.visible === false ? 'Показать' : 'Скрыть'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleToggleLock(token)}>
                    {token.locked ? 'Разблокировать' : 'Заблокировать'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => removeToken(token.id)}>
                    Удалить
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!tokens.length && (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
              Список пуст. Перетащите изображение на карту или нажмите «Добавить токен».
            </div>
          )}
        </div>
      </div>
      {isAdding && selectedTokenId && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Новый токен добавлен — отредактируйте его параметры в инспекторе.
        </div>
      )}
    </div>
  );
};

export default TokenList;

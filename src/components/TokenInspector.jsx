import { useMemo, useState } from 'react';
import Drawer from './Drawer.jsx';
import { useUIStore } from '../store/useUIStore.js';
import { useSceneStore } from '../store/useSceneStore.js';

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const TokenInspector = () => {
  const isOpen = useUIStore((state) => state.showTokenInspector);
  const closeInspector = useUIStore((state) => state.closeTokenInspector);
  const selectedTokenId = useUIStore((state) => state.selectedTokenId);
  const setSelectedToken = useUIStore((state) => state.setSelectedToken);
  const token = useSceneStore((state) => state.scene.tokens.find((t) => t.id === selectedTokenId));
  const updateToken = useSceneStore((state) => state.updateToken);

  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    if (!selectedTokenId) return;
    updateToken(selectedTokenId, { [field]: value });
  };

  const handleNumberChange = (field, value, { min = -Infinity, max = Infinity } = {}) => {
    if (!selectedTokenId) return;
    const numeric = clamp(Number(value), min, max);
    updateToken(selectedTokenId, { [field]: numeric });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTokenId) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      updateToken(selectedTokenId, { image: reader.result });
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const memoizedContent = useMemo(() => {
    if (!token) {
      return <p style={{ color: 'var(--text-muted)' }}>Выберите токен, чтобы отредактировать его.</p>;
    }
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div className="input-group">
          <label>Имя токена</label>
          <input
            type="text"
            value={token.name || ''}
            onChange={(event) => handleChange('name', event.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Размер (px)</label>
          <input
            type="number"
            min={16}
            max={1024}
            step={8}
            value={token.size || 64}
            onChange={(event) => handleNumberChange('size', event.target.value, { min: 8, max: 1024 })}
          />
        </div>
        <div className="input-group">
          <label>Масштаб</label>
          <input
            type="number"
            min={0.1}
            max={10}
            step={0.1}
            value={token.scale || 1}
            onChange={(event) => handleNumberChange('scale', event.target.value, { min: 0.05, max: 10 })}
          />
        </div>
        <div className="input-group">
          <label>Поворот (°)</label>
          <input
            type="number"
            step={1}
            value={token.rotationDeg || 0}
            onChange={(event) => handleNumberChange('rotationDeg', event.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Координаты</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="X"
              value={token.x || 0}
              onChange={(event) => handleNumberChange('x', event.target.value)}
            />
            <input
              type="number"
              placeholder="Y"
              value={token.y || 0}
              onChange={(event) => handleNumberChange('y', event.target.value)}
            />
          </div>
        </div>
        <div className="input-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ flex: '0 0 120px' }}>Флаги</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <input
              type="checkbox"
              checked={token.visible !== false}
              onChange={() => handleChange('visible', !(token.visible !== false))}
            />
            Виден
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <input
              type="checkbox"
              checked={Boolean(token.locked)}
              onChange={() => handleChange('locked', !token.locked)}
            />
            Заблокирован
          </label>
        </div>
        <div className="input-group">
          <label>Изображение</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {uploading && <span className="badge">Загрузка...</span>}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
            <img
              src={token.image || '/icons/token-default.png'}
              alt={token.name}
              style={{ width: 128, height: 128, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>
      </div>
    );
  }, [token, selectedTokenId, uploading]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => {
        closeInspector();
        setSelectedToken(null);
      }}
      title="Параметры токена"
    >
      {memoizedContent}
    </Drawer>
  );
};

export default TokenInspector;

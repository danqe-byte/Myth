import { useMemo, useState } from 'react';
import Drawer from './Drawer.jsx';
import { useUIStore } from '../store/useUIStore.js';
import { useSceneStore } from '../store/useSceneStore.js';

const TokenInspector = () => {
  const isOpen = useUIStore((state) => state.showTokenInspector);
  const closeInspector = useUIStore((state) => state.closeTokenInspector);
  const selectedTokenId = useUIStore((state) => state.selectedTokenId);
  const token = useSceneStore((state) => state.scene.tokens.find((t) => t.id === selectedTokenId));
  const updateToken = useSceneStore((state) => state.updateToken);

  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    if (!selectedTokenId) return;
    updateToken(selectedTokenId, { [field]: value });
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
          <input type="text" value={token.name || ''} onChange={(event) => handleChange('name', event.target.value)} />
        </div>
        <div className="input-group">
          <label>Размер (px)</label>
          <input
            type="number"
            min={16}
            step={8}
            value={token.size || 64}
            onChange={(event) => handleChange('size', Number(event.target.value))}
          />
        </div>
        <div className="input-group">
          <label>Масштаб</label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={token.scale || 1}
            onChange={(event) => handleChange('scale', Number(event.target.value))}
          />
        </div>
        <div className="input-group">
          <label>Координаты</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="X"
              value={token.x || 0}
              onChange={(event) => handleChange('x', Number(event.target.value))}
            />
            <input
              type="number"
              placeholder="Y"
              value={token.y || 0}
              onChange={(event) => handleChange('y', Number(event.target.value))}
            />
          </div>
        </div>
        <div className="input-group">
          <label>Видимость</label>
          <select value={token.visible === false ? 'hidden' : 'visible'} onChange={(event) => handleChange('visible', event.target.value === 'visible')}>
            <option value="visible">Виден</option>
            <option value="hidden">Скрыт</option>
          </select>
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
    <Drawer isOpen={isOpen} onClose={closeInspector} title="Параметры токена">
      {memoizedContent}
    </Drawer>
  );
};

export default TokenInspector;

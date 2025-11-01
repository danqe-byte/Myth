import { useRef } from 'react';
import { useSceneStore } from '../store/useSceneStore.js';

const MapSettings = () => {
  const scene = useSceneStore((state) => state.scene);
  const updateScene = useSceneStore((state) => state.updateScene);
  const toggleGrid = useSceneStore((state) => state.toggleGrid);
  const toggleFog = useSceneStore((state) => state.toggleFog);
  const setMap = useSceneStore((state) => state.setMap);

  const fileInputRef = useRef(null);

  const handleImportMap = () => fileInputRef.current?.click();

  const handleMapChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMap(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="tab-panel">
      <div className="section">
        <h3>Карта</h3>
        <div className="input-group">
          <label>Текущая карта</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <img
              src={scene.mapUrl}
              alt="map preview"
              style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <button className="btn" onClick={handleImportMap}>
              Импорт карты
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleMapChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div className="input-group">
          <label>Масштаб карты</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={scene.mapScale}
            onChange={(event) => updateScene({ mapScale: Number(event.target.value) })}
          />
        </div>
        <div className="input-group">
          <label>Зум (x{scene.zoom.toFixed(2)})</label>
          <input
            type="range"
            min="0.2"
            max="4"
            step="0.1"
            value={scene.zoom}
            onChange={(event) => updateScene({ zoom: Number(event.target.value) })}
          />
        </div>
        <div className="input-group">
          <label>Сетка</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={toggleGrid}>
              {scene.grid.enabled ? 'Отключить сетку' : 'Включить сетку'}
            </button>
            <input
              type="color"
              value={scene.grid.color}
              onChange={(event) => updateScene({ grid: { ...scene.grid, color: event.target.value } })}
            />
            <input
              type="number"
              min={16}
              value={scene.grid.size}
              onChange={(event) => updateScene({ grid: { ...scene.grid, size: Number(event.target.value) } })}
            />
          </div>
        </div>
        <div className="input-group">
          <label>Туман войны</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={toggleFog}>
              {scene.fog.enabled ? 'Отключить туман' : 'Включить туман'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={scene.fog.opacity}
              onChange={(event) => updateScene({ fog: { ...scene.fog, opacity: Number(event.target.value) } })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapSettings;

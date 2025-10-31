import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '../store/useSceneStore.js';
import { useUIStore } from '../store/useUIStore.js';

const MapSettings = () => {
  const scene = useSceneStore((state) => state.scene);
  const updateScene = useSceneStore((state) => state.updateScene);
  const toggleGrid = useSceneStore((state) => state.toggleGrid);
  const toggleFog = useSceneStore((state) => state.toggleFog);
  const setMap = useSceneStore((state) => state.setMap);
  const setGrid = useSceneStore((state) => state.setGrid);
  const resetGridOffsets = useSceneStore((state) => state.resetGridOffsets);
  const addGridPreset = useSceneStore((state) => state.addGridPreset);
  const applyGridPreset = useSceneStore((state) => state.applyGridPreset);

  const showMapTransformHandles = useUIStore((state) => state.showMapTransformHandles);
  const setShowMapTransformHandles = useUIStore((state) => state.setShowMapTransformHandles);
  const beginGridCalibration = useUIStore((state) => state.beginGridCalibration);
  const cancelGridCalibration = useUIStore((state) => state.cancelGridCalibration);
  const gridCalibration = useUIStore((state) => state.gridCalibration);

  const fileInputRef = useRef(null);
  const [presetValue, setPresetValue] = useState(scene.grid.size);

  useEffect(() => {
    setPresetValue(scene.grid.size);
  }, [scene.grid.size]);

  const handleImportMap = () => fileInputRef.current?.click();

  const handleMapChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setMap(reader.result);
      } catch (error) {
        console.error('Failed to set map', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGridValue = (field, value) => {
    if (Number.isNaN(Number(value))) return;
    setGrid({ [field]: value });
  };

  const handleAddPreset = () => {
    addGridPreset(Number(presetValue));
  };

  const isCalibrating = gridCalibration?.active;

  return (
    <div className="tab-panel">
      <div className="section">
        <h3>Карта</h3>
        <div className="input-group">
          <label>Текущая карта</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <img
              src={scene.mapUrl || '/maps/default.jpg'}
              alt="map preview"
              style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}
              onError={(event) => {
                event.currentTarget.src = '/maps/default.jpg';
              }}
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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={toggleGrid}>
              {scene.grid.enabled ? 'Отключить сетку' : 'Включить сетку'}
            </button>
            <input
              type="color"
              value={scene.grid.color}
              onChange={(event) => setGrid({ color: event.target.value })}
            />
            <input
              type="number"
              min={8}
              max={512}
              value={scene.grid.size}
              onChange={(event) => handleGridValue('size', Number(event.target.value))}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Офсеты</span>
              <input
                type="number"
                step={0.1}
                value={scene.grid.offsetX}
                onChange={(event) => handleGridValue('offsetX', Number(event.target.value))}
              />
              <input
                type="number"
                step={0.1}
                value={scene.grid.offsetY}
                onChange={(event) => handleGridValue('offsetY', Number(event.target.value))}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Поворот</span>
              <input
                type="number"
                step={0.1}
                value={scene.grid.rotationDeg}
                onChange={(event) => handleGridValue('rotationDeg', Number(event.target.value))}
              />
            </label>
            <button className="btn btn-secondary" onClick={resetGridOffsets}>
              Сброс сетки
            </button>
          </div>
        </div>
        <div className="input-group">
          <label>Пресеты сетки</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {scene.gridPresets.map((value) => (
              <button key={value} className="btn btn-secondary" onClick={() => applyGridPreset(value)}>
                {value}px
              </button>
            ))}
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <input
                type="number"
                min={8}
                max={512}
                value={presetValue}
                onChange={(event) => setPresetValue(Number(event.target.value))}
              />
              <button className="btn btn-secondary" onClick={handleAddPreset}>
                Добавить
              </button>
            </div>
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
        <div className="input-group">
          <label>Ручки трансформации</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={showMapTransformHandles}
              onChange={(event) => setShowMapTransformHandles(event.target.checked)}
            />
            Показать ручки трансформации
          </label>
        </div>
        <div className="input-group">
          <label>Калибровка сетки</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn" onClick={isCalibrating ? cancelGridCalibration : beginGridCalibration}>
              {isCalibrating ? 'Отменить калибровку' : 'Калибровать сетку'}
            </button>
            {isCalibrating && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Кликните две точки на карте, затем введите количество клеток.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapSettings;

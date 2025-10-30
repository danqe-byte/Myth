import { useRef } from 'react';
import { useSceneStore } from '../store/useSceneStore.js';

const ScenePanel = () => {
  const scene = useSceneStore((state) => state.scene);
  const updateScene = useSceneStore((state) => state.updateScene);
  const importScene = useSceneStore((state) => state.importScene);
  const exportScene = useSceneStore((state) => state.exportScene);
  const setUnitsPerGrid = useSceneStore((state) => state.setUnitsPerGrid);

  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importScene(reader.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="tab-panel">
      <div className="section">
        <h3>Сцена</h3>
        <div className="input-group">
          <label>Название сцены</label>
          <input type="text" value={scene.name} onChange={(event) => updateScene({ name: event.target.value })} />
        </div>
        <div className="input-group">
          <label>Режим вписывания карты</label>
          <select value={scene.fitMode} onChange={(event) => updateScene({ fitMode: event.target.value })}>
            <option value="contain">По размеру окна</option>
            <option value="cover">Во всю сцену</option>
            <option value="stretch">Растянуть</option>
          </select>
        </div>
        <div className="input-group">
          <label>Единицы измерения</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={scene.units.label}
              onChange={(event) => updateScene({ units: { ...scene.units, label: event.target.value } })}
            />
            <input
              type="number"
              min={1}
              value={scene.units.unitsPerGrid}
              onChange={(event) => setUnitsPerGrid(Number(event.target.value))}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn" onClick={exportScene}>
            Экспорт (.json)
          </button>
          <button className="btn btn-secondary" onClick={handleImportClick}>
            Импорт (.json)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </div>
      <div className="section">
        <h3>Пресеты сетки</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[32, 50, 64, 100].map((size) => (
            <button key={size} className="btn btn-secondary" onClick={() => updateScene({ grid: { ...scene.grid, size } })}>
              {size}px
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenePanel;

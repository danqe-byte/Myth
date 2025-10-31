import { useRef } from 'react';
import { useSceneStore } from '../store/useSceneStore.js';
import { useUIStore } from '../store/useUIStore.js';

const Toolbar = () => {
  const updateScene = useSceneStore((state) => state.updateScene);
  const setMap = useSceneStore((state) => state.setMap);
  const scene = useSceneStore((state) => state.scene);
  const toggleSettings = useUIStore((state) => state.toggleSettings);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const setRulerActive = useUIStore((state) => state.setRulerActive);
  const toggleHelp = useUIStore((state) => state.toggleHelp);
  const rulerActive = useUIStore((state) => state.rulerActive);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const fileInputRef = useRef(null);

  const handleMapImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleMapImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setMap(reader.result);
      } catch (error) {
        console.error('Не удалось импортировать карту', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetCamera = () => {
    updateScene({ pan: { x: 0, y: 0 }, zoom: 1 });
  };

  return (
    <header className="toolbar">
      <button onClick={handleMapImportClick} title="Импорт карты">Импорт карты</button>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMapImport} />
      <button onClick={() => setRulerActive(!rulerActive)}>{rulerActive ? 'Выключить линейку' : 'Линейка'}</button>
      <button onClick={() => toggleSettings()}>Настройки UI</button>
      <button onClick={resetCamera} title="Сбросить панорамирование и зум">Сброс камеры</button>
      <button onClick={toggleHelp}>Справка</button>
      <button onClick={toggleSidebar} title="Tab — показать/спрятать панель">
        {sidebarOpen ? 'Скрыть панель' : 'Показать панель'}
      </button>
      <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
        {scene.name} · {scene.tokens.length} токен(ов)
      </div>
      <button onClick={() => setActiveTab('map')}>Открыть панель карты</button>
    </header>
  );
};

export default Toolbar;

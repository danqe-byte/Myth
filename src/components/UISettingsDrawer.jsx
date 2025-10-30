import Drawer from './Drawer.jsx';
import { useUIStore } from '../store/useUIStore.js';

const modes = [
  { id: 'desktop', label: 'Режим ПК', description: 'Максимум пространства, оптимально для большого экрана.' },
  { id: 'mobile', label: 'Режим телефона', description: 'Упрощённый интерфейс с укрупнёнными элементами.' }
];

const UISettingsDrawer = () => {
  const isOpen = useUIStore((state) => state.showSettings);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);
  const mode = useUIStore((state) => state.mode);
  const setMode = useUIStore((state) => state.setMode);

  return (
    <Drawer isOpen={isOpen} onClose={() => setSettingsOpen(false)} title="Настройки интерфейса">
      <div style={{ display: 'grid', gap: '1rem' }}>
        {modes.map((item) => (
          <button
            key={item.id}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.25rem',
              background: mode === item.id ? 'linear-gradient(135deg, rgba(201,162,39,0.3), rgba(122,30,36,0.3))' : undefined
            }}
            onClick={() => setMode(item.id)}
          >
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.description}</span>
          </button>
        ))}
      </div>
    </Drawer>
  );
};

export default UISettingsDrawer;

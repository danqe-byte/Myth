import Modal from './Modal.jsx';
import { useUIStore } from '../store/useUIStore.js';

const shortcuts = [
  ['Space + ЛКМ или ПКМ', 'Панорамирование карты'],
  ['Колесо мыши', 'Зум'],
  ['G', 'Переключить сетку'],
  ['F', 'Переключить туман'],
  ['R', 'Включить линейку'],
  ['Ctrl + 0/1/2', 'Режим вписывания карты'],
  ['Ctrl + S', 'Экспорт сцены']
];

const HelpModal = () => {
  const isOpen = useUIStore((state) => state.showHelp);
  const toggleHelp = useUIStore((state) => state.toggleHelp);

  return (
    <Modal isOpen={isOpen} onClose={toggleHelp} title="Справка MythCrit">
      <div style={{ display: 'grid', gap: '1rem' }}>
        <section>
          <h4>Быстрые подсказки</h4>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            MythCrit — это мини-VTT. Импортируйте карты, добавляйте токены перетаскиванием изображений и управляйте сценой в реальном времени.
          </p>
        </section>
        <section>
          <h4>Горячие клавиши</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
            {shortcuts.map(([keys, description]) => (
              <li
                key={keys}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px'
                }}
              >
                <span style={{ fontWeight: 600 }}>{keys}</span>
                <span style={{ color: 'var(--text-muted)' }}>{description}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
};

export default HelpModal;

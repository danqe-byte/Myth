import { useUIStore } from '../store/useUIStore.js';

const tabs = [
  { id: 'map', label: '🗺 Карта' },
  { id: 'tokens', label: '🎭 Токены' },
  { id: 'scene', label: '📁 Сцена' },
  { id: 'notes', label: '📝 Заметки' }
];

const SidebarTabs = () => {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <div className="sidebar-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={tab.id === activeTab ? 'active' : ''}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SidebarTabs;

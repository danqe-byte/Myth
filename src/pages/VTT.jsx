import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Toolbar from '../components/Toolbar.jsx';
import MapCanvas from '../components/MapCanvas.jsx';
import SidebarTabs from '../components/SidebarTabs.jsx';
import MapSettings from '../components/MapSettings.jsx';
import TokenList from '../components/TokenList.jsx';
import ScenePanel from '../components/ScenePanel.jsx';
import NotesPanel from '../components/NotesPanel.jsx';
import TokenInspector from '../components/TokenInspector.jsx';
import UISettingsDrawer from '../components/UISettingsDrawer.jsx';
import { useUIStore } from '../store/useUIStore.js';
import { useSceneStore } from '../store/useSceneStore.js';
import { useRuler } from '../hooks/useRuler.js';

const VTT = () => {
  const activeTab = useUIStore((state) => state.activeTab);
  const mode = useUIStore((state) => state.mode);
  const toggleGrid = useSceneStore((state) => state.toggleGrid);
  const toggleFog = useSceneStore((state) => state.toggleFog);
  const exportScene = useSceneStore((state) => state.exportScene);
  const updateScene = useSceneStore((state) => state.updateScene);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const toggleHelp = useUIStore((state) => state.toggleHelp);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  useRuler();

  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTag = event.target.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select' || event.defaultPrevented) {
        if (event.key === 'Tab') {
          return;
        }
        return;
      }

      if (event.key.toLowerCase() === 'g') {
        toggleGrid();
      }
      if (event.key.toLowerCase() === 'f') {
        toggleFog();
      }
      if ((event.ctrlKey || event.metaKey) && ['0', '1', '2'].includes(event.key)) {
        event.preventDefault();
        const fitModes = { 0: 'contain', 1: 'cover', 2: 'stretch' };
        updateScene({ fitMode: fitModes[event.key] });
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        exportScene();
      }
      if (event.key.toLowerCase() === 'm') {
        setActiveTab('map');
      }
      if (event.key === '?') {
        toggleHelp();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleGrid, toggleFog, exportScene, updateScene, setActiveTab, toggleHelp, toggleSidebar]);

  useEffect(() => {
    document.body.dataset.uiMode = mode;
  }, [mode]);

  const renderTab = () => {
    switch (activeTab) {
      case 'map':
        return <MapSettings />;
      case 'tokens':
        return <TokenList />;
      case 'scene':
        return <ScenePanel />;
      case 'notes':
        return <NotesPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell" data-mode={mode}>
      <Toolbar />
      <div
        className="grid-layout"
        style={
          mode === 'mobile'
            ? { gridTemplateColumns: '1fr', height: 'auto' }
            : sidebarOpen
              ? undefined
              : { gridTemplateColumns: '1fr' }
        }
      >
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              className="sidebar"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              <SidebarTabs />
              <div className="sidebar-content">{renderTab()}</div>
            </motion.aside>
          )}
        </AnimatePresence>
        <motion.section
          key="canvas"
          style={{ position: 'relative' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MapCanvas />
        </motion.section>
      </div>
      <TokenInspector />
      <UISettingsDrawer />
    </div>
  );
};

export default VTT;

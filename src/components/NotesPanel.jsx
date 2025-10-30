import { useEffect } from 'react';
import { useSceneStore } from '../store/useSceneStore.js';

const NotesPanel = () => {
  const notes = useSceneStore((state) => state.scene.notesMarkdown);
  const setNotes = useSceneStore((state) => state.setNotes);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="tab-panel">
      <div className="section">
        <h3>Заметки</h3>
        <textarea
          className="notes-textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Пишите заметки в формате Markdown."
        />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Содержимое автоматически сохраняется в localStorage.</p>
      </div>
    </div>
  );
};

export default NotesPanel;

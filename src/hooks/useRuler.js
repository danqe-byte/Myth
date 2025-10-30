import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore.js';

export const useRuler = () => {
  const rulerActive = useUIStore((state) => state.rulerActive);
  const setRulerActive = useUIStore((state) => state.setRulerActive);

  useEffect(() => {
    const onKeyDown = (event) => {
      const targetTag = event.target.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;
      if (event.key.toLowerCase() === 'r' && !event.repeat) {
        setRulerActive(!useUIStore.getState().rulerActive);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setRulerActive]);

  return { rulerActive, setRulerActive };
};

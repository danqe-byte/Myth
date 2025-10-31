import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from '../utils/nanoid.js';

const MIN_GRID = 8;
const MAX_GRID = 512;
const DEFAULT_GRID_PRESETS = [25, 50, 64, 100];

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const normalizeAngle = (deg = 0) => {
  const normalized = ((deg % 360) + 360) % 360;
  return Number.isFinite(normalized) ? normalized : 0;
};

const defaultGrid = {
  enabled: true,
  size: 64,
  color: '#3b3b42',
  opacity: 0.6,
  offsetX: 0,
  offsetY: 0,
  rotationDeg: 0
};

const defaultMapTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotationDeg: 0,
  skewXDeg: 0,
  skewYDeg: 0
};

const defaultScene = {
  id: 'default-scene',
  name: 'Новая сцена',
  mapUrl: '/maps/default.jpg',
  fitMode: 'contain',
  mapScale: 1,
  pan: { x: 0, y: 0 },
  zoom: 1,
  mapTransform: { ...defaultMapTransform },
  grid: { ...defaultGrid },
  fog: {
    enabled: false,
    opacity: 0.5
  },
  units: {
    label: 'ft',
    unitsPerGrid: 5
  },
  tokens: [],
  notesMarkdown: '### Добро пожаловать в MythCrit!\n\nДобавляйте заметки здесь.\n',
  gridPresets: [...DEFAULT_GRID_PRESETS]
};

const normalizeGrid = (grid = {}) => {
  const merged = { ...defaultGrid, ...grid };
  const size = clamp(Number(merged.size) || defaultGrid.size, MIN_GRID, MAX_GRID);
  const opacity = clamp(Number(merged.opacity), 0, 1);
  return {
    ...merged,
    size,
    opacity,
    offsetX: Number.isFinite(merged.offsetX) ? merged.offsetX : 0,
    offsetY: Number.isFinite(merged.offsetY) ? merged.offsetY : 0,
    rotationDeg: normalizeAngle(merged.rotationDeg)
  };
};

const normalizeMapTransform = (transform = {}) => {
  const merged = { ...defaultMapTransform, ...transform };
  return {
    x: Number.isFinite(merged.x) ? merged.x : 0,
    y: Number.isFinite(merged.y) ? merged.y : 0,
    scaleX: clamp(Number(merged.scaleX) || 1, 0.05, 20),
    scaleY: clamp(Number(merged.scaleY) || 1, 0.05, 20),
    rotationDeg: normalizeAngle(merged.rotationDeg),
    skewXDeg: normalizeAngle(merged.skewXDeg),
    skewYDeg: normalizeAngle(merged.skewYDeg)
  };
};

const normalizeToken = (token = {}) => ({
  id: token.id || nanoid(),
  name: token.name || 'Токен',
  image: token.image || '/icons/token-default.png',
  size: clamp(Number(token.size) || 64, 8, 1024),
  visible: token.visible !== false,
  x: Number.isFinite(token.x) ? token.x : 0,
  y: Number.isFinite(token.y) ? token.y : 0,
  scale: clamp(Number(token.scale) || 1, 0.05, 10),
  rotationDeg: normalizeAngle(token.rotationDeg || 0),
  locked: Boolean(token.locked),
  metadata: token.metadata || {}
});

const normalizeScene = (raw) => {
  if (!raw) return { ...defaultScene, tokens: [] };
  const merged = { ...defaultScene, ...raw };
  const id = raw?.id || raw?.sceneId || merged.id || nanoid();
  const pan = {
    x: Number.isFinite(raw?.pan?.x) ? raw.pan.x : defaultScene.pan.x,
    y: Number.isFinite(raw?.pan?.y) ? raw.pan.y : defaultScene.pan.y
  };
  const zoom = clamp(Number(raw?.zoom) || defaultScene.zoom, 0.1, 10);
  const mapScale = clamp(Number(raw?.mapScale) || defaultScene.mapScale, 0.1, 10);
  const fog = {
    enabled: Boolean(raw?.fog?.enabled),
    opacity: clamp(Number(raw?.fog?.opacity), 0, 1)
  };
  const units = {
    label: raw?.units?.label || defaultScene.units.label,
    unitsPerGrid: clamp(Number(raw?.units?.unitsPerGrid) || defaultScene.units.unitsPerGrid, 0.1, 1000)
  };
  const gridPresets = Array.isArray(raw?.gridPresets) && raw.gridPresets.length
    ? raw.gridPresets
        .map((value) => clamp(Number(value) || MIN_GRID, MIN_GRID, MAX_GRID))
        .filter((value, index, array) => array.indexOf(value) === index)
    : [...DEFAULT_GRID_PRESETS];
  return {
    ...merged,
    id,
    pan,
    zoom,
    mapScale,
    fog,
    units,
    gridPresets,
    grid: normalizeGrid(raw?.grid),
    mapTransform: normalizeMapTransform(raw?.mapTransform),
    tokens: Array.isArray(raw?.tokens) ? raw.tokens.map((token) => normalizeToken(token)) : [],
    notesMarkdown: typeof raw?.notesMarkdown === 'string' ? raw.notesMarkdown : defaultScene.notesMarkdown
  };
};

const mergeScenePartial = (scene, partial) => {
  if (!partial) return scene;
  const merged = { ...scene, ...partial };
  if (partial.grid) {
    merged.grid = { ...scene.grid, ...partial.grid };
  }
  if (partial.fog) {
    merged.fog = { ...scene.fog, ...partial.fog };
  }
  if (partial.units) {
    merged.units = { ...scene.units, ...partial.units };
  }
  if (partial.mapTransform) {
    merged.mapTransform = { ...scene.mapTransform, ...partial.mapTransform };
  }
  if (partial.pan) {
    merged.pan = { ...scene.pan, ...partial.pan };
  }
  return merged;
};

export const useSceneStore = create(
  persist(
    (set, get) => ({
      scene: normalizeScene(defaultScene),
      setScene: (scene) => set({ scene: normalizeScene(scene) }),
      updateScene: (partial) =>
        set((state) => ({ scene: normalizeScene(mergeScenePartial(state.scene, partial)) })),
      setMap: (mapUrl) => set((state) => ({ scene: normalizeScene({ ...state.scene, mapUrl }) })),
      setPanZoom: ({ pan, zoom }) =>
        set((state) => {
          const next = mergeScenePartial(state.scene, {
            pan: pan ?? state.scene.pan,
            zoom: zoom ?? state.scene.zoom
          });
          return { scene: normalizeScene(next) };
        }),
      toggleGrid: () =>
        set((state) => ({
          scene: normalizeScene({
            ...state.scene,
            grid: { ...state.scene.grid, enabled: !state.scene.grid.enabled }
          })
        })),
      toggleFog: () =>
        set((state) => ({
          scene: normalizeScene({
            ...state.scene,
            fog: { ...state.scene.fog, enabled: !state.scene.fog.enabled }
          })
        })),
      setGrid: (gridPartial) =>
        set((state) => ({
          scene: normalizeScene({
            ...state.scene,
            grid: { ...state.scene.grid, ...gridPartial }
          })
        })),
      resetGridOffsets: () =>
        set((state) => ({
          scene: normalizeScene({
            ...state.scene,
            grid: {
              ...state.scene.grid,
              offsetX: 0,
              offsetY: 0,
              rotationDeg: 0
            }
          })
        })),
      setMapTransform: (partial) =>
        set((state) => ({
          scene: normalizeScene({
            ...state.scene,
            mapTransform: { ...state.scene.mapTransform, ...partial }
          })
        })),
      resetMapTransform: () =>
        set((state) => ({
          scene: normalizeScene({
            ...state.scene,
            mapTransform: { ...defaultMapTransform }
          })
        })),
      addToken: (token) => {
        const normalized = normalizeToken(token);
        set((state) => ({
          scene: {
            ...state.scene,
            tokens: [...state.scene.tokens, normalized]
          }
        }));
        return normalized.id;
      },
      updateToken: (id, updates) =>
        set((state) => ({
          scene: {
            ...state.scene,
            tokens: state.scene.tokens.map((token) =>
              token.id === id ? { ...token, ...normalizeToken({ ...token, ...updates }) } : token
            )
          }
        })),
      removeToken: (id) =>
        set((state) => ({
          scene: {
            ...state.scene,
            tokens: state.scene.tokens.filter((token) => token.id !== id)
          }
        })),
      setTokens: (tokens) =>
        set((state) => ({
          scene: {
            ...state.scene,
            tokens: tokens.map((token) => normalizeToken(token))
          }
        })),
      importScene: (sceneJson) => {
        try {
          const parsed = typeof sceneJson === 'string' ? JSON.parse(sceneJson) : sceneJson;
          set({ scene: normalizeScene(parsed) });
        } catch (err) {
          console.error('Failed to import scene', err);
        }
      },
      exportScene: () => {
        try {
          const data = JSON.stringify(get().scene, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${get().scene.name || 'scene'}.json`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to export scene', error);
        }
      },
      setNotes: (notesMarkdown) =>
        set((state) => ({
          scene: {
            ...state.scene,
            notesMarkdown: typeof notesMarkdown === 'string' ? notesMarkdown : state.scene.notesMarkdown
          }
        })),
      addGridPreset: (value) =>
        set((state) => {
          const size = clamp(Number(value), MIN_GRID, MAX_GRID);
          if (!Number.isFinite(size)) return { scene: state.scene };
          const presets = state.scene.gridPresets.includes(size)
            ? state.scene.gridPresets
            : [...state.scene.gridPresets, size].sort((a, b) => a - b);
          return { scene: { ...state.scene, gridPresets: presets } };
        }),
      applyGridPreset: (value) =>
        set((state) => ({
          scene: normalizeScene({
            ...state.scene,
            grid: { ...state.scene.grid, size: Number(value) }
          })
        })),
      calibrateGrid: ({ start, end, cells }) => {
        if (!start || !end || !cells) return;
        const count = clamp(Number(cells), 0.1, 1000);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.hypot(dx, dy);
        if (!distance) return;
        const size = clamp(distance / count, MIN_GRID, MAX_GRID);
        const angleRad = Math.atan2(dy, dx);
        const rotationDeg = normalizeAngle((angleRad * 180) / Math.PI);
        const cos = Math.cos(-angleRad);
        const sin = Math.sin(-angleRad);
        const alignedStartX = start.x * cos - start.y * sin;
        const alignedStartY = start.x * sin + start.y * cos;
        const wrap = (value) => {
          const mod = value % size;
          return Number.isFinite(mod) ? (mod + size) % size : 0;
        };
        const offsetX = wrap(alignedStartX);
        const offsetY = wrap(alignedStartY);
        set((state) => ({
          scene: normalizeScene({
            ...state.scene,
            grid: {
              ...state.scene.grid,
              size,
              rotationDeg,
              offsetX,
              offsetY
            }
          })
        }));
      },
      resetScene: () => set({ scene: normalizeScene({ ...defaultScene, id: nanoid() }) })
    }),
    {
      name: 'mythcrit-scene',
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState) {
          return { scene: normalizeScene(defaultScene) };
        }
        if (version < 1 || !persistedState.scene) {
          return { scene: normalizeScene(persistedState.scene || persistedState) };
        }
        return { scene: normalizeScene(persistedState.scene) };
      }
    }
  )
);

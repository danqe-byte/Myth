import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useSceneStore } from '../store/useSceneStore.js';
import { useUIStore } from '../store/useUIStore.js';
import { loadSafeTexture } from '../lib/safeTexture.js';

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const degToRad = (deg) => (deg * Math.PI) / 180;
const radToDeg = (rad) => (rad * 180) / Math.PI;
const normalizeAngle = (deg) => ((deg % 360) + 360) % 360;

const buildHandleLayout = (mapGroup, mapSize, containerRect, worldScale = 1) => {
  if (!mapGroup || !mapSize || !containerRect) return null;
  const halfWidth = mapSize.width / 2;
  const halfHeight = mapSize.height / 2;
  const points = {
    nw: new PIXI.Point(-halfWidth, -halfHeight),
    n: new PIXI.Point(0, -halfHeight),
    ne: new PIXI.Point(halfWidth, -halfHeight),
    e: new PIXI.Point(halfWidth, 0),
    se: new PIXI.Point(halfWidth, halfHeight),
    s: new PIXI.Point(0, halfHeight),
    sw: new PIXI.Point(-halfWidth, halfHeight),
    w: new PIXI.Point(-halfWidth, 0)
  };
  const center = mapGroup.toGlobal(new PIXI.Point(0, 0));
  const handles = Object.entries(points).reduce((acc, [key, point]) => {
    const global = mapGroup.toGlobal(point);
    acc[key] = {
      x: global.x + containerRect.left,
      y: global.y + containerRect.top
    };
    return acc;
  }, {});
  const rotationAnchor = mapGroup.toGlobal(new PIXI.Point(0, -halfHeight - 60 / worldScale));
  handles.rotation = {
    x: rotationAnchor.x + containerRect.left,
    y: rotationAnchor.y + containerRect.top
  };
  const bounds = mapGroup.getBounds();
  return {
    center: {
      x: center.x + containerRect.left,
      y: center.y + containerRect.top
    },
    handles,
    bounds
  };
};

const MapCanvas = () => {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const mapGroupRef = useRef(null);
  const mapSpriteRef = useRef(null);
  const gridGraphicsRef = useRef(null);
  const fogGraphicsRef = useRef(null);
  const tokensLayerRef = useRef(null);
  const rulerLayerRef = useRef(null);
  const mapSizeRef = useRef({ width: 1, height: 1 });
  const draggingTokenRef = useRef(null);
  const transformSessionRef = useRef(null);
  const calibrationPointsRef = useRef([]);
  const tokenTexturesRef = useRef(new Map());
  const spacePressedRef = useRef(false);

  const scene = useSceneStore((state) => state.scene);
  const setPanZoom = useSceneStore((state) => state.setPanZoom);
  const setMapTransform = useSceneStore((state) => state.setMapTransform);
  const updateScene = useSceneStore((state) => state.updateScene);
  const calibrateGrid = useSceneStore((state) => state.calibrateGrid);
  const updateToken = useSceneStore((state) => state.updateToken);
  const addToken = useSceneStore((state) => state.addToken);

  const showMapTransformHandles = useUIStore((state) => state.showMapTransformHandles);
  const tokenSnapToGrid = useUIStore((state) => state.tokenSnapToGrid);
  const gridCalibration = useUIStore((state) => state.gridCalibration);
  const beginGridCalibration = useUIStore((state) => state.beginGridCalibration);
  const addGridCalibrationPoint = useUIStore((state) => state.addGridCalibrationPoint);
  const cancelGridCalibration = useUIStore((state) => state.cancelGridCalibration);
  const completeGridCalibration = useUIStore((state) => state.completeGridCalibration);
  const setSelectedToken = useUIStore((state) => state.setSelectedToken);
  const selectedTokenId = useUIStore((state) => state.selectedTokenId);

  const rulerActive = useUIStore((state) => state.rulerActive);

  const [downscaleInfo, setDownscaleInfo] = useState(null);
  const [mapHandles, setMapHandles] = useState(null);
  const [tokenHandles, setTokenHandles] = useState(null);
  const [calibrationInput, setCalibrationInput] = useState('');
  const [calibrationPromptVisible, setCalibrationPromptVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        spacePressedRef.current = true;
      }
    };
    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        spacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const refreshWorldTransform = useCallback(() => {
    const app = appRef.current;
    const world = worldRef.current;
    if (!app || !world) return;
    const { pan, zoom, mapScale } = scene;
    world.position.set(pan.x, pan.y);
    world.scale.set(zoom * mapScale);
  }, [scene]);

  const refreshMapTransform = useCallback(() => {
    const mapGroup = mapGroupRef.current;
    if (!mapGroup) return;
    const { mapTransform } = scene;
    mapGroup.position.set(mapTransform.x, mapTransform.y);
    mapGroup.scale.set(mapTransform.scaleX, mapTransform.scaleY);
    mapGroup.rotation = degToRad(mapTransform.rotationDeg);
    mapGroup.skew.set(degToRad(mapTransform.skewXDeg), degToRad(mapTransform.skewYDeg));
  }, [scene]);

  const refreshGrid = useCallback(() => {
    const gridGraphics = gridGraphicsRef.current;
    const mapGroup = mapGroupRef.current;
    const app = appRef.current;
    if (!gridGraphics || !mapGroup || !app) return;
    gridGraphics.clear();
    const { grid } = scene;
    if (!grid.enabled) return;
    const { width, height } = mapSizeRef.current;
    const spacing = grid.size;
    const maxDimension = Math.max(width, height) * 2;
    gridGraphics.lineStyle(1, PIXI.utils.string2hex(grid.color || '#3b3b42'), clamp(grid.opacity, 0, 1));
    for (let x = -maxDimension; x <= maxDimension; x += spacing) {
      gridGraphics.moveTo(x, -maxDimension);
      gridGraphics.lineTo(x, maxDimension);
    }
    for (let y = -maxDimension; y <= maxDimension; y += spacing) {
      gridGraphics.moveTo(-maxDimension, y);
      gridGraphics.lineTo(maxDimension, y);
    }
    gridGraphics.pivot.set(-grid.offsetX, -grid.offsetY);
    gridGraphics.rotation = degToRad(grid.rotationDeg);
  }, [scene]);

  const refreshFog = useCallback(() => {
    const fogGraphics = fogGraphicsRef.current;
    if (!fogGraphics) return;
    fogGraphics.clear();
    if (!scene.fog.enabled) return;
    fogGraphics.beginFill(0x000000, clamp(scene.fog.opacity, 0, 1));
    const { width, height } = mapSizeRef.current;
    fogGraphics.drawRect(-width, -height, width * 2, height * 2);
    fogGraphics.endFill();
  }, [scene]);

  const updateMapHandles = useCallback(() => {
    const container = containerRef.current;
    if (!container || !showMapTransformHandles) {
      setMapHandles(null);
      return;
    }
    const mapGroup = mapGroupRef.current;
    const world = worldRef.current;
    if (!mapGroup || !world) {
      setMapHandles(null);
      return;
    }
    const rect = container.getBoundingClientRect();
    const layout = buildHandleLayout(mapGroup, mapSizeRef.current, rect, world.scale.x || 1);
    setMapHandles(layout);
  }, [showMapTransformHandles]);

  const updateTokenHandleLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container || !selectedTokenId) {
      setTokenHandles(null);
      return;
    }
    const tokensLayer = tokensLayerRef.current;
    const tokenSprite = tokensLayer?.children.find((child) => child.mythcritTokenId === selectedTokenId);
    if (!tokenSprite) {
      setTokenHandles(null);
      return;
    }
    const rect = container.getBoundingClientRect();
    const worldTransform = tokenSprite.worldTransform;
    const width = tokenSprite.width;
    const height = tokenSprite.height;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const points = {
      nw: new PIXI.Point(-halfWidth, -halfHeight),
      ne: new PIXI.Point(halfWidth, -halfHeight),
      sw: new PIXI.Point(-halfWidth, halfHeight),
      se: new PIXI.Point(halfWidth, halfHeight)
    };
    const center = worldTransform.apply(new PIXI.Point(0, 0));
    const handles = Object.entries(points).reduce((acc, [key, value]) => {
      const global = worldTransform.apply(value);
      acc[key] = {
        x: global.x + rect.left,
        y: global.y + rect.top
      };
      return acc;
    }, {});
    const rotationPoint = worldTransform.apply(new PIXI.Point(0, -halfHeight - 32));
    handles.rotation = {
      x: rotationPoint.x + rect.left,
      y: rotationPoint.y + rect.top
    };
    setTokenHandles({
      center: {
        x: center.x + rect.left,
        y: center.y + rect.top
      },
      handles
    });
  }, [selectedTokenId]);

  const snapPointToGrid = useCallback(
    (localPoint) => {
      const { grid } = useSceneStore.getState().scene;
      if (!grid.enabled) return localPoint;
      const size = grid.size || 1;
      const rotation = degToRad(grid.rotationDeg || 0);
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const alignedX = (localPoint.x + grid.offsetX) * cos + (localPoint.y + grid.offsetY) * sin;
      const alignedY = -(localPoint.x + grid.offsetX) * sin + (localPoint.y + grid.offsetY) * cos;
      const snappedAlignedX = Math.round(alignedX / size) * size;
      const snappedAlignedY = Math.round(alignedY / size) * size;
      const x = (snappedAlignedX * cos - snappedAlignedY * sin) - grid.offsetX;
      const y = (snappedAlignedX * sin + snappedAlignedY * cos) - grid.offsetY;
      return { x, y };
    },
    []
  );

  const destroyApp = useCallback(() => {
    if (appRef.current) {
      appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
      worldRef.current = null;
      mapGroupRef.current = null;
      mapSpriteRef.current = null;
      gridGraphicsRef.current = null;
      fogGraphicsRef.current = null;
      tokensLayerRef.current = null;
      rulerLayerRef.current = null;
    }
  }, []);

  const ensureApp = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    destroyApp();
    const app = new PIXI.Application({
      resizeTo: container,
      background: '#0c0c0f',
      antialias: true
    });
    appRef.current = app;
    container.appendChild(app.view);

    const worldContainer = new PIXI.Container();
    worldContainer.name = 'worldContainer';
    worldRef.current = worldContainer;
    app.stage.addChild(worldContainer);

    const mapGroup = new PIXI.Container();
    mapGroup.name = 'mapGroup';
    mapGroupRef.current = mapGroup;
    worldContainer.addChild(mapGroup);

    const mapSprite = new PIXI.Sprite();
    mapSprite.anchor.set(0.5);
    mapSpriteRef.current = mapSprite;
    mapGroup.addChild(mapSprite);

    const gridGraphics = new PIXI.Graphics();
    gridGraphicsRef.current = gridGraphics;
    mapGroup.addChild(gridGraphics);

    const fogGraphics = new PIXI.Graphics();
    fogGraphicsRef.current = fogGraphics;
    mapGroup.addChild(fogGraphics);

    const tokensLayer = new PIXI.Container();
    tokensLayerRef.current = tokensLayer;
    worldContainer.addChild(tokensLayer);

    const rulerLayer = new PIXI.Container();
    rulerLayerRef.current = rulerLayer;
    worldContainer.addChild(rulerLayer);

    const onPointerDown = (event) => {
      const { button } = event.data;
      const isRightButton = button === 2;
      const isSpacePan = spacePressedRef.current && button === 0;
      const pointer = event.data.global.clone();
      const calibrating = useUIStore.getState().gridCalibration.active;
      transformSessionRef.current = {
        pan: true,
        button,
        last: pointer
      };
      if (calibrating) {
        if (calibrationPointsRef.current.length >= 2) {
          return;
        }
        const mapGroup = mapGroupRef.current;
        if (mapGroup) {
          const local = mapGroup.toLocal(pointer);
          addGridCalibrationPoint({ x: local.x, y: local.y });
          calibrationPointsRef.current = [...calibrationPointsRef.current, { x: local.x, y: local.y }];
        }
      }
      if (!isRightButton && !isSpacePan && !calibrating) {
        const tokensLayer = tokensLayerRef.current;
        const hitToken = tokensLayer?.children
          ?.slice()
          .reverse()
          .find((child) => child.containsPoint(pointer));
        if (hitToken && !hitToken.mythcritLocked) {
          draggingTokenRef.current = {
            tokenId: hitToken.mythcritTokenId,
            sprite: hitToken,
            offset: hitToken.toLocal(pointer)
          };
          setSelectedToken(hitToken.mythcritTokenId);
        }
      }
    };

    const onPointerMove = (event) => {
      const session = transformSessionRef.current;
      if (!session?.pan) return;
      const pointer = event.data.global.clone();
      const deltaX = pointer.x - session.last.x;
      const deltaY = pointer.y - session.last.y;
      const currentScene = useSceneStore.getState().scene;
      if (draggingTokenRef.current && !(spacePressedRef.current && session.button === 0)) {
        const { sprite, tokenId } = draggingTokenRef.current;
        const local = sprite.parent.toLocal(pointer);
        let x = local.x;
        let y = local.y;
        if (tokenSnapToGrid) {
          const mapGroup = mapGroupRef.current;
          if (mapGroup) {
            const snapped = snapPointToGrid(mapGroup.toLocal(pointer));
            const worldPoint = mapGroup.toGlobal(new PIXI.Point(snapped.x, snapped.y));
            const localSnapped = sprite.parent.toLocal(worldPoint);
            x = localSnapped.x;
            y = localSnapped.y;
          }
        }
        sprite.position.set(x, y);
        updateToken(tokenId, { x, y });
      } else if (session.button === 2 || spacePressedRef.current || session.button === 1) {
        const newPan = {
          x: currentScene.pan.x + deltaX,
          y: currentScene.pan.y + deltaY
        };
        worldContainer.position.set(newPan.x, newPan.y);
        setPanZoom({ pan: newPan });
      }
      session.last = pointer;
    };

    const onPointerUp = () => {
      transformSessionRef.current = null;
      draggingTokenRef.current = null;
    };

    app.stage.interactive = true;
    app.stage.hitArea = app.screen;
    app.stage.on('pointerdown', onPointerDown);
    app.stage.on('pointermove', onPointerMove);
    app.stage.on('pointerup', onPointerUp);
    app.stage.on('pointerupoutside', onPointerUp);

    container.addEventListener('contextmenu', (event) => event.preventDefault());

    const onWheel = (event) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      const factor = direction > 0 ? 1.1 : 0.9;
      const currentScene = useSceneStore.getState().scene;
      const newZoom = clamp(currentScene.zoom * factor, 0.2, 6);
      worldContainer.scale.set(newZoom * currentScene.mapScale);
      useSceneStore.getState().setPanZoom({ zoom: newZoom });
    };
    container.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      app.renderer.resize(container.clientWidth, container.clientHeight);
      updateMapHandles();
      updateTokenHandleLayout();
    };
    window.addEventListener('resize', onResize);

    return () => {
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      destroyApp();
    };
  }, [addGridCalibrationPoint, destroyApp, setPanZoom, snapPointToGrid, tokenSnapToGrid, updateMapHandles, updateToken, updateTokenHandleLayout]);

  useEffect(() => {
    ensureApp();
    return () => destroyApp();
  }, [ensureApp, destroyApp]);

  useEffect(() => {
    const loadTexture = async () => {
      const mapSprite = mapSpriteRef.current;
      const app = appRef.current;
      if (!mapSprite || !app) return;
      try {
        const texture = await loadSafeTexture(scene.mapUrl || '/maps/default.jpg', app.renderer);
        mapSprite.texture = texture;
        mapSprite.width = texture.width;
        mapSprite.height = texture.height;
        mapSizeRef.current = { width: texture.width, height: texture.height };
        setDownscaleInfo(texture.mythcritMeta?.downscaled ? texture.mythcritMeta : null);
        refreshMapTransform();
        refreshGrid();
        refreshFog();
        updateMapHandles();
      } catch (error) {
        console.warn('Не удалось загрузить карту, используем заглушку.', error);
        if (scene.mapUrl !== '/maps/default.jpg') {
          updateScene({ mapUrl: '/maps/default.jpg' });
        }
      }
    };
    loadTexture();
  }, [refreshFog, refreshGrid, refreshMapTransform, scene.mapUrl, updateMapHandles, updateScene]);

  useEffect(() => {
    refreshWorldTransform();
    refreshMapTransform();
    updateMapHandles();
    updateTokenHandleLayout();
  }, [refreshWorldTransform, refreshMapTransform, scene.mapTransform, scene.pan.x, scene.pan.y, scene.zoom, scene.mapScale, updateMapHandles, updateTokenHandleLayout]);

  useEffect(() => {
    refreshGrid();
    updateMapHandles();
  }, [refreshGrid, scene.grid.enabled, scene.grid.size, scene.grid.color, scene.grid.opacity, scene.grid.offsetX, scene.grid.offsetY, scene.grid.rotationDeg, updateMapHandles]);

  useEffect(() => {
    refreshFog();
  }, [refreshFog, scene.fog.enabled, scene.fog.opacity]);

  useEffect(() => {
    const tokensLayer = tokensLayerRef.current;
    const app = appRef.current;
    if (!tokensLayer || !app) return;
    const loadTokenTexture = async (image) => {
      if (!image) return PIXI.Texture.WHITE;
      if (tokenTexturesRef.current.has(image)) {
        return tokenTexturesRef.current.get(image);
      }
      try {
        const texture = await loadSafeTexture(image, app.renderer, { maxSideHint: 2048 });
        tokenTexturesRef.current.set(image, texture);
        return texture;
      } catch (error) {
        console.warn('Не удалось загрузить изображение токена, используется заглушка.', error);
        if (image !== '/icons/token-default.png') {
          const fallback = await loadSafeTexture('/icons/token-default.png', app.renderer, { maxSideHint: 2048 });
          tokenTexturesRef.current.set(image, fallback);
          return fallback;
        }
        return PIXI.Texture.WHITE;
      }
    };

    const syncTokens = async () => {
      const existingSprites = new Map();
      tokensLayer.children.forEach((child) => {
        if (child.mythcritTokenId) {
          existingSprites.set(child.mythcritTokenId, child);
        }
      });
      for (const sprite of tokensLayer.children.slice()) {
        if (sprite.mythcritTokenId && !scene.tokens.find((token) => token.id === sprite.mythcritTokenId)) {
          tokensLayer.removeChild(sprite);
          sprite.destroy({ children: true, texture: false, baseTexture: false });
        }
      }
      for (const token of scene.tokens) {
        let sprite = existingSprites.get(token.id);
        if (!sprite) {
          const texture = await loadTokenTexture(token.image || '/icons/token-default.png');
          sprite = new PIXI.Sprite(texture);
          sprite.anchor.set(0.5);
          sprite.interactive = true;
          sprite.buttonMode = true;
          sprite.cursor = token.locked ? 'not-allowed' : 'move';
          sprite.mythcritTokenId = token.id;
          sprite.mythcritImageKey = token.image || '/icons/token-default.png';
          sprite.on('pointerdown', () => {
            if (token.locked) return;
            setSelectedToken(token.id);
          });
          tokensLayer.addChild(sprite);
        }
        if (sprite.mythcritImageKey !== (token.image || '/icons/token-default.png')) {
          const texture = await loadTokenTexture(token.image || '/icons/token-default.png');
          sprite.texture = texture;
          sprite.mythcritImageKey = token.image || '/icons/token-default.png';
        }
        sprite.mythcritLocked = Boolean(token.locked);
        sprite.visible = token.visible !== false;
        sprite.cursor = token.locked ? 'not-allowed' : 'move';
        sprite.rotation = degToRad(token.rotationDeg || 0);
        const size = token.size || 64;
        const baseTextureWidth = sprite.texture.width || 1;
        const scale = (size / baseTextureWidth) * (token.scale || 1);
        sprite.scale.set(scale);
        sprite.position.set(token.x || 0, token.y || 0);
      }
      updateTokenHandleLayout();
    };

    syncTokens();
  }, [scene.tokens, setSelectedToken, updateTokenHandleLayout]);

  useEffect(() => {
    const handleDrop = (event) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files || []);
      const images = files.filter((file) => file.type.startsWith('image/'));
      if (!images.length) return;
      images.forEach((image) => {
        const reader = new FileReader();
        reader.onload = () => {
          const currentScene = useSceneStore.getState().scene;
          addToken({
            name: image.name.replace(/\.[^.]+$/, ''),
            image: reader.result,
            size: currentScene.grid.size,
            visible: true,
            x: 0,
            y: 0,
            scale: 1,
            rotationDeg: 0
          });
        };
        reader.readAsDataURL(image);
      });
    };
    const handleDragOver = (event) => {
      event.preventDefault();
    };
    const container = containerRef.current;
    if (!container) return undefined;
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragover', handleDragOver);
    return () => {
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragover', handleDragOver);
    };
  }, [addToken]);

  useEffect(() => {
    if (!rulerActive) return undefined;
    const app = appRef.current;
    const rulerLayer = rulerLayerRef.current;
    if (!app || !rulerLayer) return undefined;

    const graphics = new PIXI.Graphics();
    rulerLayer.addChild(graphics);
    const label = new PIXI.Text('', {
      fill: '#e5e7eb',
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      stroke: '#0c0c0f',
      strokeThickness: 3
    });
    rulerLayer.addChild(label);
    let startPoint = null;

    const onDown = (event) => {
      const global = event.data.global;
      const local = rulerLayer.toLocal(global);
      startPoint = local;
    };
    const onMove = (event) => {
      if (!startPoint) return;
      const global = event.data.global;
      const local = rulerLayer.toLocal(global);
      graphics.clear();
      graphics.lineStyle(2, 0xc9a227, 1);
      graphics.moveTo(startPoint.x, startPoint.y);
      graphics.lineTo(local.x, local.y);
      const dx = local.x - startPoint.x;
      const dy = local.y - startPoint.y;
      const distance = Math.hypot(dx, dy);
      const cells = distance / (scene.grid.size || 1);
      const units = cells * scene.units.unitsPerGrid;
      label.text = `${cells.toFixed(1)} клеток / ${units.toFixed(1)} ${scene.units.label}`;
      label.position.set(local.x + 12, local.y + 12);
    };
    const onUp = () => {
      startPoint = null;
      graphics.clear();
      label.text = '';
    };
    app.stage.on('pointerdown', onDown);
    app.stage.on('pointermove', onMove);
    app.stage.on('pointerup', onUp);
    app.stage.on('pointerupoutside', onUp);

    return () => {
      app.stage.off('pointerdown', onDown);
      app.stage.off('pointermove', onMove);
      app.stage.off('pointerup', onUp);
      app.stage.off('pointerupoutside', onUp);
      rulerLayer.removeChild(graphics);
      rulerLayer.removeChild(label);
      graphics.destroy();
      label.destroy();
    };
  }, [rulerActive, scene.grid.size, scene.units.label, scene.units.unitsPerGrid]);

  useEffect(() => {
    updateMapHandles();
  }, [showMapTransformHandles, updateMapHandles]);

  useEffect(() => {
    updateTokenHandleLayout();
  }, [selectedTokenId, updateTokenHandleLayout]);

  useEffect(() => {
    if (!gridCalibration?.active) {
      setCalibrationPromptVisible(false);
      calibrationPointsRef.current = [];
      return;
    }
    if (gridCalibration.points.length >= 2) {
      setCalibrationPromptVisible(true);
    }
  }, [gridCalibration]);

  const handleCalibrationConfirm = useCallback(() => {
    const cells = Number(calibrationInput);
    if (!cells) return;
    const [start, end] = calibrationPointsRef.current;
    calibrateGrid({ start, end, cells });
    setCalibrationInput('');
    calibrationPointsRef.current = [];
    completeGridCalibration();
    setCalibrationPromptVisible(false);
  }, [calibrateGrid, calibrationInput, completeGridCalibration]);

  const handleCalibrationCancel = useCallback(() => {
    setCalibrationInput('');
    calibrationPointsRef.current = [];
    cancelGridCalibration();
    setCalibrationPromptVisible(false);
  }, [cancelGridCalibration]);

  const pointerToLocalMap = useCallback((event) => {
    const container = containerRef.current;
    const app = appRef.current;
    const mapGroup = mapGroupRef.current;
    if (!container || !app || !mapGroup) return null;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const global = new PIXI.Point(x, y);
    return mapGroup.toLocal(global);
  }, []);

  const pointerToMapGroup = useCallback((event) => {
    const container = containerRef.current;
    const mapGroup = mapGroupRef.current;
    if (!container || !mapGroup) return null;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const global = new PIXI.Point(x, y);
    return { global, local: mapGroup.toLocal(global) };
  }, []);

  const beginTransformSession = useCallback(
    (type, handleKey, event, options = {}) => {
      const mapGroup = mapGroupRef.current;
      if (!mapGroup) return;
      const { global, local } = pointerToMapGroup(event);
      transformSessionRef.current = {
        type,
        handleKey,
        startLocal: local,
        startGlobal: global,
        startTransform: { ...scene.mapTransform },
        modifiers: {
          shift: event.shiftKey,
          alt: event.altKey,
          ctrl: event.ctrlKey
        },
        options
      };
      window.addEventListener('pointermove', onTransformPointerMove);
      window.addEventListener('pointerup', endTransformSession);
    },
    [pointerToMapGroup, scene.mapTransform]
  );

  const onTransformPointerMove = useCallback(
    (event) => {
      const session = transformSessionRef.current;
      const mapGroup = mapGroupRef.current;
      if (!session || !mapGroup) return;
      const { global, local } = pointerToMapGroup(event);
      const { startTransform, startLocal, handleKey } = session;
      let nextTransform = { ...startTransform };
      if (session.type === 'move') {
        const dx = global.x - session.startGlobal.x;
        const dy = global.y - session.startGlobal.y;
        nextTransform.x = startTransform.x + dx;
        nextTransform.y = startTransform.y + dy;
      }
      if (session.type === 'rotate') {
        const centerGlobal = mapGroup.toGlobal(new PIXI.Point(0, 0));
        const angleStart = Math.atan2(session.startGlobal.y - centerGlobal.y, session.startGlobal.x - centerGlobal.x);
        const angleCurrent = Math.atan2(global.y - centerGlobal.y, global.x - centerGlobal.x);
        const delta = radToDeg(angleCurrent - angleStart);
        let step = session.modifiers.alt ? 1 : 5;
        nextTransform.rotationDeg = normalizeAngle(startTransform.rotationDeg + Math.round(delta / step) * step);
      }
      if (session.type === 'scale') {
        const ratioX = local.x / (startLocal.x || 1);
        const ratioY = local.y / (startLocal.y || 1);
        const applyUniform = session.modifiers.shift || handleKey.length === 2;
        if (handleKey.includes('e') || handleKey.includes('w')) {
          nextTransform.scaleX = clamp(startTransform.scaleX * Math.abs(ratioX), 0.05, 20);
          if (applyUniform) {
            nextTransform.scaleY = clamp(startTransform.scaleY * Math.abs(ratioX), 0.05, 20);
          }
        }
        if (handleKey.includes('n') || handleKey.includes('s')) {
          nextTransform.scaleY = clamp(startTransform.scaleY * Math.abs(ratioY), 0.05, 20);
          if (applyUniform) {
            nextTransform.scaleX = clamp(startTransform.scaleX * Math.abs(ratioY), 0.05, 20);
          }
        }
      }
      if (session.type === 'skew') {
        const deltaX = local.x - startLocal.x;
        const deltaY = local.y - startLocal.y;
        if (handleKey === 'n' || handleKey === 's') {
          nextTransform.skewXDeg = normalizeAngle(startTransform.skewXDeg + deltaX * 0.1);
        }
        if (handleKey === 'e' || handleKey === 'w') {
          nextTransform.skewYDeg = normalizeAngle(startTransform.skewYDeg + deltaY * 0.1);
        }
      }
      setMapTransform(nextTransform);
      updateMapHandles();
    },
    [pointerToMapGroup, setMapTransform, updateMapHandles]
  );

  const endTransformSession = useCallback(() => {
    transformSessionRef.current = null;
    window.removeEventListener('pointermove', onTransformPointerMove);
    window.removeEventListener('pointerup', endTransformSession);
  }, [onTransformPointerMove]);

  const beginTokenTransform = useCallback(
    (type, handleKey, event, tokenId) => {
      const tokensLayer = tokensLayerRef.current;
      if (!tokensLayer) return;
      const sprite = tokensLayer.children.find((child) => child.mythcritTokenId === tokenId);
      if (!sprite) return;
      const token = useSceneStore.getState().scene.tokens.find((entry) => entry.id === tokenId);
      if (!token || token.locked) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const global = new PIXI.Point(x, y);
      transformSessionRef.current = {
        token: tokenId,
        type,
        handleKey,
        sprite,
        startGlobal: global,
        startRotation: sprite.rotation,
        startScale: sprite.scale.x,
        startPosition: sprite.position.clone(),
        modifiers: {
          shift: event.shiftKey,
          alt: event.altKey
        },
        tokenSnapshot: token
      };
      window.addEventListener('pointermove', onTokenTransformMove);
      window.addEventListener('pointerup', endTokenTransform);
    },
    []
  );

  const onTokenTransformMove = useCallback(
    (event) => {
      const session = transformSessionRef.current;
      if (!session?.token) return;
      const sprite = session.sprite;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const global = new PIXI.Point(event.clientX - rect.left, event.clientY - rect.top);
      if (session.type === 'move') {
        const deltaX = global.x - session.startGlobal.x;
        const deltaY = global.y - session.startGlobal.y;
        let x = session.startPosition.x + deltaX;
        let y = session.startPosition.y + deltaY;
        if (tokenSnapToGrid) {
          const mapGroup = mapGroupRef.current;
          if (mapGroup) {
            const local = mapGroup.toLocal(new PIXI.Point(x, y));
            const snapped = snapPointToGrid(local);
            const worldPoint = mapGroup.toGlobal(new PIXI.Point(snapped.x, snapped.y));
            x = worldPoint.x;
            y = worldPoint.y;
          }
        }
        sprite.position.set(x, y);
        updateToken(session.token, { x, y });
      }
      if (session.type === 'scale') {
        const center = sprite.parent.toGlobal(new PIXI.Point(sprite.position.x, sprite.position.y));
        const startDistance = Math.hypot(session.startGlobal.x - center.x, session.startGlobal.y - center.y);
        const currentDistance = Math.hypot(global.x - center.x, global.y - center.y);
        const ratio = currentDistance / (startDistance || 1);
        const uniformRatio = session.modifiers.shift ? ratio : ratio;
        const baseTextureWidth = sprite.texture.width || 1;
        const tokenSize = session.tokenSnapshot.size || 64;
        const baseScale = (tokenSize / baseTextureWidth) || 1;
        const newSpriteScale = clamp(session.startScale * uniformRatio, 0.1, 10);
        const newTokenScale = clamp(newSpriteScale / baseScale, 0.05, 10);
        sprite.scale.set(baseScale * newTokenScale);
        updateToken(session.token, { scale: newTokenScale });
      }
      if (session.type === 'rotate') {
        const center = sprite.parent.toGlobal(new PIXI.Point(sprite.position.x, sprite.position.y));
        const angleStart = Math.atan2(session.startGlobal.y - center.y, session.startGlobal.x - center.x);
        const angleCurrent = Math.atan2(global.y - center.y, global.x - center.x);
        const delta = angleCurrent - angleStart;
        let step = session.modifiers.alt ? degToRad(1) : degToRad(5);
        const snapped = Math.round(delta / step) * step;
        sprite.rotation = session.startRotation + snapped;
        updateToken(session.token, { rotationDeg: normalizeAngle(radToDeg(sprite.rotation)) });
      }
      updateTokenHandleLayout();
    },
    [snapPointToGrid, tokenSnapToGrid, updateToken, updateTokenHandleLayout]
  );

  const endTokenTransform = useCallback(() => {
    transformSessionRef.current = null;
    window.removeEventListener('pointermove', onTokenTransformMove);
    window.removeEventListener('pointerup', endTokenTransform);
  }, [onTokenTransformMove]);

  const renderMapHandles = useMemo(() => {
    if (!mapHandles || !showMapTransformHandles) return null;
    const scaleHandles = Object.entries(mapHandles.handles).filter(([key]) => key !== 'rotation');
    return (
      <div className="map-gizmo">
        {scaleHandles.map(([key, position]) => (
          <button
            key={key}
            type="button"
            className={`gizmo-handle gizmo-${key}`}
            style={{ left: position.x, top: position.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              const isSkew = event.ctrlKey;
              beginTransformSession(isSkew ? 'skew' : 'scale', key, event);
            }}
          />
        ))}
        <button
          type="button"
          className="gizmo-handle gizmo-center"
          style={{ left: mapHandles.center.x, top: mapHandles.center.y }}
          onPointerDown={(event) => {
            event.preventDefault();
            beginTransformSession('move', 'center', event);
          }}
        />
        <button
          type="button"
          className="gizmo-handle gizmo-rotation"
          style={{ left: mapHandles.handles.rotation.x, top: mapHandles.handles.rotation.y }}
          onPointerDown={(event) => {
            event.preventDefault();
            beginTransformSession('rotate', 'rotation', event);
          }}
        />
      </div>
    );
  }, [beginTransformSession, mapHandles, showMapTransformHandles]);

  const renderTokenHandles = useMemo(() => {
    if (!tokenHandles || !selectedTokenId) return null;
    const token = useSceneStore.getState().scene.tokens.find((entry) => entry.id === selectedTokenId);
    if (token?.locked) return null;
    return (
      <div className="token-gizmo">
        {Object.entries(tokenHandles.handles)
          .filter(([key]) => key !== 'rotation')
          .map(([key, position]) => (
            <button
              key={key}
              type="button"
              className={`token-handle token-${key}`}
              style={{ left: position.x, top: position.y }}
              onPointerDown={(event) => {
                event.preventDefault();
                beginTokenTransform('scale', key, event, selectedTokenId);
              }}
            />
          ))}
        <button
          type="button"
          className="token-handle token-center"
          style={{ left: tokenHandles.center.x, top: tokenHandles.center.y }}
          onPointerDown={(event) => {
            event.preventDefault();
            beginTokenTransform('move', 'center', event, selectedTokenId);
          }}
        />
        <button
          type="button"
          className="token-handle token-rotation"
          style={{ left: tokenHandles.handles.rotation.x, top: tokenHandles.handles.rotation.y }}
          onPointerDown={(event) => {
            event.preventDefault();
            beginTokenTransform('rotate', 'rotation', event, selectedTokenId);
          }}
        />
      </div>
    );
  }, [beginTokenTransform, selectedTokenId, tokenHandles]);

  return (
    <div ref={containerRef} className="map-canvas">
      <div ref={overlayRef} className="map-overlay">
        {downscaleInfo?.downscaled && (
          <div className="toast warning">
            Карта автоматически уменьшена до {downscaleInfo.finalWidth}×{downscaleInfo.finalHeight}px (MAX {downscaleInfo.originalWidth}×{downscaleInfo.originalHeight}px)
          </div>
        )}
        {renderMapHandles}
        {renderTokenHandles}
        {calibrationPromptVisible && (
          <div className="calibration-modal">
            <div className="calibration-card">
              <h4>Калибровка сетки</h4>
              <p>Введите количество клеток между выбранными точками.</p>
              <input
                type="number"
                value={calibrationInput}
                min={1}
                step={0.1}
                onChange={(event) => setCalibrationInput(event.target.value)}
              />
              <div className="calibration-actions">
                <button className="btn" onClick={handleCalibrationConfirm}>
                  Применить
                </button>
                <button className="btn btn-secondary" onClick={handleCalibrationCancel}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapCanvas;

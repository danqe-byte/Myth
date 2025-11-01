import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useSceneStore } from '../store/useSceneStore.js';
import { useUIStore } from '../store/useUIStore.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MapCanvas = () => {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const mapSpriteRef = useRef(null);
  const gridGraphicsRef = useRef(null);
  const fogGraphicsRef = useRef(null);
  const tokensRef = useRef(new Map());
  const draggingTokenRef = useRef(null);
  const pointerDataRef = useRef({ dragging: false, last: null, button: null });
  const spacePressedRef = useRef(false);

  const scene = useSceneStore((state) => state.scene);
  const sceneRef = useRef(scene);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const refreshMapTransform = () => {
    const app = appRef.current;
    const currentScene = sceneRef.current;
    if (!app || !currentScene) return;
    const mapContainer = app.stage.getChildByName('mapContainer');
    const overlayContainer = app.stage.getChildByName('overlayContainer');
    const sprite = mapSpriteRef.current;
    if (!mapContainer || !overlayContainer || !sprite) return;
    const { fitMode, mapScale, zoom, pan } = currentScene;
    const { width, height } = app.renderer.screen;
    const originalWidth = sprite.texture.width || 1;
    const originalHeight = sprite.texture.height || 1;
    const scaleX = width / originalWidth;
    const scaleY = height / originalHeight;
    sprite.width = originalWidth;
    sprite.height = originalHeight;
    let baseScale = 1;
    if (fitMode === 'contain') {
      baseScale = Math.min(scaleX, scaleY);
    } else if (fitMode === 'cover') {
      baseScale = Math.max(scaleX, scaleY);
    } else if (fitMode === 'stretch') {
      sprite.width = width;
      sprite.height = height;
      baseScale = 1;
    }
    sprite.scale.set(baseScale);
    const zoomScale = zoom * mapScale;
    mapContainer.scale.set(zoomScale);
    overlayContainer.scale.set(zoomScale);
    mapContainer.position.set(pan.x, pan.y);
    overlayContainer.position.set(pan.x, pan.y);
  };

  const setPanZoom = useSceneStore((state) => state.setPanZoom);
  const updateToken = useSceneStore((state) => state.updateToken);
  const addToken = useSceneStore((state) => state.addToken);

  const rulerActive = useUIStore((state) => state.rulerActive);


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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || appRef.current) return;

    const app = new PIXI.Application({
      resizeTo: container,
      background: '#0c0c0f',
      antialias: true
    });
    appRef.current = app;
    container.appendChild(app.view);

    const mapContainer = new PIXI.Container();
    mapContainer.name = 'mapContainer';
    const overlayContainer = new PIXI.Container();
    overlayContainer.name = 'overlayContainer';
    app.stage.addChild(mapContainer);
    app.stage.addChild(overlayContainer);

    // Grid
    const gridGraphics = new PIXI.Graphics();
    gridGraphicsRef.current = gridGraphics;
    overlayContainer.addChild(gridGraphics);

    // Fog layer
    const fogGraphics = new PIXI.Graphics();
    fogGraphicsRef.current = fogGraphics;
    overlayContainer.addChild(fogGraphics);

    // Tokens container
    const tokensContainer = new PIXI.Container();
    tokensContainer.name = 'tokensContainer';
    overlayContainer.addChild(tokensContainer);

    // Interaction handlers
    const onPointerDown = (event) => {
      pointerDataRef.current = {
        dragging: true,
        last: { x: event.data.global.x, y: event.data.global.y },
        button: event.data.button
      };
    };

    const onPointerUp = () => {
      pointerDataRef.current.dragging = false;
      pointerDataRef.current.button = null;
    };

    const onPointerMove = (event) => {
      const pointer = pointerDataRef.current;
      if (!pointer.dragging || !pointer.last) return;
      const currentScene = sceneRef.current;
      const isPanButton = pointer.button === 2 || (pointer.button === 0 && spacePressedRef.current);
      if (draggingTokenRef.current && pointer.button === 0 && !spacePressedRef.current) {
        const { tokenId, sprite } = draggingTokenRef.current;
        const localPosition = sprite.parent.toLocal(event.data.global);
        sprite.position.copyFrom(localPosition);
        updateToken(tokenId, { x: sprite.x, y: sprite.y });
        return;
      }
      if (isPanButton) {
        const dx = event.data.global.x - pointer.last.x;
        const dy = event.data.global.y - pointer.last.y;
        const newPan = {
          x: currentScene.pan.x + dx,
          y: currentScene.pan.y + dy
        };
        mapContainer.position.set(newPan.x, newPan.y);
        overlayContainer.position.set(newPan.x, newPan.y);
        setPanZoom({ pan: newPan });
        pointer.last = { x: event.data.global.x, y: event.data.global.y };
      }
    };

    app.stage.interactive = true;
    app.stage.hitArea = app.screen;
    app.stage.on('pointerdown', onPointerDown);
    app.stage.on('pointerup', onPointerUp);
    app.stage.on('pointerupoutside', onPointerUp);
    app.stage.on('pointermove', onPointerMove);

    const onWheel = (event) => {
      event.preventDefault();
      const { deltaY } = event;
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const currentScene = sceneRef.current;
      const newZoom = clamp(currentScene.zoom * zoomFactor, 0.2, 4);
      const mapScale = currentScene.mapScale;
      mapContainer.scale.set(newZoom * mapScale);
      overlayContainer.scale.set(newZoom * mapScale);
      setPanZoom({ zoom: newZoom });
    };

    container.addEventListener('wheel', onWheel, { passive: false });

    const onContextMenu = (event) => event.preventDefault();
    container.addEventListener('contextmenu', onContextMenu);

    const onResize = () => {
      app.renderer.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const handleDrop = (event) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files || []);
      const images = files.filter((file) => file.type.startsWith('image/'));
      if (!images.length) return;
      images.forEach((image) => {
        const reader = new FileReader();
        reader.onload = () => {
          const currentScene = sceneRef.current;
          addToken({
            name: image.name.replace(/\.[^.]+$/, ''),
            image: reader.result,
            size: currentScene.grid.size,
            visible: true,
            x: 0,
            y: 0
          });
        };
        reader.readAsDataURL(image);
      });
    };

    const handleDragOver = (event) => {
      event.preventDefault();
    };

    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragover', handleDragOver);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('resize', onResize);
      app.stage.off('pointerdown', onPointerDown);
      app.stage.off('pointerup', onPointerUp);
      app.stage.off('pointerupoutside', onPointerUp);
      app.stage.off('pointermove', onPointerMove);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, [addToken, setPanZoom, updateToken]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const mapContainer = app.stage.getChildByName('mapContainer');
    if (!mapContainer) return;

    const loadTexture = async () => {
      if (mapSpriteRef.current) {
        mapContainer.removeChild(mapSpriteRef.current);
        mapSpriteRef.current.destroy(true);
        mapSpriteRef.current = null;
      }
      try {
        const texture = await PIXI.Assets.load(scene.mapUrl);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.position.set(0, 0);
        mapContainer.addChild(sprite);
        mapSpriteRef.current = sprite;
        refreshMapTransform();
      } catch (error) {
        console.error('Failed to load map texture', error);
      }
    };

    loadTexture();
  }, [scene.mapUrl]);

  useEffect(() => {
    refreshMapTransform();
    const onResize = () => refreshMapTransform();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [scene.fitMode, scene.mapScale, scene.zoom, scene.pan.x, scene.pan.y]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const gridGraphics = gridGraphicsRef.current;
    if (!gridGraphics) return;

    gridGraphics.clear();
    if (!scene.grid.enabled) return;

    const gridSize = scene.grid.size;
    const { width, height } = app.renderer.screen;
    gridGraphics.lineStyle(1, PIXI.utils.string2hex(scene.grid.color), scene.grid.opacity);
    const maxDimension = Math.max(width, height) * 2;
    for (let x = -maxDimension; x <= maxDimension; x += gridSize) {
      gridGraphics.moveTo(x, -maxDimension);
      gridGraphics.lineTo(x, maxDimension);
    }
    for (let y = -maxDimension; y <= maxDimension; y += gridSize) {
      gridGraphics.moveTo(-maxDimension, y);
      gridGraphics.lineTo(maxDimension, y);
    }
  }, [scene.grid.enabled, scene.grid.size, scene.grid.color, scene.grid.opacity]);

  useEffect(() => {
    const fogGraphics = fogGraphicsRef.current;
    if (!fogGraphics) return;
    fogGraphics.clear();
    if (scene.fog.enabled) {
      fogGraphics.beginFill(0x000000, clamp(scene.fog.opacity, 0, 1));
      fogGraphics.drawRect(-2000, -2000, 4000, 4000);
      fogGraphics.endFill();
    }
  }, [scene.fog.enabled, scene.fog.opacity]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const overlayContainer = app.stage.getChildByName('overlayContainer');
    if (!overlayContainer) return;
    const tokensContainer = overlayContainer.getChildByName('tokensContainer');
    if (!tokensContainer) return;

    // Remove sprites not in tokens list
    tokensRef.current.forEach((sprite, id) => {
      if (!scene.tokens.find((token) => token.id === id)) {
        tokensContainer.removeChild(sprite);
        sprite.destroy(true);
        tokensRef.current.delete(id);
      }
    });

    scene.tokens.forEach((token) => {
      let sprite = tokensRef.current.get(token.id);
      if (!sprite) {
        sprite = PIXI.Sprite.from(token.image || '/icons/token-default.png');
        sprite.anchor.set(0.5);
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.cursor = 'grab';
        sprite.on('pointerdown', (event) => {
          draggingTokenRef.current = { tokenId: token.id, sprite };
          pointerDataRef.current.button = event.data.button;
          sprite.alpha = 0.8;
        });
        sprite.on('pointerup', () => {
          if (draggingTokenRef.current?.sprite === sprite) {
            sprite.alpha = 1;
            draggingTokenRef.current = null;
          }
        });
        sprite.on('pointerupoutside', () => {
          if (draggingTokenRef.current?.sprite === sprite) {
            sprite.alpha = 1;
            draggingTokenRef.current = null;
          }
        });
        tokensContainer.addChild(sprite);
        tokensRef.current.set(token.id, sprite);
      }
      sprite.visible = token.visible !== false;
      sprite.scale.set((token.scale || 1) * (token.size ? token.size / 64 : 1));
      sprite.position.set(token.x || 0, token.y || 0);
    });
  }, [scene.tokens]);

  useEffect(() => {
    const handleDragEnd = () => {
      if (draggingTokenRef.current) {
        draggingTokenRef.current.sprite.alpha = 1;
        draggingTokenRef.current = null;
      }
    };
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);

  useEffect(() => {
    if (!rulerActive) return;
    const app = appRef.current;
    if (!app) return;
    const overlayContainer = app.stage.getChildByName('overlayContainer');
    if (!overlayContainer) return;
    const rulerGraphics = new PIXI.Graphics();
    overlayContainer.addChild(rulerGraphics);
    const rulerText = new PIXI.Text('', {
      fill: '#e5e7eb',
      fontFamily: 'Inter',
      fontSize: 14,
      stroke: '#0c0c0f',
      strokeThickness: 3
    });
    overlayContainer.addChild(rulerText);

    let startPoint = null;

    const onDown = (event) => {
      startPoint = overlayContainer.toLocal(event.data.global);
    };
    const onMove = (event) => {
      if (!startPoint) return;
      const current = overlayContainer.toLocal(event.data.global);
      rulerGraphics.clear();
      rulerGraphics.lineStyle(2, 0xc9a227, 1);
      rulerGraphics.moveTo(startPoint.x, startPoint.y);
      rulerGraphics.lineTo(current.x, current.y);
      const dx = current.x - startPoint.x;
      const dy = current.y - startPoint.y;
      const distancePixels = Math.sqrt(dx * dx + dy * dy);
      const cells = distancePixels / scene.grid.size;
      const units = cells * scene.units.unitsPerGrid;
      rulerText.text = `${cells.toFixed(1)} клеток / ${units.toFixed(1)} ${scene.units.label}`;
      rulerText.position.set(current.x + 12, current.y + 12);
    };
    const onUp = () => {
      startPoint = null;
      rulerGraphics.clear();
      rulerText.text = '';
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
      overlayContainer.removeChild(rulerGraphics);
      overlayContainer.removeChild(rulerText);
      rulerGraphics.destroy();
      rulerText.destroy();
    };
  }, [rulerActive, scene.grid.size, scene.units.label, scene.units.unitsPerGrid]);

  return <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }} />;
};

export default MapCanvas;

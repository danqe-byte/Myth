import * as PIXI from 'pixi.js';

export const getMaxTextureSize = (renderer) => {
  try {
    const gl = renderer?.gl || renderer?.context?.gl;
    if (gl && typeof gl.getParameter === 'function') {
      const value = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  } catch (error) {
    console.warn('Unable to read MAX_TEXTURE_SIZE', error);
  }
  return 4096;
};

const createBitmapFromBlob = async (blob) => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob);
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (event) => reject(event?.error || new Error('Failed to decode image'));
    image.src = URL.createObjectURL(blob);
  });
};

const createBitmapFromCanvas = async (canvas) => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(canvas);
  }
  return canvas;
};

export const loadSafeTexture = async (url, renderer, { maxSideHint = 8192 } = {}) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${url}`);
    }
    const blob = await response.blob();
    let bitmap = await createBitmapFromBlob(blob);
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;
    const maxTextureSize = Math.min(getMaxTextureSize(renderer), maxSideHint);
    let downscaled = false;

    if (originalWidth > maxTextureSize || originalHeight > maxTextureSize) {
      downscaled = true;
      const scale = Math.min(maxTextureSize / originalWidth, maxTextureSize / originalHeight);
      const targetWidth = Math.max(1, Math.floor(originalWidth * scale));
      const targetHeight = Math.max(1, Math.floor(originalHeight * scale));
      const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(targetWidth, targetHeight)
        : (() => {
            const element = document.createElement('canvas');
            element.width = targetWidth;
            element.height = targetHeight;
            return element;
          })();
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      bitmap = await createBitmapFromCanvas(canvas);
    }

    const texture = PIXI.Texture.from(bitmap);
    texture.mythcritMeta = {
      downscaled,
      originalWidth,
      originalHeight,
      finalWidth: bitmap.width,
      finalHeight: bitmap.height
    };
    return texture;
  } catch (error) {
    console.error('Safe texture load failed for', url, error);
    throw error;
  }
};

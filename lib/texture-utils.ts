import * as THREE from "three"

const textureLoader = new THREE.TextureLoader()
const textureCache = new Map<string, THREE.Texture>()

/**
 * Load a texture from a URL (object URL or path), with caching.
 * Uses nearest-neighbor filtering for pixel art.
 */
export function loadTilesetTexture(imageUrl: string): THREE.Texture {
  const cached = textureCache.get(imageUrl)
  if (cached) return cached

  const texture = textureLoader.load(imageUrl)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false

  textureCache.set(imageUrl, texture)
  return texture
}

/**
 * Dispose a cached texture and free GPU memory.
 */
export function disposeTilesetTexture(imageUrl: string): void {
  const texture = textureCache.get(imageUrl)
  if (texture) {
    texture.dispose()
    textureCache.delete(imageUrl)
  }
}

/**
 * Create an object URL from a File for use as a tileset image source.
 */
export function createImageUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Get tileset dimensions (columns/rows) from an image and tile size.
 */
export async function getTilesetDimensions(
  imageUrl: string,
  tileWidth: number,
  tileHeight: number,
): Promise<{ columns: number; rows: number; imageWidth: number; imageHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        columns: Math.floor(img.width / tileWidth),
        rows: Math.floor(img.height / tileHeight),
        imageWidth: img.width,
        imageHeight: img.height,
      })
    }
    img.onerror = reject
    img.src = imageUrl
  })
}

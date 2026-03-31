import * as THREE from "three"
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js"
import type { SceneObject, Tileset } from "@/lib/types"
import { buildGeometryFromFaces } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"

export interface GltfExportOptions {
  binary: boolean
  scaleFactor: number
  embedTextures: boolean
}

/**
 * Build a Three.js scene from store data for export.
 */
function buildExportScene(
  objects: Record<string, SceneObject>,
  tilesets: Record<string, Tileset>,
  scaleFactor: number,
): THREE.Scene {
  const scene = new THREE.Scene()
  scene.name = "webtile-scene"

  // Cache materials by tileset id
  const materialCache = new Map<string, THREE.MeshStandardMaterial>()

  function getMaterial(tilesetId: string | null): THREE.MeshStandardMaterial {
    if (!tilesetId) {
      return new THREE.MeshStandardMaterial({ color: 0xcccccc })
    }
    const cached = materialCache.get(tilesetId)
    if (cached) return cached

    const tileset = tilesets[tilesetId]
    if (!tileset) {
      return new THREE.MeshStandardMaterial({ color: 0xcccccc })
    }

    const texture = loadTilesetTexture(tileset.imageUrl)
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
    })
    mat.name = tileset.name
    materialCache.set(tilesetId, mat)
    return mat
  }

  for (const obj of Object.values(objects)) {
    if (obj.faces.length === 0) continue

    // Group faces by tileset for multi-material support
    const facesByTileset = new Map<string, typeof obj.faces>()
    for (const face of obj.faces) {
      const key = face.tileRef?.tilesetId ?? "__none__"
      const group = facesByTileset.get(key) ?? []
      group.push(face)
      facesByTileset.set(key, group)
    }

    const group = new THREE.Group()
    group.name = obj.name

    for (const [tilesetId, faces] of facesByTileset) {
      const geometry = buildGeometryFromFaces(faces)

      // Apply scale factor to positions
      if (scaleFactor !== 1) {
        const positions = geometry.getAttribute("position")
        for (let i = 0; i < positions.count; i++) {
          positions.setXYZ(
            i,
            positions.getX(i) * scaleFactor,
            positions.getY(i) * scaleFactor,
            positions.getZ(i) * scaleFactor,
          )
        }
        positions.needsUpdate = true
      }

      const realId = tilesetId === "__none__" ? null : tilesetId
      const material = getMaterial(realId)
      const mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)
    }

    group.position.set(
      obj.position[0] * scaleFactor,
      obj.position[1] * scaleFactor,
      obj.position[2] * scaleFactor,
    )
    group.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2])
    group.scale.set(obj.scale[0], obj.scale[1], obj.scale[2])

    scene.add(group)
  }

  return scene
}

/**
 * Export scene data as glTF/GLB.
 * Returns a Blob ready for download.
 */
export async function exportGltf(
  objects: Record<string, SceneObject>,
  tilesets: Record<string, Tileset>,
  options: GltfExportOptions,
): Promise<Blob> {
  const scene = buildExportScene(objects, tilesets, options.scaleFactor)
  const exporter = new GLTFExporter()

  const result = await exporter.parseAsync(scene, {
    binary: options.binary,
    embedImages: options.embedTextures,
  })

  if (result instanceof ArrayBuffer) {
    return new Blob([result], { type: "model/gltf-binary" })
  }
  const json = JSON.stringify(result, null, 2)
  return new Blob([json], { type: "model/gltf+json" })
}

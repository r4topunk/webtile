import * as THREE from "three"
import { OBJExporter } from "three/addons/exporters/OBJExporter.js"
import type { SceneObject, Tileset } from "@/lib/types"
import { buildGeometryFromFaces } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"

export interface ObjExportOptions {
  scaleFactor: number
}

/**
 * Generate .mtl file content for the scene.
 */
function buildMtlContent(
  tilesets: Record<string, Tileset>,
  usedTilesetIds: Set<string>,
): string {
  const lines: string[] = ["# Webtile MTL Export", ""]

  // Default material for faces without tileset
  lines.push("newmtl default")
  lines.push("Kd 0.8 0.8 0.8")
  lines.push("Ka 0.2 0.2 0.2")
  lines.push("Ks 0.0 0.0 0.0")
  lines.push("d 1.0")
  lines.push("")

  for (const id of usedTilesetIds) {
    const tileset = tilesets[id]
    if (!tileset) continue

    const safeName = tileset.name.replace(/\s+/g, "_")
    lines.push(`newmtl ${safeName}`)
    lines.push("Kd 1.0 1.0 1.0")
    lines.push("Ka 0.2 0.2 0.2")
    lines.push("Ks 0.0 0.0 0.0")
    lines.push("d 1.0")
    lines.push(`map_Kd ${safeName}.png`)
    lines.push("")
  }

  return lines.join("\n")
}

/**
 * Build a Three.js scene from store data for OBJ export.
 * Assigns material names so the OBJ exporter can reference them.
 */
function buildExportScene(
  objects: Record<string, SceneObject>,
  tilesets: Record<string, Tileset>,
  scaleFactor: number,
): { scene: THREE.Scene; usedTilesetIds: Set<string> } {
  const scene = new THREE.Scene()
  const usedTilesetIds = new Set<string>()
  const materialCache = new Map<string, THREE.MeshStandardMaterial>()

  function getMaterial(tilesetId: string | null): THREE.MeshStandardMaterial {
    if (!tilesetId) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc })
      mat.name = "default"
      return mat
    }

    const cached = materialCache.get(tilesetId)
    if (cached) return cached

    const tileset = tilesets[tilesetId]
    if (!tileset) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc })
      mat.name = "default"
      return mat
    }

    usedTilesetIds.add(tilesetId)
    const texture = loadTilesetTexture(tileset.imageUrl)
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
    })
    mat.name = tileset.name.replace(/\s+/g, "_")
    materialCache.set(tilesetId, mat)
    return mat
  }

  for (const obj of Object.values(objects)) {
    if (obj.faces.length === 0) continue

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
      mesh.name = obj.name
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

  return { scene, usedTilesetIds }
}

/**
 * Export scene as OBJ + MTL.
 * Returns both file contents.
 */
export function exportObj(
  objects: Record<string, SceneObject>,
  tilesets: Record<string, Tileset>,
  options: ObjExportOptions,
): { obj: Blob; mtl: Blob } {
  const { scene, usedTilesetIds } = buildExportScene(
    objects,
    tilesets,
    options.scaleFactor,
  )

  const exporter = new OBJExporter()
  const objContent = exporter.parse(scene)
  const mtlContent = buildMtlContent(tilesets, usedTilesetIds)

  return {
    obj: new Blob([objContent], { type: "text/plain" }),
    mtl: new Blob([mtlContent], { type: "text/plain" }),
  }
}

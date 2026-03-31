import * as THREE from "three"
import { OBJLoader } from "three/addons/loaders/OBJLoader.js"
import type { SceneFace, SceneObject, Vec3 } from "@/lib/types"

type Vec2 = [number, number]

/**
 * Convert indexed triangle geometry into quad SceneFaces.
 * Pairs consecutive triangles into quads when they share an edge.
 * Falls back to degenerate quads (repeated vertex) for unpaired triangles.
 */
function geometryToFaces(geometry: THREE.BufferGeometry): SceneFace[] {
  const faces: SceneFace[] = []
  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute
  const uvAttr = geometry.getAttribute("uv") as THREE.BufferAttribute | null
  const index = geometry.getIndex()

  if (!posAttr) return faces

  const getPos = (idx: number): Vec3 => [
    posAttr.getX(idx),
    posAttr.getY(idx),
    posAttr.getZ(idx),
  ]
  const getUV = (idx: number): Vec2 => {
    if (!uvAttr) return [0, 0]
    return [uvAttr.getX(idx), uvAttr.getY(idx)]
  }

  if (index) {
    const indices = Array.from(index.array)
    // Process triangles in pairs
    for (let i = 0; i < indices.length; i += 6) {
      if (i + 5 < indices.length) {
        // Try to form a quad from 2 triangles
        // Triangle 1: i0, i1, i2
        // Triangle 2: i3, i4, i5
        const i0 = indices[i]
        const i1 = indices[i + 1]
        const i2 = indices[i + 2]
        const i3 = indices[i + 3]
        const i4 = indices[i + 4]
        const i5 = indices[i + 5]

        // Check if they share vertices (typical quad: 0-1-2, 0-2-3)
        if (i3 === i0 && i4 === i2) {
          faces.push({
            id: crypto.randomUUID(),
            vertices: [getPos(i0), getPos(i1), getPos(i2), getPos(i5)],
            tileRef: null,
            uvs: [getUV(i0), getUV(i1), getUV(i2), getUV(i5)],
          })
        } else {
          // Can't pair — make two degenerate quads
          faces.push({
            id: crypto.randomUUID(),
            vertices: [getPos(i0), getPos(i1), getPos(i2), getPos(i2)],
            tileRef: null,
            uvs: [getUV(i0), getUV(i1), getUV(i2), getUV(i2)],
          })
          faces.push({
            id: crypto.randomUUID(),
            vertices: [getPos(i3), getPos(i4), getPos(i5), getPos(i5)],
            tileRef: null,
            uvs: [getUV(i3), getUV(i4), getUV(i5), getUV(i5)],
          })
        }
      } else {
        // Remaining unpaired triangles
        for (let j = i; j + 2 < indices.length; j += 3) {
          const a = indices[j]
          const b = indices[j + 1]
          const c = indices[j + 2]
          faces.push({
            id: crypto.randomUUID(),
            vertices: [getPos(a), getPos(b), getPos(c), getPos(c)],
            tileRef: null,
            uvs: [getUV(a), getUV(b), getUV(c), getUV(c)],
          })
        }
      }
    }
  } else {
    // Non-indexed: every 3 vertices is a triangle
    const count = posAttr.count
    for (let i = 0; i < count; i += 6) {
      if (i + 5 < count) {
        faces.push({
          id: crypto.randomUUID(),
          vertices: [getPos(i), getPos(i + 1), getPos(i + 2), getPos(i + 5)],
          tileRef: null,
          uvs: [getUV(i), getUV(i + 1), getUV(i + 2), getUV(i + 5)],
        })
      } else {
        for (let j = i; j + 2 < count; j += 3) {
          faces.push({
            id: crypto.randomUUID(),
            vertices: [getPos(j), getPos(j + 1), getPos(j + 2), getPos(j + 2)],
            tileRef: null,
            uvs: [getUV(j), getUV(j + 1), getUV(j + 2), getUV(j + 2)],
          })
        }
      }
    }
  }

  return faces
}

/**
 * Parse an OBJ file string into SceneObjects.
 */
export function importObj(objText: string): SceneObject[] {
  const loader = new OBJLoader()
  const group = loader.parse(objText)

  const objects: SceneObject[] = []
  let counter = 0

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const geometry = child.geometry as THREE.BufferGeometry
    const faces = geometryToFaces(geometry)
    if (faces.length === 0) return

    counter++
    const worldPos = new THREE.Vector3()
    child.getWorldPosition(worldPos)

    const obj: SceneObject = {
      id: crypto.randomUUID(),
      name: child.name || `Imported ${counter}`,
      parentId: null,
      position: [worldPos.x, worldPos.y, worldPos.z],
      rotation: [child.rotation.x, child.rotation.y, child.rotation.z],
      scale: [child.scale.x, child.scale.y, child.scale.z],
      faces,
      visible: true,
      locked: false,
    }
    objects.push(obj)
  })

  return objects
}

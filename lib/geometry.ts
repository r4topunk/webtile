import * as THREE from "three"
import type { PlacementPlane, SceneFace } from "./types"

type Vec2 = [number, number]

/**
 * Build a BufferGeometry from an array of quad faces.
 * Each face = 4 vertices -> 2 triangles (6 indices).
 */
export function buildGeometryFromFaces(faces: SceneFace[]): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i]
    const baseIndex = i * 4

    for (let v = 0; v < 4; v++) {
      positions.push(...face.vertices[v])
      uvs.push(...face.uvs[v])
    }

    // 2 triangles: 0-1-2 and 0-2-3
    indices.push(
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex,
      baseIndex + 2,
      baseIndex + 3,
    )
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

/**
 * Create a single tile quad face on the specified plane at a given grid position.
 *
 * XZ plane: y = offset, vertices span X and Z, normals +Y
 * XY plane: z = offset, vertices span X and Y, normals +Z
 * YZ plane: x = offset, vertices span Y and Z, normals +X
 */
export function createTileFace(
  gridA: number,
  gridB: number,
  tileRef: SceneFace["tileRef"],
  tilesetColumns: number,
  tilesetRows: number,
  plane: PlacementPlane = "xz",
  offset: number = 0,
): SceneFace {
  const uvs = computeTileUVs(tileRef, tilesetColumns, tilesetRows)

  let vertices: SceneFace["vertices"]

  switch (plane) {
    case "xz":
      // y = offset, span X (gridA) and Z (gridB)
      // Normals point +Y (CCW from above)
      vertices = [
        [gridA, offset, gridB],           // v0: bottom-left
        [gridA, offset, gridB + 1],       // v1: top-left
        [gridA + 1, offset, gridB + 1],   // v2: top-right
        [gridA + 1, offset, gridB],       // v3: bottom-right
      ]
      break
    case "xy":
      // z = offset, span X (gridA) and Y (gridB)
      // Normals point +Z (CCW from front)
      vertices = [
        [gridA, gridB, offset],           // v0: bottom-left
        [gridA, gridB + 1, offset],       // v1: top-left
        [gridA + 1, gridB + 1, offset],   // v2: top-right
        [gridA + 1, gridB, offset],       // v3: bottom-right
      ]
      break
    case "yz":
      // x = offset, span Y (gridA) and Z (gridB)
      // Normals point +X (CCW from right)
      vertices = [
        [offset, gridA, gridB],           // v0: bottom-left
        [offset, gridA + 1, gridB],       // v1: top-left
        [offset, gridA + 1, gridB + 1],   // v2: top-right
        [offset, gridA, gridB + 1],       // v3: bottom-right
      ]
      break
  }

  return {
    id: crypto.randomUUID(),
    vertices,
    tileRef,
    uvs,
  }
}

/**
 * Compute UV coordinates for a tile within a tileset atlas.
 * Returns UVs matching the CCW vertex order from createTileFace:
 *   v0 (bottom-left), v1 (top-left), v2 (top-right), v3 (bottom-right)
 */
export function computeTileUVs(
  tileRef: SceneFace["tileRef"],
  columns: number,
  rows: number,
): [Vec2, Vec2, Vec2, Vec2] {
  if (!tileRef || columns === 0 || rows === 0) {
    return [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ]
  }

  const u0 = tileRef.x / columns
  const u1 = (tileRef.x + tileRef.w) / columns
  // In UV space: v=0 is bottom of texture, v=1 is top
  // In image: row 0 is top, so tile at row y maps to v = 1 - y/rows
  const v0 = 1 - (tileRef.y + tileRef.h) / rows // bottom of tile in UV
  const v1 = 1 - tileRef.y / rows                 // top of tile in UV

  return [
    [u0, v0], // v0: bottom-left
    [u0, v1], // v1: top-left
    [u1, v1], // v2: top-right
    [u1, v0], // v3: bottom-right
  ]
}

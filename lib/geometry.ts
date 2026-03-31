import * as THREE from "three"
import type { SceneFace } from "./types"

type Vec2 = [number, number]

/**
 * Build a BufferGeometry from an array of quad faces.
 * Each face = 4 vertices → 2 triangles (6 indices).
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
 * Create a single tile quad face on the XZ plane at a given grid position.
 * Vertex winding is counter-clockwise from above → normals point UP (+Y).
 *
 * Vertex order (viewed from above):
 *   v3 (x,z+1) --- v2 (x+1,z+1)
 *       |               |
 *   v0 (x,z)   --- v1 (x+1,z)
 *
 * Winding: v0 → v3 → v2 → v1 (CCW from +Y) — but we use index order
 * to control winding. Vertices stored as v0,v1,v2,v3 with indices
 * that produce CCW triangles from above.
 */
export function createTileFace(
  gridX: number,
  gridZ: number,
  tileRef: SceneFace["tileRef"],
  tilesetColumns: number,
  tilesetRows: number,
): SceneFace {
  const y = 0

  // Vertices in CCW order from above for upward normals
  // v0: bottom-left, v1: top-left, v2: top-right, v3: bottom-right
  return {
    id: crypto.randomUUID(),
    vertices: [
      [gridX, y, gridZ],           // v0: bottom-left
      [gridX, y, gridZ + 1],       // v1: top-left
      [gridX + 1, y, gridZ + 1],   // v2: top-right
      [gridX + 1, y, gridZ],       // v3: bottom-right
    ],
    tileRef,
    uvs: computeTileUVs(tileRef, tilesetColumns, tilesetRows),
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

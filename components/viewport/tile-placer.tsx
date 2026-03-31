"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"
import { createTileFace } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"

const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _intersect = new THREE.Vector3()

/**
 * PlaneGeometry vertex order (1x1, 1 segment):
 *   v0 (TL) --- v1 (TR)
 *       |           |
 *   v2 (BL) --- v3 (BR)
 */
function makeGhostGeometry(uvs: Float32Array): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(1, 1)
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  return geo
}

export function TilePlacer() {
  const tool = useEditorStore((s) => s.tool)
  const selectedTile = useTilesetStore((s) => s.selectedTile)
  const tilesets = useTilesetStore((s) => s.tilesets)
  const placeNewTile = useSceneStore((s) => s.placeNewTile)

  const [ghostPos, setGhostPos] = useState<[number, number] | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, raycaster, pointer } = useThree()

  function getGridPosition(): [number, number] | null {
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.ray.intersectPlane(floorPlane, _intersect)
    if (!hit) return null
    return [Math.floor(hit.x), Math.floor(hit.z)]
  }

  function handlePointerMove() {
    if (tool !== "place" || !selectedTile) {
      setGhostPos(null)
      return
    }
    setGhostPos(getGridPosition())
  }

  function handleClick() {
    if (tool !== "place" || !selectedTile) return
    const pos = getGridPosition()
    if (!pos) return

    const tileset = tilesets[selectedTile.tilesetId]
    if (!tileset) return

    const face = createTileFace(
      pos[0],
      pos[1],
      selectedTile,
      tileset.columns,
      tileset.rows,
    )
    placeNewTile(face)
  }

  // Ghost preview texture
  const ghostTexture = useMemo(() => {
    if (!selectedTile) return null
    const tileset = tilesets[selectedTile.tilesetId]
    if (!tileset) return null
    return loadTilesetTexture(tileset.imageUrl)
  }, [selectedTile, tilesets])

  // Ghost geometry with UVs matching PlaneGeometry vertex order: TL, TR, BL, BR
  const ghostGeometry = useMemo(() => {
    if (!selectedTile) return null
    const tileset = tilesets[selectedTile.tilesetId]
    if (!tileset) return null
    const { columns, rows } = tileset
    const u0 = selectedTile.x / columns
    const u1 = (selectedTile.x + selectedTile.w) / columns
    const v0 = 1 - (selectedTile.y + selectedTile.h) / rows
    const v1 = 1 - selectedTile.y / rows

    // PlaneGeometry vertices: TL(0), TR(1), BL(2), BR(3)
    return makeGhostGeometry(
      new Float32Array([
        u0, v1, // TL
        u1, v1, // TR
        u0, v0, // BL
        u1, v0, // BR
      ]),
    )
  }, [selectedTile, tilesets])

  // Dispose old ghost geometry
  useEffect(() => {
    return () => {
      ghostGeometry?.dispose()
    }
  }, [ghostGeometry])

  return (
    <>
      {/* Transparent floor for raycasting — must be visible for R3F events */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.002, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Ghost preview */}
      {ghostPos && ghostTexture && ghostGeometry && (
        <mesh
          ref={meshRef}
          geometry={ghostGeometry}
          position={[ghostPos[0] + 0.5, 0.001, ghostPos[1] + 0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            map={ghostTexture}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  )
}

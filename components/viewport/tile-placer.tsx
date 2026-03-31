"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"
import { createTileFace } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"
import type { PlacementPlane } from "@/lib/types"

/**
 * Build a THREE.Plane for the given placement plane + offset.
 */
function buildPlane(plane: PlacementPlane, offset: number): THREE.Plane {
  switch (plane) {
    case "xz":
      // normal +Y, d = -offset (plane at y=offset)
      return new THREE.Plane(new THREE.Vector3(0, 1, 0), -offset)
    case "xy":
      // normal +Z, d = -offset (plane at z=offset)
      return new THREE.Plane(new THREE.Vector3(0, 0, 1), -offset)
    case "yz":
      // normal +X, d = -offset (plane at x=offset)
      return new THREE.Plane(new THREE.Vector3(1, 0, 0), -offset)
  }
}

/**
 * Extract two grid coords from a 3D intersection point based on the plane.
 */
function toGridCoords(
  hit: THREE.Vector3,
  plane: PlacementPlane,
): [number, number] {
  switch (plane) {
    case "xz":
      return [Math.floor(hit.x), Math.floor(hit.z)]
    case "xy":
      return [Math.floor(hit.x), Math.floor(hit.y)]
    case "yz":
      return [Math.floor(hit.y), Math.floor(hit.z)]
  }
}

/**
 * Convert grid coords + plane + offset back to a 3D world position for the ghost mesh center.
 */
function ghostPosition(
  gridA: number,
  gridB: number,
  plane: PlacementPlane,
  offset: number,
): [number, number, number] {
  switch (plane) {
    case "xz":
      return [gridA + 0.5, offset + 0.001, gridB + 0.5]
    case "xy":
      return [gridA + 0.5, gridB + 0.5, offset + 0.001]
    case "yz":
      return [offset + 0.001, gridA + 0.5, gridB + 0.5]
  }
}

/**
 * Rotation euler for the ghost PlaneGeometry so it faces the correct direction.
 */
function ghostRotation(
  plane: PlacementPlane,
): [number, number, number] {
  switch (plane) {
    case "xz":
      return [-Math.PI / 2, 0, 0]
    case "xy":
      return [0, 0, 0]
    case "yz":
      return [0, Math.PI / 2, 0]
  }
}

/** Build the invisible raycast target mesh props for the current plane */
function raycastMeshProps(plane: PlacementPlane, offset: number) {
  switch (plane) {
    case "xz":
      return {
        rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
        position: [0, offset - 0.002, 0] as [number, number, number],
      }
    case "xy":
      return {
        rotation: [0, 0, 0] as [number, number, number],
        position: [0, 0, offset - 0.002] as [number, number, number],
      }
    case "yz":
      return {
        rotation: [0, Math.PI / 2, 0] as [number, number, number],
        position: [offset - 0.002, 0, 0] as [number, number, number],
      }
  }
}

const _intersect = new THREE.Vector3()

export function TilePlacer() {
  const tool = useEditorStore((s) => s.tool)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const placementOffset = useEditorStore((s) => s.placementOffset)
  const selectedTile = useTilesetStore((s) => s.selectedTile)
  const tilesets = useTilesetStore((s) => s.tilesets)
  const placeNewTile = useSceneStore((s) => s.placeNewTile)

  const [ghostPos, setGhostPos] = useState<[number, number] | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, raycaster, pointer } = useThree()

  const threePlane = useMemo(
    () => buildPlane(placementPlane, placementOffset),
    [placementPlane, placementOffset],
  )

  function getGridPosition(): [number, number] | null {
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.ray.intersectPlane(threePlane, _intersect)
    if (!hit) return null
    return toGridCoords(hit, placementPlane)
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

    // Multi-tile region: place one SceneFace per tile in the region
    for (let dy = 0; dy < selectedTile.h; dy++) {
      for (let dx = 0; dx < selectedTile.w; dx++) {
        const singleTileRef = {
          tilesetId: selectedTile.tilesetId,
          x: selectedTile.x + dx,
          y: selectedTile.y + dy,
          w: 1,
          h: 1,
        }
        const face = createTileFace(
          pos[0] + dx,
          pos[1] + dy,
          singleTileRef,
          tileset.columns,
          tileset.rows,
          placementPlane,
          placementOffset,
        )
        placeNewTile(face)
      }
    }
  }

  // Ghost preview texture
  const ghostTexture = useMemo(() => {
    if (!selectedTile) return null
    const tileset = tilesets[selectedTile.tilesetId]
    if (!tileset) return null
    return loadTilesetTexture(tileset.imageUrl)
  }, [selectedTile, tilesets])

  // Ghost geometry with UVs matching PlaneGeometry vertex order: TL, TR, BL, BR
  // Sized to cover the full multi-tile region
  const ghostGeometry = useMemo(() => {
    if (!selectedTile) return null
    const tileset = tilesets[selectedTile.tilesetId]
    if (!tileset) return null
    const { columns, rows } = tileset
    const u0 = selectedTile.x / columns
    const u1 = (selectedTile.x + selectedTile.w) / columns
    const v0 = 1 - (selectedTile.y + selectedTile.h) / rows
    const v1 = 1 - selectedTile.y / rows

    const geo = new THREE.PlaneGeometry(selectedTile.w, selectedTile.h)
    // PlaneGeometry vertices: TL(0), TR(1), BL(2), BR(3)
    geo.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        new Float32Array([
          u0, v1, // TL
          u1, v1, // TR
          u0, v0, // BL
          u1, v0, // BR
        ]),
        2,
      ),
    )
    return geo
  }, [selectedTile, tilesets])

  // Dispose old ghost geometry
  useEffect(() => {
    return () => {
      ghostGeometry?.dispose()
    }
  }, [ghostGeometry])

  const rcProps = raycastMeshProps(placementPlane, placementOffset)

  return (
    <>
      {/* Transparent plane for raycasting — must be visible for R3F events */}
      <mesh
        rotation={rcProps.rotation}
        position={rcProps.position}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Ghost preview */}
      {ghostPos && ghostTexture && ghostGeometry && selectedTile && (
        <mesh
          ref={meshRef}
          geometry={ghostGeometry}
          position={ghostPosition(
            ghostPos[0] + (selectedTile.w - 1) / 2,
            ghostPos[1] + (selectedTile.h - 1) / 2,
            placementPlane,
            placementOffset,
          )}
          rotation={ghostRotation(placementPlane)}
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

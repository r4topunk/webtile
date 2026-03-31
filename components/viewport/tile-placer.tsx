"use client"

import { useRef, useState, useMemo, useEffect, useCallback } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"
import { createTileFace } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"
import type { PlacementPlane } from "@/lib/types"

/**
 * Build an infinite THREE.Plane for the given placement plane + offset.
 * This is purely mathematical — no physical mesh needed for raycasting.
 */
function buildPlane(plane: PlacementPlane, offset: number): THREE.Plane {
  switch (plane) {
    case "xz":
      return new THREE.Plane(new THREE.Vector3(0, 1, 0), -offset)
    case "xy":
      return new THREE.Plane(new THREE.Vector3(0, 0, 1), -offset)
    case "yz":
      return new THREE.Plane(new THREE.Vector3(1, 0, 0), -offset)
  }
}

function toGridCoords(hit: THREE.Vector3, plane: PlacementPlane): [number, number] {
  switch (plane) {
    case "xz":
      return [Math.floor(hit.x), Math.floor(hit.z)]
    case "xy":
      return [Math.floor(hit.x), Math.floor(hit.y)]
    case "yz":
      return [Math.floor(hit.y), Math.floor(hit.z)]
  }
}

function ghostWorldPos(
  gridA: number,
  gridB: number,
  plane: PlacementPlane,
  offset: number,
): [number, number, number] {
  switch (plane) {
    case "xz":
      return [gridA + 0.5, offset + 0.002, gridB + 0.5]
    case "xy":
      return [gridA + 0.5, gridB + 0.5, offset + 0.002]
    case "yz":
      return [offset + 0.002, gridA + 0.5, gridB + 0.5]
  }
}

function ghostRotation(plane: PlacementPlane): [number, number, number] {
  switch (plane) {
    case "xz":
      return [-Math.PI / 2, 0, 0]
    case "xy":
      return [0, 0, 0]
    case "yz":
      return [0, Math.PI / 2, 0]
  }
}

const _intersect = new THREE.Vector3()
const _raycaster = new THREE.Raycaster()

/**
 * TilePlacer uses useFrame to continuously raycast the mouse position against
 * the infinite mathematical placement plane. No physical mesh needed — this
 * means the ghost preview tracks the mouse perfectly regardless of camera angle.
 */
export function TilePlacer() {
  const tool = useEditorStore((s) => s.tool)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const placementOffset = useEditorStore((s) => s.placementOffset)
  const selectedTile = useTilesetStore((s) => s.selectedTile)
  const tilesets = useTilesetStore((s) => s.tilesets)
  const placeNewTile = useSceneStore((s) => s.placeNewTile)

  const [ghostPos, setGhostPos] = useState<[number, number] | null>(null)
  const ghostPosRef = useRef<[number, number] | null>(null)
  const { camera, pointer, gl } = useThree()

  const threePlane = useMemo(
    () => buildPlane(placementPlane, placementOffset),
    [placementPlane, placementOffset],
  )

  // Continuously raycast against the infinite plane every frame
  useFrame(() => {
    if (tool !== "place" || !selectedTile) {
      if (ghostPosRef.current !== null) {
        ghostPosRef.current = null
        setGhostPos(null)
      }
      return
    }

    _raycaster.setFromCamera(pointer, camera)
    const hit = _raycaster.ray.intersectPlane(threePlane, _intersect)
    if (!hit) {
      if (ghostPosRef.current !== null) {
        ghostPosRef.current = null
        setGhostPos(null)
      }
      return
    }

    const gridPos = toGridCoords(hit, placementPlane)
    // Only update React state if position actually changed (avoid re-renders)
    if (
      !ghostPosRef.current ||
      ghostPosRef.current[0] !== gridPos[0] ||
      ghostPosRef.current[1] !== gridPos[1]
    ) {
      ghostPosRef.current = gridPos
      setGhostPos(gridPos)
    }
  })

  // Click handler on the canvas DOM element
  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Only handle left clicks
      if (e.button !== 0) return
      if (tool !== "place" || !selectedTile) return

      _raycaster.setFromCamera(pointer, camera)
      const hit = _raycaster.ray.intersectPlane(threePlane, _intersect)
      if (!hit) return

      const pos = toGridCoords(hit, placementPlane)
      const tileset = tilesets[selectedTile.tilesetId]
      if (!tileset) return

      // Multi-tile region: place one face per tile
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
    },
    [tool, selectedTile, tilesets, placementPlane, placementOffset, placeNewTile, pointer, camera, threePlane],
  )

  // Attach click listener directly to the canvas DOM element
  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener("click", handleClick)
    return () => canvas.removeEventListener("click", handleClick)
  }, [gl, handleClick])

  // Ghost preview texture
  const ghostTexture = useMemo(() => {
    if (!selectedTile) return null
    const tileset = tilesets[selectedTile.tilesetId]
    if (!tileset) return null
    return loadTilesetTexture(tileset.imageUrl)
  }, [selectedTile, tilesets])

  // Ghost geometry with UVs for PlaneGeometry vertex order: TL, TR, BL, BR
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
    geo.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        new Float32Array([u0, v1, u1, v1, u0, v0, u1, v0]),
        2,
      ),
    )
    return geo
  }, [selectedTile, tilesets])

  useEffect(() => {
    return () => { ghostGeometry?.dispose() }
  }, [ghostGeometry])

  if (!ghostPos || !ghostTexture || !ghostGeometry || !selectedTile) return null

  return (
    <mesh
      geometry={ghostGeometry}
      position={ghostWorldPos(
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
  )
}

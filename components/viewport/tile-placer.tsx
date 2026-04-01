"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"
import { createTileFace } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"
import type { PlacementPlane, SceneFace } from "@/lib/types"

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

/**
 * Raycast the current pointer position against the placement plane.
 * Uses a fresh raycaster each call to avoid shared mutable state bugs.
 */
function raycastPlane(
  pointer: THREE.Vector2,
  camera: THREE.Camera,
  plane: THREE.Plane,
): THREE.Vector3 | null {
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(pointer, camera)
  const hit = new THREE.Vector3()
  return raycaster.ray.intersectPlane(plane, hit) ? hit : null
}

/**
 * Convert a DOM MouseEvent to normalized device coordinates for the given canvas.
 */
function eventToNDC(e: MouseEvent, canvas: HTMLCanvasElement): THREE.Vector2 {
  const rect = canvas.getBoundingClientRect()
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  )
}

/**
 * Compute the center of a face projected onto a placement plane.
 * Returns [gridA, gridB] if the face lies on the given plane+offset, else null.
 */
function faceCenter(face: SceneFace, plane: PlacementPlane, offset: number): [number, number] | null {
  const cx = (face.vertices[0][0] + face.vertices[1][0] + face.vertices[2][0] + face.vertices[3][0]) / 4
  const cy = (face.vertices[0][1] + face.vertices[1][1] + face.vertices[2][1] + face.vertices[3][1]) / 4
  const cz = (face.vertices[0][2] + face.vertices[1][2] + face.vertices[2][2] + face.vertices[3][2]) / 4

  const tolerance = 0.1
  switch (plane) {
    case "xz":
      if (Math.abs(cy - offset) < tolerance) return [cx, cz]
      break
    case "xy":
      if (Math.abs(cz - offset) < tolerance) return [cx, cy]
      break
    case "yz":
      if (Math.abs(cx - offset) < tolerance) return [cy, cz]
      break
  }
  return null
}

/**
 * Erase the tile face at a given grid position on the current placement plane.
 */
function eraseAtPosition(pos: [number, number], plane: PlacementPlane, offset: number) {
  const { objects, removeFaces, removeObjects } = useSceneStore.getState()

  for (const obj of Object.values(objects)) {
    for (const face of obj.faces) {
      const center = faceCenter(face, plane, offset)
      if (center && Math.floor(center[0]) === pos[0] && Math.floor(center[1]) === pos[1]) {
        if (obj.faces.length === 1) {
          removeObjects([obj.id])
        } else {
          removeFaces(obj.id, [face.id])
        }
        return // Only erase one per position
      }
    }
  }
}

export function TilePlacer() {
  const tool = useEditorStore((s) => s.tool)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const placementOffset = useEditorStore((s) => s.placementOffset)
  const selectedTile = useTilesetStore((s) => s.selectedTile)
  const tilesets = useTilesetStore((s) => s.tilesets)

  const [ghostPos, setGhostPos] = useState<[number, number] | null>(null)
  const ghostPosRef = useRef<[number, number] | null>(null)
  const { camera, pointer, gl } = useThree()

  // Refs for drag-placing / drag-erasing
  const isDragging = useRef(false)
  const lastPlacedPos = useRef<string | null>(null)

  const threePlane = useMemo(
    () => buildPlane(placementPlane, placementOffset),
    [placementPlane, placementOffset],
  )

  /**
   * Place or erase a tile at the NDC position.
   */
  function placeTileAt(ndc: THREE.Vector2) {
    const currentTile = useTilesetStore.getState().selectedTile
    const currentPlane = useEditorStore.getState().placementPlane
    const currentOffset = useEditorStore.getState().placementOffset
    const currentTool = useEditorStore.getState().tool
    if (currentTool !== "place" && currentTool !== "erase") return

    const plane = buildPlane(currentPlane, currentOffset)
    const hit = raycastPlane(ndc, camera, plane)
    if (!hit) return

    const pos = toGridCoords(hit, currentPlane)
    const key = `${pos[0]},${pos[1]}`
    if (key === lastPlacedPos.current) return
    lastPlacedPos.current = key

    if (currentTool === "erase") {
      eraseAtPosition(pos, currentPlane, currentOffset)
      return
    }

    // Place tool requires a selected tile
    if (!currentTile) return

    const allTilesets = useTilesetStore.getState().tilesets
    const tileset = allTilesets[currentTile.tilesetId]
    if (!tileset) return

    for (let dy = 0; dy < currentTile.h; dy++) {
      for (let dx = 0; dx < currentTile.w; dx++) {
        const singleTileRef = {
          tilesetId: currentTile.tilesetId,
          x: currentTile.x + dx,
          y: currentTile.y + dy,
          w: 1,
          h: 1,
        }
        const face = createTileFace(
          pos[0] + dx,
          pos[1] + dy,
          singleTileRef,
          tileset.columns,
          tileset.rows,
          currentPlane,
          currentOffset,
        )
        useSceneStore.getState().placeNewTile(face)
      }
    }
  }

  // Ghost preview tracking via useFrame — uses R3F's pointer (always fresh)
  useFrame(() => {
    const isActiveTool = tool === "place" || tool === "erase"
    const needsTile = tool === "place"

    if (!isActiveTool || (needsTile && !selectedTile)) {
      if (ghostPosRef.current !== null) {
        ghostPosRef.current = null
        setGhostPos(null)
      }
      return
    }

    const hit = raycastPlane(pointer, camera, threePlane)
    if (!hit) {
      if (ghostPosRef.current !== null) {
        ghostPosRef.current = null
        setGhostPos(null)
      }
      return
    }

    const gridPos = toGridCoords(hit, placementPlane)
    if (
      !ghostPosRef.current ||
      ghostPosRef.current[0] !== gridPos[0] ||
      ghostPosRef.current[1] !== gridPos[1]
    ) {
      ghostPosRef.current = gridPos
      setGhostPos(gridPos)
    }
  })

  // Pointer handlers for drag-to-place and drag-to-erase
  useEffect(() => {
    const canvas = gl.domElement

    function handlePointerDown(e: MouseEvent) {
      if (e.button !== 0) return
      const currentTool = useEditorStore.getState().tool
      if (currentTool !== "place" && currentTool !== "erase") return

      // Pause undo tracking — resume on pointer up so entire drag = one undo step
      useSceneStore.temporal.getState().pause()
      isDragging.current = true
      lastPlacedPos.current = null
      const ndc = eventToNDC(e, canvas)
      placeTileAt(ndc)
    }

    function handlePointerMove(e: MouseEvent) {
      if (!isDragging.current) return
      const ndc = eventToNDC(e, canvas)
      placeTileAt(ndc)
    }

    function handlePointerUp() {
      if (isDragging.current) {
        useSceneStore.temporal.getState().resume()
      }
      isDragging.current = false
      lastPlacedPos.current = null
    }

    canvas.addEventListener("pointerdown", handlePointerDown)
    canvas.addEventListener("pointermove", handlePointerMove)
    canvas.addEventListener("pointerup", handlePointerUp)
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown)
      canvas.removeEventListener("pointermove", handlePointerMove)
      canvas.removeEventListener("pointerup", handlePointerUp)
    }
  }, [gl, camera]) // Only depend on stable refs — reads fresh state inside

  // Ghost preview texture (for place tool)
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

  // Eraser ghost geometry (simple 1x1 plane)
  const eraserGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  useEffect(() => {
    return () => { ghostGeometry?.dispose() }
  }, [ghostGeometry])

  // Eraser ghost: red semi-transparent square
  if (tool === "erase" && ghostPos) {
    return (
      <mesh
        geometry={eraserGeometry}
        position={ghostWorldPos(ghostPos[0], ghostPos[1], placementPlane, placementOffset)}
        rotation={ghostRotation(placementPlane)}
      >
        <meshBasicMaterial
          color="#ff2222"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    )
  }

  // Place ghost: tile preview
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

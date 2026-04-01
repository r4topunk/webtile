"use client"

import { useEffect, useMemo, useRef, useCallback, useState } from "react"
import { ThreeEvent, useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { SceneObject, Vec3 } from "@/lib/types"
import { buildGeometryFromFaces } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"
import { useTilesetStore } from "@/store/tileset-store"
import { useSceneStore } from "@/store/scene-store"
import { useEditorStore } from "@/store/editor-store"

interface SceneObjectMeshProps {
  obj: SceneObject
  isSelected: boolean
}

/**
 * Overlay showing selected face highlights.
 */
function FaceHighlightOverlay({ obj }: { obj: SceneObject }) {
  const selectedFaceIds = useSceneStore((s) => s.selectedFaceIds)
  const selectedSet = useMemo(() => new Set(selectedFaceIds), [selectedFaceIds])

  const highlightGeo = useMemo(() => {
    const faces = obj.faces.filter((f) => selectedSet.has(f.id))
    if (faces.length === 0) return null
    return buildGeometryFromFaces(faces)
  }, [obj.faces, selectedSet])

  useEffect(() => {
    return () => { highlightGeo?.dispose() }
  }, [highlightGeo])

  if (!highlightGeo) return null

  return (
    <mesh geometry={highlightGeo}>
      <meshBasicMaterial
        color="#ff6600"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        depthTest={false}
      />
    </mesh>
  )
}

/**
 * Vertex mode: render draggable spheres at each vertex position.
 * Click to select, drag to move along a plane perpendicular to camera.
 */
function VertexDots({ obj }: { obj: SceneObject }) {
  const selectedVertexIndices = useSceneStore((s) => s.selectedVertexIndices)
  const selectedSet = useMemo(() => new Set(selectedVertexIndices), [selectedVertexIndices])
  const { camera, pointer } = useThree()

  const draggingRef = useRef(false)
  const dragOriginRef = useRef(new THREE.Vector3())
  const dragPlaneRef = useRef(new THREE.Plane())
  const appliedRef = useRef(new THREE.Vector3())
  const activeLockRef = useRef<"x" | "y" | "z" | null>(null)
  const lastPlaneKeyRef = useRef<string | null>(null) // track which plane/axis rebuilt the drag plane
  const keyStateRef = useRef({ shift: false, ctrl: false, x: false, y: false, z: false })

  const vertices = useMemo(() => {
    const result: { pos: Vec3; index: number }[] = []
    let idx = 0
    for (const face of obj.faces) {
      for (const v of face.vertices) {
        result.push({ pos: v, index: idx })
        idx++
      }
    }
    return result
  }, [obj.faces])

  /**
   * Build a drag plane that allows movement along the given axis/axes.
   *
   * For 2D (placement plane): normal is perpendicular to the plane.
   * For single axis: build a plane containing that axis, facing the camera
   * as much as possible (maximizes mouse sensitivity).
   */
  function buildPlaneForAxes(
    worldPoint: THREE.Vector3,
    mode: "placement" | "x" | "y" | "z",
  ): THREE.Plane {
    let normal: THREE.Vector3

    if (mode === "placement") {
      const pp = useEditorStore.getState().placementPlane
      switch (pp) {
        case "xz": normal = new THREE.Vector3(0, 1, 0); break
        case "xy": normal = new THREE.Vector3(0, 0, 1); break
        case "yz": normal = new THREE.Vector3(1, 0, 0); break
      }
    } else {
      // For single-axis constraint: build a plane that contains the target
      // axis and faces the camera. This gives maximum mouse sensitivity.
      //
      // Method: take camera direction, remove the component along the
      // target axis, use the remainder as the plane normal.
      const cameraDir = new THREE.Vector3()
      camera.getWorldDirection(cameraDir)

      const axis = mode === "x" ? new THREE.Vector3(1, 0, 0)
        : mode === "y" ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(0, 0, 1)

      // Remove axis component from camera direction
      normal = cameraDir.clone().sub(
        axis.clone().multiplyScalar(cameraDir.dot(axis))
      )

      // If camera is looking straight along the axis, fall back to a
      // perpendicular plane
      if (normal.lengthSq() < 0.001) {
        // Use world up or right as fallback
        normal = mode === "y" ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)
      }
      normal.normalize()
    }

    return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, worldPoint)
  }

  function raycastDragPlane(): THREE.Vector3 | null {
    const rc = new THREE.Raycaster()
    rc.setFromCamera(pointer, camera)
    const hit = new THREE.Vector3()
    return rc.ray.intersectPlane(dragPlaneRef.current, hit) ? hit : null
  }

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>, index: number) => {
      e.stopPropagation()
      const store = useSceneStore.getState()

      // Ctrl/Cmd+click = multi-select (Shift is reserved for axis constraint)
      if (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey) {
        store.toggleVertexSelection(index)
        return
      }

      if (!selectedSet.has(index)) {
        store.setSelectedVertices([index])
      }

      const worldPoint = e.point.clone()
      dragPlaneRef.current = buildPlaneForAxes(worldPoint, "placement")
      dragOriginRef.current.copy(worldPoint)
      appliedRef.current.set(0, 0, 0)
      activeLockRef.current = null
      lastPlaneKeyRef.current = "placement"
      draggingRef.current = true

      ;(e.nativeEvent.target as HTMLElement).setPointerCapture(e.nativeEvent.pointerId)
    },
    [camera, selectedSet],
  )

  useFrame(() => {
    if (!draggingRef.current) return

    const keys = keyStateRef.current

    // Determine current axis mode from keys
    let currentMode: "placement" | "x" | "y" | "z" = "placement"
    if (keys.x) currentMode = "x"
    else if (keys.y) currentMode = "y"
    else if (keys.z) currentMode = "z"
    // Shift: use camera-perpendicular plane for auto-detect (gives all 3 axes)
    else if (keys.shift) currentMode = "camera"  as any // special mode below

    // For Shift mode: use a camera-perpendicular plane so we can detect
    // movement on any axis, then lock to the dominant one
    const modeKey = keys.shift ? "camera" : currentMode
    if (modeKey !== lastPlaneKeyRef.current) {
      if (modeKey === "camera") {
        // Camera-facing plane through drag origin — gives all 3 axes
        const cameraDir = new THREE.Vector3()
        camera.getWorldDirection(cameraDir)
        dragPlaneRef.current = new THREE.Plane()
          .setFromNormalAndCoplanarPoint(cameraDir, dragOriginRef.current)
      } else {
        dragPlaneRef.current = buildPlaneForAxes(
          dragOriginRef.current,
          currentMode as "placement" | "x" | "y" | "z",
        )
      }
      appliedRef.current.set(0, 0, 0)
      lastPlaneKeyRef.current = modeKey
    }

    const intersection = raycastDragPlane()
    if (!intersection) return

    const rawDelta = intersection.clone().sub(dragOriginRef.current)

    // Determine axis lock
    let axisLock: "x" | "y" | "z" | null = null
    if (currentMode === "x" || currentMode === "y" || currentMode === "z") {
      axisLock = currentMode
    } else if (keys.shift) {
      // Auto-detect dominant axis from camera-plane movement
      const ax = Math.abs(rawDelta.x)
      const ay = Math.abs(rawDelta.y)
      const az = Math.abs(rawDelta.z)
      const max = Math.max(ax, ay, az)
      if (max > 0.05) {
        if (max === ax) axisLock = "x"
        else if (max === ay) axisLock = "y"
        else axisLock = "z"
      }
    }
    activeLockRef.current = axisLock

    // Apply axis constraint
    let constrained = rawDelta.clone()
    if (axisLock) {
      switch (axisLock) {
        case "x": constrained.set(rawDelta.x, 0, 0); break
        case "y": constrained.set(0, rawDelta.y, 0); break
        case "z": constrained.set(0, 0, rawDelta.z); break
      }
    }

    // Grid snapping
    const { snapEnabled, snapSize } = useEditorStore.getState()
    const shouldSnap = snapEnabled || keys.ctrl

    let snapped: THREE.Vector3
    if (shouldSnap && snapSize > 0) {
      snapped = new THREE.Vector3(
        Math.round(constrained.x / snapSize) * snapSize,
        Math.round(constrained.y / snapSize) * snapSize,
        Math.round(constrained.z / snapSize) * snapSize,
      )
    } else {
      snapped = constrained
    }

    const incrementalDelta: Vec3 = [
      snapped.x - appliedRef.current.x,
      snapped.y - appliedRef.current.y,
      snapped.z - appliedRef.current.z,
    ]

    if (Math.abs(incrementalDelta[0]) < 0.0001 &&
        Math.abs(incrementalDelta[1]) < 0.0001 &&
        Math.abs(incrementalDelta[2]) < 0.0001) return

    const store = useSceneStore.getState()
    const indices = store.selectedVertexIndices
    if (indices.length > 0) {
      store.moveVertices(obj.id, indices, incrementalDelta)
      appliedRef.current.copy(snapped)
    }
  })

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false
    activeLockRef.current = null
    lastPlaneKeyRef.current = null
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keyStateRef.current.shift = e.shiftKey
      keyStateRef.current.ctrl = e.ctrlKey || e.metaKey
      if (e.key === "x" || e.key === "X") keyStateRef.current.x = true
      if (e.key === "y" || e.key === "Y") keyStateRef.current.y = true
      if (e.key === "z" || e.key === "Z") keyStateRef.current.z = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keyStateRef.current.shift = e.shiftKey
      keyStateRef.current.ctrl = e.ctrlKey || e.metaKey
      if (e.key === "x" || e.key === "X") keyStateRef.current.x = false
      if (e.key === "y" || e.key === "Y") keyStateRef.current.y = false
      if (e.key === "z" || e.key === "Z") keyStateRef.current.z = false
    }
    const onPointerUp = () => { draggingRef.current = false }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [])

  return (
    <>
      {vertices.map((v) => {
        const isVtxSelected = selectedSet.has(v.index)
        return (
          <group key={v.index} position={v.pos}>
            {/* Outer ring for visibility */}
            <mesh renderOrder={998}>
              <ringGeometry args={[0.09, 0.12, 16]} />
              <meshBasicMaterial
                color={isVtxSelected ? "#ff4400" : "#2288dd"}
                side={THREE.DoubleSide}
                depthTest={false}
                depthWrite={false}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Inner dot — clickable */}
            <mesh
              renderOrder={999}
              onPointerDown={(e) => handlePointerDown(e, v.index)}
              onPointerUp={handlePointerUp}
              onClick={(e) => e.stopPropagation()}
            >
              <sphereGeometry args={[0.1, 12, 12]} />
              <meshBasicMaterial
                color={isVtxSelected ? "#ff6622" : "#44aaff"}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

/**
 * Edge mode: render edges as colored lines.
 * Click to select (uses invisible tube meshes as hit targets).
 */
function EdgeLines({ obj }: { obj: SceneObject }) {
  const selectedEdgeIndices = useSceneStore((s) => s.selectedEdgeIndices)

  const edges = useMemo(() => {
    const result: { a: Vec3; b: Vec3; idxA: number; idxB: number }[] = []
    let idx = 0
    for (const face of obj.faces) {
      const base = idx
      for (let i = 0; i < 4; i++) {
        result.push({
          a: face.vertices[i],
          b: face.vertices[(i + 1) % 4],
          idxA: base + i,
          idxB: base + ((i + 1) % 4),
        })
      }
      idx += 4
    }
    return result
  }, [obj.faces])

  const isEdgeSelected = useCallback(
    (idxA: number, idxB: number) => {
      return selectedEdgeIndices.some(
        (e) =>
          (e[0] === idxA && e[1] === idxB) ||
          (e[0] === idxB && e[1] === idxA),
      )
    },
    [selectedEdgeIndices],
  )

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>, idxA: number, idxB: number) => {
      e.stopPropagation()
      const store = useSceneStore.getState()
      const edge: [number, number] = [idxA, idxB]
      if (e.nativeEvent.shiftKey) {
        store.toggleEdgeSelection(edge)
      } else {
        store.setSelectedEdges([edge])
      }
    },
    [],
  )

  return (
    <>
      {edges.map((edge, i) => {
        const selected = isEdgeSelected(edge.idxA, edge.idxB)
        const midX = (edge.a[0] + edge.b[0]) / 2
        const midY = (edge.a[1] + edge.b[1]) / 2
        const midZ = (edge.a[2] + edge.b[2]) / 2
        const dx = edge.b[0] - edge.a[0]
        const dy = edge.b[1] - edge.a[1]
        const dz = edge.b[2] - edge.a[2]
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz)

        // Use line segments for visual + invisible cylinder for clicking
        const points = [new THREE.Vector3(...edge.a), new THREE.Vector3(...edge.b)]
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points)

        return (
          <group key={i}>
            <primitive
              object={
                new THREE.Line(
                  lineGeo,
                  new THREE.LineBasicMaterial({
                    color: selected ? "#ff4400" : "#44aaff",
                    depthTest: false,
                    linewidth: 2,
                  }),
                )
              }
            />
            {/* Invisible clickable cylinder along the edge */}
            <mesh
              position={[midX, midY, midZ]}
              onClick={(e) => handleClick(e, edge.idxA, edge.idxB)}
              onPointerOver={() => { document.body.style.cursor = "pointer" }}
              onPointerOut={() => { document.body.style.cursor = "" }}
            >
              <cylinderGeometry args={[0.04, 0.04, len || 0.01, 4]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

export function SceneObjectMesh({ obj, isSelected }: SceneObjectMeshProps) {
  const tilesets = useTilesetStore((s) => s.tilesets)
  const tool = useEditorStore((s) => s.tool)
  const mode = useEditorStore((s) => s.mode)
  const groupRef = useRef<THREE.Group>(null)

  const geometry = useMemo(() => buildGeometryFromFaces(obj.faces), [obj.faces])

  useEffect(() => {
    return () => { geometry.dispose() }
  }, [geometry])

  const texture = useMemo(() => {
    const faceWithTile = obj.faces.find((f) => f.tileRef !== null)
    if (!faceWithTile?.tileRef) return null
    const tileset = tilesets[faceWithTile.tileRef.tilesetId]
    if (!tileset) return null
    return loadTilesetTexture(tileset.imageUrl)
  }, [obj.faces, tilesets])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (obj.locked) return

      // Object mode: select
      if (mode === "object" && tool === "select") {
        e.stopPropagation()
        const { setSelection, toggleSelection } = useSceneStore.getState()
        if (e.nativeEvent.shiftKey) {
          toggleSelection(obj.id)
        } else {
          setSelection([obj.id])
        }
        return
      }

      // Face mode: select face
      if (mode === "face" && isSelected) {
        e.stopPropagation()
        const faceIndex = e.faceIndex != null ? Math.floor(e.faceIndex / 2) : -1
        if (faceIndex < 0 || faceIndex >= obj.faces.length) return
        const face = obj.faces[faceIndex]
        const { setSelectedFaces, toggleFaceSelection } = useSceneStore.getState()
        if (e.nativeEvent.shiftKey) {
          toggleFaceSelection(face.id)
        } else {
          setSelectedFaces([face.id])
        }
        return
      }

      // Paint mode: paint face
      if (tool === "paint") {
        e.stopPropagation()
        const faceIndex = e.faceIndex != null ? Math.floor(e.faceIndex / 2) : -1
        if (faceIndex < 0 || faceIndex >= obj.faces.length) return
        const face = obj.faces[faceIndex]
        const selectedTile = useTilesetStore.getState().selectedTile
        if (!selectedTile) return
        const tileset = useTilesetStore.getState().tilesets[selectedTile.tilesetId]
        if (!tileset) return
        useSceneStore.getState().paintFace(
          obj.id, face.id, selectedTile, tileset.columns, tileset.rows,
        )
        return
      }

      // In sub-object modes on non-selected objects, select first
      if ((mode === "face" || mode === "vertex" || mode === "edge") && !isSelected) {
        e.stopPropagation()
        useSceneStore.getState().setSelection([obj.id])
        return
      }

      // In vertex/edge mode with object selected, stop propagation
      // to prevent SceneClickCatcher from clearing the selection
      if ((mode === "vertex" || mode === "edge") && isSelected) {
        e.stopPropagation()
        return
      }
    },
    [tool, mode, obj.id, obj.faces, obj.locked, isSelected],
  )

  if (!obj.visible) return null

  return (
    <group
      ref={groupRef}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      onClick={handleClick}
    >
      <mesh geometry={geometry}>
        {texture ? (
          <meshStandardMaterial map={texture} side={THREE.DoubleSide} transparent />
        ) : (
          <meshStandardMaterial color="#666" side={THREE.DoubleSide} />
        )}
      </mesh>

      {/* Object mode: selection wireframe */}
      {isSelected && mode === "object" && (
        <mesh geometry={geometry}>
          <meshBasicMaterial color="#4a9eff" wireframe transparent opacity={0.6} depthTest={false} />
        </mesh>
      )}

      {/* Face mode: wireframe + face highlights */}
      {isSelected && mode === "face" && (
        <>
          <mesh geometry={geometry}>
            <meshBasicMaterial color="#4a9eff" wireframe transparent opacity={0.3} depthTest={false} />
          </mesh>
          <FaceHighlightOverlay obj={obj} />
        </>
      )}

      {/* Vertex mode: wireframe + draggable dots */}
      {isSelected && mode === "vertex" && (
        <>
          <mesh geometry={geometry}>
            <meshBasicMaterial color="#4a9eff" wireframe transparent opacity={0.3} depthTest={false} />
          </mesh>
          <VertexDots obj={obj} />
        </>
      )}

      {/* Edge mode: wireframe + clickable edge lines */}
      {isSelected && mode === "edge" && (
        <>
          <mesh geometry={geometry}>
            <meshBasicMaterial color="#4a9eff" wireframe transparent opacity={0.3} depthTest={false} />
          </mesh>
          <EdgeLines obj={obj} />
        </>
      )}

      {/* Paint mode highlight */}
      {tool === "paint" && (
        <mesh geometry={geometry}>
          <meshBasicMaterial color="#22cc44" wireframe transparent opacity={0.3} depthTest={false} />
        </mesh>
      )}
    </group>
  )
}

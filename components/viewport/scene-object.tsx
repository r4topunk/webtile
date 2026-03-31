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
  const { camera, raycaster, pointer } = useThree()

  const draggingRef = useRef(false)
  const dragStartRef = useRef(new THREE.Vector3())
  const dragPlaneRef = useRef(new THREE.Plane())

  // Flatten all vertices with their global index
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

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>, index: number) => {
      e.stopPropagation()
      const store = useSceneStore.getState()

      // Select vertex
      if (e.nativeEvent.shiftKey) {
        store.toggleVertexSelection(index)
      } else if (!selectedSet.has(index)) {
        store.setSelectedVertices([index])
      }

      // Start drag — create a plane perpendicular to camera at the vertex position
      const vertex = vertices.find((v) => v.index === index)
      if (!vertex) return

      const cameraDir = new THREE.Vector3()
      camera.getWorldDirection(cameraDir)
      const point = new THREE.Vector3(...vertex.pos)
        .add(new THREE.Vector3(...obj.position))
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(cameraDir, point)
      dragStartRef.current.copy(point)
      draggingRef.current = true

      // Capture pointer for reliable drag
      ;(e.nativeEvent.target as HTMLElement).setPointerCapture(e.nativeEvent.pointerId)
    },
    [camera, obj.position, vertices, selectedSet],
  )

  // Use useFrame for smooth dragging
  useFrame(() => {
    if (!draggingRef.current) return

    raycaster.setFromCamera(pointer, camera)
    const intersection = new THREE.Vector3()
    const hit = raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)
    if (!hit) return

    const delta: Vec3 = [
      intersection.x - dragStartRef.current.x,
      intersection.y - dragStartRef.current.y,
      intersection.z - dragStartRef.current.z,
    ]

    // Only move if there's actual movement
    if (Math.abs(delta[0]) < 0.001 && Math.abs(delta[1]) < 0.001 && Math.abs(delta[2]) < 0.001) return

    const store = useSceneStore.getState()
    const indices = store.selectedVertexIndices.length > 0
      ? store.selectedVertexIndices
      : [] // nothing selected = nothing to move

    if (indices.length > 0) {
      store.moveVertices(obj.id, indices, delta)
      dragStartRef.current.copy(intersection)
    }
  })

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false
  }, [])

  // Listen for global pointer up to end drag
  useEffect(() => {
    const handler = () => { draggingRef.current = false }
    window.addEventListener("pointerup", handler)
    return () => window.removeEventListener("pointerup", handler)
  }, [])

  return (
    <>
      {vertices.map((v) => (
        <mesh
          key={v.index}
          position={v.pos}
          renderOrder={999}
          onPointerDown={(e) => handlePointerDown(e, v.index)}
          onPointerUp={handlePointerUp}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial
            color={selectedSet.has(v.index) ? "#ff4400" : "#44aaff"}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      ))}
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

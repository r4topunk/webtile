"use client"

import { useEffect, useMemo, useRef, useCallback } from "react"
import { ThreeEvent } from "@react-three/fiber"
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
 * Renders a separate geometry containing only the selected faces.
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
    return () => {
      highlightGeo?.dispose()
    }
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
 * Vertex mode: render small spheres at each vertex position.
 */
function VertexDots({ obj }: { obj: SceneObject }) {
  const selectedVertexIndices = useSceneStore((s) => s.selectedVertexIndices)
  const selectedSet = useMemo(() => new Set(selectedVertexIndices), [selectedVertexIndices])

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

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>, index: number) => {
      e.stopPropagation()
      const { setSelectedVertices, toggleVertexSelection } = useSceneStore.getState()
      if (e.nativeEvent.shiftKey) {
        toggleVertexSelection(index)
      } else {
        setSelectedVertices([index])
      }
    },
    [],
  )

  return (
    <>
      {vertices.map((v) => (
        <mesh
          key={v.index}
          position={v.pos}
          onClick={(e) => handleClick(e, v.index)}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={selectedSet.has(v.index) ? "#ff4400" : "#44aaff"}
            depthTest={false}
          />
        </mesh>
      ))}
    </>
  )
}

/**
 * Edge mode: render edges as lines on the object.
 * Each face has 4 edges: v0-v1, v1-v2, v2-v3, v3-v0.
 * Edge indices are based on the flattened vertex index.
 */
function EdgeLines({ obj }: { obj: SceneObject }) {
  const selectedEdgeIndices = useSceneStore((s) => s.selectedEdgeIndices)

  // Build edges
  const edges = useMemo(() => {
    const result: { a: Vec3; b: Vec3; idxA: number; idxB: number }[] = []
    let idx = 0
    for (const face of obj.faces) {
      const base = idx
      for (let i = 0; i < 4; i++) {
        const a = i
        const b = (i + 1) % 4
        result.push({
          a: face.vertices[a],
          b: face.vertices[b],
          idxA: base + a,
          idxB: base + b,
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
      const { setSelectedEdges, toggleEdgeSelection } = useSceneStore.getState()
      const edge: [number, number] = [idxA, idxB]
      if (e.nativeEvent.shiftKey) {
        toggleEdgeSelection(edge)
      } else {
        setSelectedEdges([edge])
      }
    },
    [],
  )

  // Build line objects imperatively to avoid JSX <line> / SVG conflict
  const lineObjects = useMemo(() => {
    return edges.map((edge) => {
      const points = [
        new THREE.Vector3(...edge.a),
        new THREE.Vector3(...edge.b),
      ]
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      return { geo, edge }
    })
  }, [edges])

  return (
    <>
      {lineObjects.map(({ geo, edge }, i) => {
        const selected = isEdgeSelected(edge.idxA, edge.idxB)
        const mat = new THREE.LineBasicMaterial({
          color: selected ? "#ff4400" : "#44aaff",
          depthTest: false,
        })
        const lineObj = new THREE.Line(geo, mat)
        return (
          <group key={i}>
            <primitive object={lineObj} />
            {/* Invisible thicker mesh for easier clicking */}
            <mesh
              position={[
                (edge.a[0] + edge.b[0]) / 2,
                (edge.a[1] + edge.b[1]) / 2,
                (edge.a[2] + edge.b[2]) / 2,
              ]}
              onClick={(e) => handleClick(e, edge.idxA, edge.idxB)}
            >
              <boxGeometry args={[0.08, 0.08, 0.08]} />
              <meshBasicMaterial visible={false} />
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

  // Dispose old geometry on change or unmount
  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  // Get the tileset texture from the first face that has a tileRef
  const texture = useMemo(() => {
    const faceWithTile = obj.faces.find((f) => f.tileRef !== null)
    if (!faceWithTile?.tileRef) return null
    const tileset = tilesets[faceWithTile.tileRef.tilesetId]
    if (!tileset) return null
    return loadTilesetTexture(tileset.imageUrl)
  }, [obj.faces, tilesets])

  // Get active tileset info for paint mode
  const activeTileset = useTilesetStore((s) => {
    const id = s.activeTilesetId
    return id ? s.tilesets[id] : null
  })

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      // Locked objects cannot be interacted with
      if (obj.locked) return

      // Object mode: select objects
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

      // Face mode: select individual faces
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

      // Paint mode: paint the clicked face with current tile
      if (tool === "paint" || mode === "paint" as string) {
        e.stopPropagation()
        const faceIndex = e.faceIndex != null ? Math.floor(e.faceIndex / 2) : -1
        if (faceIndex < 0 || faceIndex >= obj.faces.length) return
        const face = obj.faces[faceIndex]
        const selectedTile = useTilesetStore.getState().selectedTile
        if (!selectedTile) return
        const tileset = useTilesetStore.getState().tilesets[selectedTile.tilesetId]
        if (!tileset) return
        useSceneStore.getState().paintFace(
          obj.id,
          face.id,
          selectedTile,
          tileset.columns,
          tileset.rows,
        )
        return
      }

      // In face/vertex/edge mode on non-selected objects, select the object first
      if ((mode === "face" || mode === "vertex" || mode === "edge") && !isSelected) {
        e.stopPropagation()
        useSceneStore.getState().setSelection([obj.id])
        return
      }
    },
    [tool, mode, obj.id, obj.faces, isSelected],
  )

  if (!obj.visible) return null

  const showSubObjectEditing = isSelected && (mode === "face" || mode === "vertex" || mode === "edge")

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

      {/* Selection wireframe overlay (object mode) */}
      {isSelected && mode === "object" && (
        <mesh geometry={geometry}>
          <meshBasicMaterial
            color="#4a9eff"
            wireframe
            transparent
            opacity={0.6}
            depthTest={false}
          />
        </mesh>
      )}

      {/* Face mode: highlight selected faces */}
      {isSelected && mode === "face" && (
        <>
          <mesh geometry={geometry}>
            <meshBasicMaterial
              color="#4a9eff"
              wireframe
              transparent
              opacity={0.3}
              depthTest={false}
            />
          </mesh>
          <FaceHighlightOverlay obj={obj} />
        </>
      )}

      {/* Vertex mode: show vertex dots */}
      {isSelected && mode === "vertex" && (
        <>
          <mesh geometry={geometry}>
            <meshBasicMaterial
              color="#4a9eff"
              wireframe
              transparent
              opacity={0.3}
              depthTest={false}
            />
          </mesh>
          <VertexDots obj={obj} />
        </>
      )}

      {/* Edge mode: show edge lines */}
      {isSelected && mode === "edge" && (
        <>
          <mesh geometry={geometry}>
            <meshBasicMaterial
              color="#4a9eff"
              wireframe
              transparent
              opacity={0.3}
              depthTest={false}
            />
          </mesh>
          <EdgeLines obj={obj} />
        </>
      )}

      {/* Paint mode highlight */}
      {tool === "paint" && (
        <mesh geometry={geometry}>
          <meshBasicMaterial
            color="#22cc44"
            wireframe
            transparent
            opacity={0.3}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  )
}

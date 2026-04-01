"use client"

import { useRef, useEffect, useState } from "react"
import { TransformControls } from "@react-three/drei"
import * as THREE from "three"
import { useSceneStore } from "@/store/scene-store"
import { useEditorStore } from "@/store/editor-store"
import { GridOverlay } from "./grid-overlay"
import { SceneObjectMesh } from "./scene-object"
import { TilePlacer } from "./tile-placer"
import type { Vec3 } from "@/lib/types"

function SelectedTransformControls() {
  const tool = useEditorStore((s) => s.tool)
  const mode = useEditorStore((s) => s.mode)
  const transformMode = useEditorStore((s) => s.transformMode)
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const objects = useSceneStore((s) => s.objects)
  const groupRef = useRef<THREE.Group>(null!)
  const [ready, setReady] = useState(false)

  const singleSelected =
    tool === "select" && mode === "object" && selectedIds.length === 1
      ? objects[selectedIds[0]]
      : null

  // Set ready after first mount so groupRef.current is available
  useEffect(() => {
    setReady(true)
  }, [])

  // Sync position when selection changes
  useEffect(() => {
    if (!singleSelected || !groupRef.current) return
    groupRef.current.position.set(...singleSelected.position)
    groupRef.current.rotation.set(...singleSelected.rotation)
    groupRef.current.scale.set(...singleSelected.scale)
  }, [singleSelected])

  if (!singleSelected) return <group ref={groupRef} />

  return (
    <>
      <group ref={groupRef} />
      {ready && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          onObjectChange={() => {
            if (!groupRef.current || !singleSelected) return
            const pos = groupRef.current.position
            const rot = groupRef.current.rotation
            const scl = groupRef.current.scale
            const { updateObjectPosition, updateObjectRotation, updateObjectScale } =
              useSceneStore.getState()
            updateObjectPosition(singleSelected.id, [pos.x, pos.y, pos.z] as Vec3)
            updateObjectRotation(singleSelected.id, [rot.x, rot.y, rot.z] as Vec3)
            updateObjectScale(singleSelected.id, [scl.x, scl.y, scl.z] as Vec3)
          }}
        />
      )}
    </>
  )
}

function SceneClickCatcher() {
  const tool = useEditorStore((s) => s.tool)
  const mode = useEditorStore((s) => s.mode)

  function handleClick() {
    const store = useSceneStore.getState()
    if (tool === "select" || mode !== "object") {
      store.clearSelection()
    }
    store.clearFaceSelection()
    store.clearVertexSelection()
    store.clearEdgeSelection()
  }

  return (
    <mesh
      position={[0, -0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export function Scene() {
  const objects = useSceneStore((s) => s.objects)
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const selectedSet = new Set(selectedIds)

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <GridOverlay />
      <TilePlacer />
      <SceneClickCatcher />
      {Object.values(objects).map((obj) => (
        <SceneObjectMesh
          key={obj.id}
          obj={obj}
          isSelected={selectedSet.has(obj.id)}
        />
      ))}
      <SelectedTransformControls />
    </>
  )
}

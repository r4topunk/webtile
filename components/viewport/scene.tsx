"use client"

import { useRef, useEffect } from "react"
import { useThree } from "@react-three/fiber"
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
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const objects = useSceneStore((s) => s.objects)
  const transformRef = useRef<THREE.Group>(null)

  const singleSelected =
    tool === "select" && selectedIds.length === 1
      ? objects[selectedIds[0]]
      : null

  // Sync transform controls position with the selected object
  useEffect(() => {
    if (!singleSelected || !transformRef.current) return
    transformRef.current.position.set(...singleSelected.position)
    transformRef.current.rotation.set(...singleSelected.rotation)
    transformRef.current.scale.set(...singleSelected.scale)
  }, [singleSelected])

  if (!singleSelected) return null

  return (
    <TransformControls
      object={transformRef.current ?? undefined}
      onObjectChange={() => {
        if (!transformRef.current || !singleSelected) return
        const pos = transformRef.current.position
        const rot = transformRef.current.rotation
        const scl = transformRef.current.scale
        const { updateObjectPosition, updateObjectRotation, updateObjectScale } =
          useSceneStore.getState()
        updateObjectPosition(singleSelected.id, [pos.x, pos.y, pos.z] as Vec3)
        updateObjectRotation(singleSelected.id, [rot.x, rot.y, rot.z] as Vec3)
        updateObjectScale(singleSelected.id, [scl.x, scl.y, scl.z] as Vec3)
      }}
    >
      <group ref={transformRef} />
    </TransformControls>
  )
}

function SceneClickCatcher() {
  const tool = useEditorStore((s) => s.tool)

  function handlePointerMissed() {
    if (tool !== "select") return
    useSceneStore.getState().clearSelection()
  }

  return (
    <mesh
      position={[0, -0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handlePointerMissed}
      visible={false}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial />
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

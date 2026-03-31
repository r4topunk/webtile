"use client"

import { useSceneStore } from "@/store/scene-store"
import { GridOverlay } from "./grid-overlay"
import { SceneObjectMesh } from "./scene-object"
import { TilePlacer } from "./tile-placer"

export function Scene() {
  const objects = useSceneStore((s) => s.objects)

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <GridOverlay />
      <TilePlacer />
      {Object.values(objects).map((obj) => (
        <SceneObjectMesh key={obj.id} obj={obj} />
      ))}
    </>
  )
}

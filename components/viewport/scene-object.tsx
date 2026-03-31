"use client"

import { useEffect, useMemo } from "react"
import * as THREE from "three"
import type { SceneObject } from "@/lib/types"
import { buildGeometryFromFaces } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"
import { useTilesetStore } from "@/store/tileset-store"

interface SceneObjectMeshProps {
  obj: SceneObject
}

export function SceneObjectMesh({ obj }: SceneObjectMeshProps) {
  const tilesets = useTilesetStore((s) => s.tilesets)

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

  if (!obj.visible) return null

  return (
    <group position={obj.position} rotation={obj.rotation} scale={obj.scale}>
      <mesh geometry={geometry}>
        {texture ? (
          <meshStandardMaterial map={texture} side={THREE.DoubleSide} transparent />
        ) : (
          <meshStandardMaterial color="#666" side={THREE.DoubleSide} />
        )}
      </mesh>
    </group>
  )
}

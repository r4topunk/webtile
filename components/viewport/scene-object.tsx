"use client"

import { useEffect, useMemo, useRef, useCallback } from "react"
import { ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import type { SceneObject } from "@/lib/types"
import { buildGeometryFromFaces } from "@/lib/geometry"
import { loadTilesetTexture } from "@/lib/texture-utils"
import { useTilesetStore } from "@/store/tileset-store"
import { useSceneStore } from "@/store/scene-store"
import { useEditorStore } from "@/store/editor-store"

interface SceneObjectMeshProps {
  obj: SceneObject
  isSelected: boolean
}

export function SceneObjectMesh({ obj, isSelected }: SceneObjectMeshProps) {
  const tilesets = useTilesetStore((s) => s.tilesets)
  const tool = useEditorStore((s) => s.tool)
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

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (tool !== "select") return
      e.stopPropagation()
      const { setSelection, toggleSelection } = useSceneStore.getState()
      if (e.nativeEvent.shiftKey) {
        toggleSelection(obj.id)
      } else {
        setSelection([obj.id])
      }
    },
    [tool, obj.id],
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
      {/* Selection wireframe overlay */}
      {isSelected && (
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
    </group>
  )
}

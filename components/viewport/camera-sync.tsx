"use client"

import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * R3F component that copies the main camera's quaternion to a shared ref
 * every frame, so the axis gizmo can read it.
 */
export function CameraSync({
  quaternionRef,
}: {
  quaternionRef: React.MutableRefObject<THREE.Quaternion>
}) {
  const { camera } = useThree()

  useFrame(() => {
    quaternionRef.current.copy(camera.quaternion)
  })

  return null
}

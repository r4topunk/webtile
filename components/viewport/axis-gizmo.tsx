"use client"

import { useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * Syncs this mini-camera's rotation with the main viewport camera.
 * The main camera's quaternion is passed via a shared ref.
 */
function GizmoScene({ quaternionRef }: { quaternionRef: React.RefObject<THREE.Quaternion> }) {
  const { camera } = useThree()

  useFrame(() => {
    if (!quaternionRef.current) return
    // Position camera at a fixed distance, looking at origin,
    // but matching the main camera's rotation
    const offset = new THREE.Vector3(0, 0, 3)
    offset.applyQuaternion(quaternionRef.current)
    camera.position.copy(offset)
    camera.lookAt(0, 0, 0)
  })

  const axisLength = 0.8
  const headLength = 0.2
  const headWidth = 0.08
  const labelOffset = 1.05

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 2]} intensity={0.5} />

      {/* X axis — Red */}
      <arrowHelper args={[
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        axisLength, 0xff4444, headLength, headWidth,
      ]} />
      <sprite position={[labelOffset, 0, 0]} scale={[0.3, 0.3, 1]}>
        <spriteMaterial map={makeTextTexture("X", "#ff4444")} depthTest={false} />
      </sprite>

      {/* Y axis — Green */}
      <arrowHelper args={[
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        axisLength, 0x44cc44, headLength, headWidth,
      ]} />
      <sprite position={[0, labelOffset, 0]} scale={[0.3, 0.3, 1]}>
        <spriteMaterial map={makeTextTexture("Y", "#44cc44")} depthTest={false} />
      </sprite>

      {/* Z axis — Blue */}
      <arrowHelper args={[
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        axisLength, 0x4488ff, headLength, headWidth,
      ]} />
      <sprite position={[0, 0, labelOffset]} scale={[0.3, 0.3, 1]}>
        <spriteMaterial map={makeTextTexture("Z", "#4488ff")} depthTest={false} />
      </sprite>

      {/* Center dot */}
      <mesh>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#888" />
      </mesh>
    </>
  )
}

/** Create a tiny canvas texture with a text label */
function makeTextTexture(text: string, color: string): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = color
  ctx.font = "bold 40px monospace"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, size / 2, size / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Mini axis indicator overlay. Placed in the bottom-left corner of the viewport.
 * Reads the main camera's quaternion via a shared ref to stay in sync.
 */
export function AxisGizmo({ quaternionRef }: { quaternionRef: React.RefObject<THREE.Quaternion> }) {
  return (
    <div
      className="pointer-events-none absolute bottom-2 left-2 overflow-hidden rounded"
      style={{ width: 80, height: 80 }}
    >
      <Canvas
        orthographic
        camera={{ zoom: 40, position: [0, 0, 3], near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <GizmoScene quaternionRef={quaternionRef} />
      </Canvas>
    </div>
  )
}

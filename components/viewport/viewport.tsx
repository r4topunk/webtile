"use client"

import { useRef, useEffect, useCallback } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { useEditorStore } from "@/store/editor-store"
import type { CameraPreset } from "@/store/editor-store"
import { Scene } from "./scene"
import { AnimationPlayer } from "@/components/animation/animation-player"

const CAMERA_PRESETS: Record<
  Exclude<CameraPreset, null>,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: { position: [0, 0, 20], target: [0, 0, 0] },
  top: { position: [0, 20, 0], target: [0, 0, 0] },
  right: { position: [20, 0, 0], target: [0, 0, 0] },
}

function CameraPresetAnimator() {
  const animatingRef = useRef(false)
  const startPosRef = useRef(new THREE.Vector3())
  const endPosRef = useRef(new THREE.Vector3())
  const startTargetRef = useRef(new THREE.Vector3())
  const endTargetRef = useRef(new THREE.Vector3())
  const progressRef = useRef(0)
  const lastPresetRef = useRef<CameraPreset>(null)

  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3
    update: () => void
  } | null

  useFrame((_, delta) => {
    const preset = useEditorStore.getState().cameraPreset

    if (preset && preset !== lastPresetRef.current && controls) {
      const p = CAMERA_PRESETS[preset]
      startPosRef.current.copy(camera.position)
      endPosRef.current.set(p.position[0], p.position[1], p.position[2])
      startTargetRef.current.copy(controls.target)
      endTargetRef.current.set(p.target[0], p.target[1], p.target[2])
      progressRef.current = 0
      animatingRef.current = true
      lastPresetRef.current = preset
      useEditorStore.getState().setCameraPreset(null)
    }

    if (!animatingRef.current || !controls) return

    progressRef.current = Math.min(1, progressRef.current + delta / 0.3)
    const t = progressRef.current
    const ease = t * t * (3 - 2 * t)

    camera.position.lerpVectors(startPosRef.current, endPosRef.current, ease)
    controls.target.lerpVectors(startTargetRef.current, endTargetRef.current, ease)
    controls.update()

    if (t >= 1) {
      animatingRef.current = false
      lastPresetRef.current = null
    }
  })

  return null
}

/**
 * Custom trackpad handler for macOS-friendly navigation.
 *
 * macOS trackpad gestures in browsers:
 * - Two-finger scroll → wheel event (deltaX, deltaY)        → PAN
 * - Pinch to zoom     → wheel event with ctrlKey: true       → ZOOM
 * - Shift + scroll    → already handled by keyboard shortcuts → PLANE OFFSET
 *
 * We disable OrbitControls' built-in zoom-via-scroll and handle it ourselves
 * so that regular scroll = pan and pinch = zoom.
 */
function TrackpadHandler() {
  const { camera, gl } = useThree()
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3
    update: () => void
  } | null

  const panRight = useRef(new THREE.Vector3())
  const panUp = useRef(new THREE.Vector3())

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Shift+scroll is handled by keyboard shortcuts (plane offset)
      if (e.shiftKey) return

      e.preventDefault()

      if (!controls) return

      // Pinch gesture (ctrlKey on macOS) or actual Ctrl+scroll → ZOOM
      if (e.ctrlKey) {
        const zoomSpeed = 0.01
        if (camera instanceof THREE.OrthographicCamera) {
          camera.zoom *= 1 - e.deltaY * zoomSpeed
          camera.zoom = Math.max(1, Math.min(500, camera.zoom))
          camera.updateProjectionMatrix()
        } else {
          // Perspective: dolly in/out
          const direction = new THREE.Vector3()
          camera.getWorldDirection(direction)
          camera.position.addScaledVector(direction, -e.deltaY * zoomSpeed * 2)
        }
        controls.update()
        return
      }

      // Regular two-finger scroll → PAN
      const panSpeed = camera instanceof THREE.OrthographicCamera
        ? 1 / camera.zoom
        : 0.05

      // Pan right (X axis of camera)
      panRight.current.setFromMatrixColumn(camera.matrix, 0)
      panRight.current.multiplyScalar(-e.deltaX * panSpeed)

      // Pan up (Y axis of camera)
      panUp.current.setFromMatrixColumn(camera.matrix, 1)
      panUp.current.multiplyScalar(e.deltaY * panSpeed)

      camera.position.add(panRight.current)
      camera.position.add(panUp.current)
      controls.target.add(panRight.current)
      controls.target.add(panUp.current)
      controls.update()
    },
    [camera, controls],
  )

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [gl, handleWheel])

  return null
}

export function Viewport() {
  const cameraType = useEditorStore((s) => s.cameraType)

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-900">
      <Canvas
        style={{ position: "absolute", inset: 0 }}
        orthographic={cameraType === "orthographic"}
        camera={
          cameraType === "orthographic"
            ? { zoom: 50, position: [10, 10, 10], near: -1000, far: 1000 }
            : { fov: 60, position: [10, 10, 10], near: 0.1, far: 1000 }
        }
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#1a1a1a")
        }}
      >
        <OrbitControls
          makeDefault
          enableDamping={false}
          enableRotate
          enablePan={false}
          enableZoom={false}
          mouseButtons={{
            LEFT: undefined as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
        <TrackpadHandler />
        <Scene />
        <AnimationPlayer />
        <CameraPresetAnimator />
      </Canvas>
    </div>
  )
}

"use client"

import { useRef, useEffect, useMemo } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useEditorStore } from "@/store/editor-store"
import type { PlacementPlane } from "@/lib/types"

// We use THREE.Line via <primitive> to avoid SVG <line> type conflict

const PLANE_CONFIGS: Record<
  PlacementPlane,
  {
    rotation: [number, number, number]
    color: string
  }
> = {
  xz: { rotation: [-Math.PI / 2, 0, 0], color: "#22c55e" },   // green (Y normal)
  xy: { rotation: [0, 0, 0], color: "#3b82f6" },               // blue
  yz: { rotation: [0, Math.PI / 2, 0], color: "#ef4444" },     // red
}

const PLANE_OFFSETS: Record<PlacementPlane, (offset: number) => [number, number, number]> = {
  xz: (o) => [0, o, 0],
  xy: (o) => [0, 0, o],
  yz: (o) => [o, 0, 0],
}

function PlacementPlaneOverlay() {
  const tool = useEditorStore((s) => s.tool)
  const plane = useEditorStore((s) => s.placementPlane)
  const offset = useEditorStore((s) => s.placementOffset)

  if (tool !== "place") return null

  const config = PLANE_CONFIGS[plane]
  const position = PLANE_OFFSETS[plane](offset)

  return (
    <mesh position={position} rotation={config.rotation} renderOrder={-1}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial
        color={config.color}
        transparent
        opacity={0.04}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function AxisConstraintLine({
  axis,
  color,
  origin,
}: {
  axis: "x" | "y" | "z"
  color: string
  origin: [number, number, number]
}) {
  const lineObj = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.LineBasicMaterial({ color, depthTest: false })
    const line = new THREE.Line(geometry, material)
    line.renderOrder = 999
    return line
  }, [color])

  useEffect(() => {
    const dir: [number, number, number] = [0, 0, 0]
    const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2
    dir[idx] = 20
    const positions = new Float32Array([
      origin[0] - dir[0], origin[1] - dir[1], origin[2] - dir[2],
      origin[0] + dir[0], origin[1] + dir[1], origin[2] + dir[2],
    ])
    lineObj.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  }, [axis, origin, lineObj])

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose()
      ;(lineObj.material as THREE.LineBasicMaterial).dispose()
    }
  }, [lineObj])

  return <primitive object={lineObj} />
}

function AxisConstraintOverlay() {
  const keysRef = useRef<Set<string>>(new Set())
  const forceUpdateRef = useRef(0)
  const originRef = useRef<[number, number, number]>([0, 0, 0])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      if (key === "x" || key === "y" || key === "z") {
        keysRef.current.add(key)
        forceUpdateRef.current++
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      keysRef.current.delete(key)
      forceUpdateRef.current++
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Use frame to check keys reactively
  const activeRef = useRef<Set<string>>(new Set())

  useFrame(() => {
    const prev = activeRef.current
    const next = keysRef.current
    // Only trigger re-render if changed
    if (prev.size !== next.size || ![...prev].every((k) => next.has(k))) {
      activeRef.current = new Set(next)
    }
  })

  const mode = useEditorStore((s) => s.mode)
  if (mode !== "vertex") return null

  const origin = originRef.current

  return (
    <>
      {activeRef.current.has("x") && (
        <AxisConstraintLine axis="x" color="#ef4444" origin={origin} />
      )}
      {activeRef.current.has("y") && (
        <AxisConstraintLine axis="y" color="#22c55e" origin={origin} />
      )}
      {activeRef.current.has("z") && (
        <AxisConstraintLine axis="z" color="#3b82f6" origin={origin} />
      )}
    </>
  )
}

export function ViewportOverlays() {
  return (
    <>
      <PlacementPlaneOverlay />
      <AxisConstraintOverlay />
    </>
  )
}

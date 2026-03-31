"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useEditorStore } from "@/store/editor-store"
import type { PlacementPlane } from "@/lib/types"

/**
 * 3D grid that follows the active placement plane and offset.
 * Shows a primary grid on the active plane + subtle reference grids
 * on the other two planes (origin only).
 */
export function GridOverlay() {
  const showGrid = useEditorStore((s) => s.showGrid)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const placementOffset = useEditorStore((s) => s.placementOffset)

  if (!showGrid) return null

  return (
    <>
      {/* Active placement grid — bright, follows offset */}
      <PlaneGrid
        plane={placementPlane}
        offset={placementOffset}
        size={20}
        color="#555"
        sectionColor="#888"
        opacity={0.8}
      />

      {/* Reference grids on the other two planes at origin — subtle */}
      {placementPlane !== "xz" && (
        <PlaneGrid plane="xz" offset={0} size={20} color="#333" sectionColor="#444" opacity={0.3} />
      )}
      {placementPlane !== "xy" && (
        <PlaneGrid plane="xy" offset={0} size={20} color="#333" sectionColor="#444" opacity={0.3} />
      )}
      {placementPlane !== "yz" && (
        <PlaneGrid plane="yz" offset={0} size={20} color="#333" sectionColor="#444" opacity={0.3} />
      )}

      {/* 3D crosshair axes */}
      <AxisCrosshair />
    </>
  )
}

/**
 * A grid of lines on a specific plane at a given offset.
 */
function PlaneGrid({
  plane,
  offset,
  size,
  color,
  sectionColor,
  opacity,
}: {
  plane: PlacementPlane
  offset: number
  size: number
  color: string
  sectionColor: string
  opacity: number
}) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const half = size / 2

    for (let i = -half; i <= half; i++) {
      const isSection = i % 5 === 0
      // We'll use separate geometries for section vs cell lines below
      // For now, all lines in one geometry — section lines just use sectionColor

      switch (plane) {
        case "xz":
          // Lines along X
          points.push(new THREE.Vector3(-half, offset, i))
          points.push(new THREE.Vector3(half, offset, i))
          // Lines along Z
          points.push(new THREE.Vector3(i, offset, -half))
          points.push(new THREE.Vector3(i, offset, half))
          break
        case "xy":
          // Lines along X
          points.push(new THREE.Vector3(-half, i, offset))
          points.push(new THREE.Vector3(half, i, offset))
          // Lines along Y
          points.push(new THREE.Vector3(i, -half, offset))
          points.push(new THREE.Vector3(i, half, offset))
          break
        case "yz":
          // Lines along Y
          points.push(new THREE.Vector3(offset, -half, i))
          points.push(new THREE.Vector3(offset, half, i))
          // Lines along Z
          points.push(new THREE.Vector3(offset, i, -half))
          points.push(new THREE.Vector3(offset, i, half))
          break
      }
    }

    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(points.length * 3)
    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x
      positions[i * 3 + 1] = points[i].y
      positions[i * 3 + 2] = points[i].z
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geo
  }, [plane, offset, size])

  // Section lines (every 5 units) — separate geometry for different color
  const sectionGeometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const half = size / 2

    for (let i = -half; i <= half; i += 5) {
      switch (plane) {
        case "xz":
          points.push(new THREE.Vector3(-half, offset, i))
          points.push(new THREE.Vector3(half, offset, i))
          points.push(new THREE.Vector3(i, offset, -half))
          points.push(new THREE.Vector3(i, offset, half))
          break
        case "xy":
          points.push(new THREE.Vector3(-half, i, offset))
          points.push(new THREE.Vector3(half, i, offset))
          points.push(new THREE.Vector3(i, -half, offset))
          points.push(new THREE.Vector3(i, half, offset))
          break
        case "yz":
          points.push(new THREE.Vector3(offset, -half, i))
          points.push(new THREE.Vector3(offset, half, i))
          points.push(new THREE.Vector3(offset, i, -half))
          points.push(new THREE.Vector3(offset, i, half))
          break
      }
    }

    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(points.length * 3)
    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x
      positions[i * 3 + 1] = points[i].y
      positions[i * 3 + 2] = points[i].z
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geo
  }, [plane, offset, size])

  return (
    <>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={opacity * 0.5} />
      </lineSegments>
      <lineSegments geometry={sectionGeometry}>
        <lineBasicMaterial color={sectionColor} transparent opacity={opacity} />
      </lineSegments>
    </>
  )
}

/**
 * RGB axis crosshair lines at the origin.
 * Red = X, Green = Y, Blue = Z
 */
function AxisCrosshair() {
  const geometry = useMemo(() => {
    const len = 50

    // X axis (red)
    const xGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-len, 0, 0),
      new THREE.Vector3(len, 0, 0),
    ])
    // Y axis (green)
    const yGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -len, 0),
      new THREE.Vector3(0, len, 0),
    ])
    // Z axis (blue)
    const zGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -len),
      new THREE.Vector3(0, 0, len),
    ])

    return { xGeo, yGeo, zGeo }
  }, [])

  return (
    <>
      <lineSegments geometry={geometry.xGeo}>
        <lineBasicMaterial color="#cc3333" transparent opacity={0.5} />
      </lineSegments>
      <lineSegments geometry={geometry.yGeo}>
        <lineBasicMaterial color="#33cc33" transparent opacity={0.5} />
      </lineSegments>
      <lineSegments geometry={geometry.zGeo}>
        <lineBasicMaterial color="#3333cc" transparent opacity={0.5} />
      </lineSegments>
    </>
  )
}

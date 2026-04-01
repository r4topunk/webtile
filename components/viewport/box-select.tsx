"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"

interface BoxRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

/**
 * R3F component that performs the actual selection logic using the camera.
 * Listens for a custom event dispatched by the HTML overlay.
 */
export function BoxSelectProjector() {
  const { camera } = useThree()

  useEffect(() => {
    function handleBoxSelect(e: Event) {
      const detail = (e as CustomEvent).detail as {
        rect: { left: number; top: number; right: number; bottom: number }
        containerRect: DOMRect
      }
      const { rect, containerRect } = detail
      const mode = useEditorStore.getState().mode
      const scene = useSceneStore.getState()

      // Normalize rect to NDC (-1 to 1)
      const ndcLeft = ((rect.left - containerRect.left) / containerRect.width) * 2 - 1
      const ndcRight = ((rect.right - containerRect.left) / containerRect.width) * 2 - 1
      const ndcTop = -(((rect.top - containerRect.top) / containerRect.height) * 2 - 1)
      const ndcBottom = -(((rect.bottom - containerRect.top) / containerRect.height) * 2 - 1)

      const minX = Math.min(ndcLeft, ndcRight)
      const maxX = Math.max(ndcLeft, ndcRight)
      const minY = Math.min(ndcTop, ndcBottom)
      const maxY = Math.max(ndcTop, ndcBottom)

      if (mode === "object") {
        const selected: string[] = []
        for (const obj of Object.values(scene.objects)) {
          if (!obj.visible || obj.locked) continue
          const pos = new THREE.Vector3(...obj.position)
          pos.project(camera)
          if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
            selected.push(obj.id)
          }
        }
        scene.setSelection(selected)
      } else if (mode === "face") {
        if (scene.selectedIds.length !== 1) return
        const obj = scene.objects[scene.selectedIds[0]]
        if (!obj) return
        const selected: string[] = []
        for (const face of obj.faces) {
          // Compute face center
          const center = new THREE.Vector3(
            (face.vertices[0][0] + face.vertices[1][0] + face.vertices[2][0] + face.vertices[3][0]) / 4 + obj.position[0],
            (face.vertices[0][1] + face.vertices[1][1] + face.vertices[2][1] + face.vertices[3][1]) / 4 + obj.position[1],
            (face.vertices[0][2] + face.vertices[1][2] + face.vertices[2][2] + face.vertices[3][2]) / 4 + obj.position[2],
          )
          center.project(camera)
          if (center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY) {
            selected.push(face.id)
          }
        }
        scene.setSelectedFaces(selected)
      } else if (mode === "vertex") {
        if (scene.selectedIds.length !== 1) return
        const obj = scene.objects[scene.selectedIds[0]]
        if (!obj) return
        const selected: number[] = []
        let vi = 0
        for (const face of obj.faces) {
          for (let v = 0; v < 4; v++) {
            const pos = new THREE.Vector3(
              face.vertices[v][0] + obj.position[0],
              face.vertices[v][1] + obj.position[1],
              face.vertices[v][2] + obj.position[2],
            )
            pos.project(camera)
            if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
              selected.push(vi)
            }
            vi++
          }
        }
        scene.setSelectedVertices(selected)
      }
    }

    window.addEventListener("viewport-box-select", handleBoxSelect)
    return () => window.removeEventListener("viewport-box-select", handleBoxSelect)
  }, [camera])

  return null
}

/**
 * HTML overlay that draws the selection rectangle and dispatches box-select events.
 */
export function BoxSelectOverlay({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [rect, setRect] = useState<BoxRect | null>(null)
  const dragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!e.shiftKey || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const container = containerRef.current
      if (!container) return
      const cr = container.getBoundingClientRect()
      const x = e.clientX - cr.left
      const y = e.clientY - cr.top
      startPos.current = { x, y }
      dragging.current = true
      setRect({ startX: x, startY: y, endX: x, endY: y })
    },
    [containerRef],
  )

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      const container = containerRef.current
      if (!container) return
      const cr = container.getBoundingClientRect()
      const x = e.clientX - cr.left
      const y = e.clientY - cr.top
      setRect((prev) =>
        prev ? { ...prev, endX: x, endY: y } : null,
      )
    }

    function handleMouseUp(e: MouseEvent) {
      if (!dragging.current || !rect) return
      dragging.current = false
      const container = containerRef.current
      if (!container) {
        setRect(null)
        return
      }

      const cr = container.getBoundingClientRect()
      const finalRect = {
        left: Math.min(startPos.current.x, e.clientX - cr.left) + cr.left,
        top: Math.min(startPos.current.y, e.clientY - cr.top) + cr.top,
        right: Math.max(startPos.current.x, e.clientX - cr.left) + cr.left,
        bottom: Math.max(startPos.current.y, e.clientY - cr.top) + cr.top,
      }

      window.dispatchEvent(
        new CustomEvent("viewport-box-select", {
          detail: { rect: finalRect, containerRect: cr },
        }),
      )

      setRect(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [containerRef, rect])

  if (!rect) {
    return (
      <div
        className="absolute inset-0 z-20"
        style={{ pointerEvents: "none" }}
        onMouseDown={handleMouseDown}
        // Need pointer-events on to catch shift+click
        onMouseDownCapture={(e) => {
          if (e.shiftKey && e.button === 0) {
            // Re-enable pointer events for this element during box select
            const el = e.currentTarget as HTMLDivElement
            el.style.pointerEvents = "auto"
          }
        }}
      />
    )
  }

  const left = Math.min(rect.startX, rect.endX)
  const top = Math.min(rect.startY, rect.endY)
  const width = Math.abs(rect.endX - rect.startX)
  const height = Math.abs(rect.endY - rect.startY)

  return (
    <div
      className="absolute inset-0 z-20"
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute border border-dashed border-white/50 bg-white/5 pointer-events-none"
        style={{ left, top, width, height }}
      />
    </div>
  )
}

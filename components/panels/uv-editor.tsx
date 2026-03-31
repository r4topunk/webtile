"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"
import { computeTileUVs } from "@/lib/geometry"
import type { SceneFace, Vec2 } from "@/lib/types"

const HANDLE_RADIUS = 5
const CANVAS_PADDING = 8

type DragState = {
  cornerIndex: number
  startMouseX: number
  startMouseY: number
  startUV: Vec2
} | null

/**
 * Find the selected face from the store. Returns the object id, face, and
 * the tileset associated with that face (via its tileRef or the active tileset).
 */
function useSelectedFace() {
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const selectedFaceIds = useSceneStore((s) => s.selectedFaceIds)
  const objects = useSceneStore((s) => s.objects)
  const tilesets = useTilesetStore((s) => s.tilesets)
  const activeTilesetId = useTilesetStore((s) => s.activeTilesetId)

  return useMemo(() => {
    // Need exactly one selected object and at least one selected face
    if (selectedIds.length !== 1 || selectedFaceIds.length === 0) return null

    const obj = objects[selectedIds[0]]
    if (!obj) return null

    const face = obj.faces.find((f) => f.id === selectedFaceIds[0])
    if (!face) return null

    const tilesetId = face.tileRef?.tilesetId ?? activeTilesetId
    const tileset = tilesetId ? tilesets[tilesetId] : null

    return { objectId: obj.id, face, tileset }
  }, [selectedIds, selectedFaceIds, objects, tilesets, activeTilesetId])
}

export function UVEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 256, h: 256 })
  const [dragState, setDragState] = useState<DragState>(null)

  const selected = useSelectedFace()
  const updateFaceUVs = useSceneStore((s) => s.updateFaceUVs)

  // UV offset/rotation controls
  const [uvOffsetU, setUvOffsetU] = useState(0)
  const [uvOffsetV, setUvOffsetV] = useState(0)
  const [uvRotation, setUvRotation] = useState(0)

  // Load tileset image
  useEffect(() => {
    if (!selected?.tileset) {
      imageRef.current = null
      return
    }
    const img = new Image()
    img.src = selected.tileset.imageUrl
    img.onload = () => {
      imageRef.current = img
      drawCanvas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.tileset?.imageUrl])

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width } = entry.contentRect
      // Keep square-ish
      const s = Math.max(128, Math.floor(width - CANVAS_PADDING * 2))
      setCanvasSize({ w: s, h: s })
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const { w, h } = canvasSize
    ctx.clearRect(0, 0, w, h)

    // Draw checkerboard background
    const checkSize = 8
    for (let y = 0; y < h; y += checkSize) {
      for (let x = 0; x < w; x += checkSize) {
        const dark = ((x / checkSize) + (y / checkSize)) % 2 === 0
        ctx.fillStyle = dark ? "#1a1a2e" : "#16213e"
        ctx.fillRect(x, y, checkSize, checkSize)
      }
    }

    // Draw tileset image
    const img = imageRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.globalAlpha = 0.6
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, w, h)
      ctx.globalAlpha = 1.0
    }

    // Draw grid lines for tile boundaries
    if (selected?.tileset) {
      const { columns, rows } = selected.tileset
      ctx.strokeStyle = "rgba(255,255,255,0.15)"
      ctx.lineWidth = 0.5
      for (let c = 1; c < columns; c++) {
        const x = (c / columns) * w
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let r = 1; r < rows; r++) {
        const y = (r / rows) * h
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
    }

    // Draw UV quad
    if (!selected?.face) return
    const uvs = selected.face.uvs

    // Convert UV to canvas coords: u -> x, v -> y (v=1 is top, so y = h*(1-v))
    const toCanvas = (uv: Vec2): [number, number] => [
      uv[0] * w,
      (1 - uv[1]) * h,
    ]

    const corners = uvs.map(toCanvas)

    // Fill
    ctx.fillStyle = "rgba(59, 130, 246, 0.15)"
    ctx.beginPath()
    ctx.moveTo(corners[0][0], corners[0][1])
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(corners[i][0], corners[i][1])
    }
    ctx.closePath()
    ctx.fill()

    // Outline
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(corners[0][0], corners[0][1])
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(corners[i][0], corners[i][1])
    }
    ctx.closePath()
    ctx.stroke()

    // Handles
    const handleColors = ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b"]
    corners.forEach(([cx, cy], i) => {
      ctx.fillStyle = handleColors[i]
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, HANDLE_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
  }, [canvasSize, selected])

  // Redraw on state changes
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Convert canvas pixel coords to UV
  const canvasToUV = useCallback(
    (px: number, py: number): Vec2 => {
      const { w, h } = canvasSize
      return [px / w, 1 - py / h]
    },
    [canvasSize],
  )

  // Find corner under cursor
  const hitTestCorner = useCallback(
    (px: number, py: number): number | null => {
      if (!selected?.face) return null
      const { w, h } = canvasSize
      const uvs = selected.face.uvs

      for (let i = 0; i < 4; i++) {
        const cx = uvs[i][0] * w
        const cy = (1 - uvs[i][1]) * h
        const dx = px - cx
        const dy = py - cy
        if (dx * dx + dy * dy <= (HANDLE_RADIUS + 3) * (HANDLE_RADIUS + 3)) {
          return i
        }
      }
      return null
    },
    [canvasSize, selected],
  )

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
      const canvas = canvasRef.current
      if (!canvas) return [0, 0]
      const rect = canvas.getBoundingClientRect()
      return [e.clientX - rect.left, e.clientY - rect.top]
    },
    [],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!selected) return
      const [px, py] = getCanvasCoords(e)
      const corner = hitTestCorner(px, py)
      if (corner !== null) {
        setDragState({
          cornerIndex: corner,
          startMouseX: px,
          startMouseY: py,
          startUV: [...selected.face.uvs[corner]] as Vec2,
        })
        e.preventDefault()
      }
    },
    [selected, getCanvasCoords, hitTestCorner],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragState || !selected) return
      const [px, py] = getCanvasCoords(e)
      const uv = canvasToUV(px, py)

      // Clamp to 0-1
      const clampedUV: Vec2 = [
        Math.max(0, Math.min(1, uv[0])),
        Math.max(0, Math.min(1, uv[1])),
      ]

      const newUVs = selected.face.uvs.map((u) => [...u]) as [Vec2, Vec2, Vec2, Vec2]
      newUVs[dragState.cornerIndex] = clampedUV

      updateFaceUVs(selected.objectId, selected.face.id, newUVs)
    },
    [dragState, selected, getCanvasCoords, canvasToUV, updateFaceUVs],
  )

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  // Auto-fit: snap UVs to nearest tile boundary
  const handleAutoFit = useCallback(() => {
    if (!selected?.face || !selected.tileset) return
    const { tileRef } = selected.face
    if (!tileRef) return

    const { columns, rows } = selected.tileset
    const newUVs = computeTileUVs(tileRef, columns, rows)
    updateFaceUVs(selected.objectId, selected.face.id, newUVs)
  }, [selected, updateFaceUVs])

  // Apply UV offset
  const handleApplyOffset = useCallback(() => {
    if (!selected?.face) return
    const uvs = selected.face.uvs
    const newUVs = uvs.map(
      ([u, v]) => [u + uvOffsetU, v + uvOffsetV] as Vec2,
    ) as [Vec2, Vec2, Vec2, Vec2]
    updateFaceUVs(selected.objectId, selected.face.id, newUVs)
    setUvOffsetU(0)
    setUvOffsetV(0)
  }, [selected, uvOffsetU, uvOffsetV, updateFaceUVs])

  // Apply UV rotation around center
  const handleApplyRotation = useCallback(() => {
    if (!selected?.face) return
    const uvs = selected.face.uvs

    // Find center of UV quad
    let cx = 0
    let cy = 0
    for (const [u, v] of uvs) {
      cx += u
      cy += v
    }
    cx /= 4
    cy /= 4

    const angle = (uvRotation * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const newUVs = uvs.map(([u, v]) => {
      const du = u - cx
      const dv = v - cy
      return [cx + du * cos - dv * sin, cy + du * sin + dv * cos] as Vec2
    }) as [Vec2, Vec2, Vec2, Vec2]

    updateFaceUVs(selected.objectId, selected.face.id, newUVs)
    setUvRotation(0)
  }, [selected, uvRotation, updateFaceUVs])

  if (!selected) {
    return (
      <div className="flex h-full flex-col">
        <div className="px-2 py-1.5 text-xs font-semibold">UV Editor</div>
        <Separator />
        <div className="flex flex-1 items-center justify-center p-4 text-xs text-muted-foreground">
          Select a face in face mode to edit UVs
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-2 py-1.5 text-xs font-semibold">UV Editor</div>
      <Separator />

      <div ref={containerRef} className="flex-1 overflow-auto p-2">
        {/* UV Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="cursor-crosshair rounded border border-border"
          style={{ width: canvasSize.w, height: canvasSize.h, imageRendering: "pixelated" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* UV corner readout */}
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
          {selected.face.uvs.map((uv, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b"][i],
                }}
              />
              <span>
                {uv[0].toFixed(3)}, {uv[1].toFixed(3)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Auto-fit */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleAutoFit}
          disabled={!selected.face.tileRef}
        >
          Auto-fit to tile
        </Button>

        <Separator className="my-2" />

        {/* UV Offset */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">
            UV Offset
          </label>
          <div className="flex items-center gap-1">
            <span className="w-3 text-[10px] text-muted-foreground">U</span>
            <Input
              type="number"
              step={0.01}
              value={uvOffsetU}
              onChange={(e) => setUvOffsetU(parseFloat(e.target.value) || 0)}
              className="h-6 flex-1 px-1 text-xs"
            />
            <span className="w-3 text-[10px] text-muted-foreground">V</span>
            <Input
              type="number"
              step={0.01}
              value={uvOffsetV}
              onChange={(e) => setUvOffsetV(parseFloat(e.target.value) || 0)}
              className="h-6 flex-1 px-1 text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={handleApplyOffset}
            >
              Apply
            </Button>
          </div>
        </div>

        <Separator className="my-2" />

        {/* UV Rotation */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">
            UV Rotation
          </label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step={15}
              value={uvRotation}
              onChange={(e) => setUvRotation(parseFloat(e.target.value) || 0)}
              className="h-6 flex-1 px-1 text-xs"
              placeholder="degrees"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={handleApplyRotation}
            >
              Rotate
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

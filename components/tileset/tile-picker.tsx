"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useTilesetStore } from "@/store/tileset-store"
import type { Tileset, TileRef } from "@/lib/types"

export function TilePicker() {
  const tilesets = useTilesetStore((s) => s.tilesets)
  const activeTilesetId = useTilesetStore((s) => s.activeTilesetId)
  const selectedTile = useTilesetStore((s) => s.selectedTile)
  const setSelectedTile = useTilesetStore((s) => s.setSelectedTile)

  const activeTileset = activeTilesetId ? tilesets[activeTilesetId] : null

  if (!activeTileset) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-xs text-muted-foreground">
        Load a tileset to start
      </div>
    )
  }

  return (
    <TileGrid
      tileset={activeTileset}
      selectedTile={selectedTile}
      onSelect={(ref) => setSelectedTile(ref)}
    />
  )
}

function TileGrid({
  tileset,
  selectedTile,
  onSelect,
}: {
  tileset: Tileset
  selectedTile: TileRef | null
  onSelect: (ref: TileRef) => void
}) {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const tiles = useMemo(() => {
    const result: { x: number; y: number }[] = []
    for (let row = 0; row < tileset.rows; row++) {
      for (let col = 0; col < tileset.columns; col++) {
        result.push({ x: col, y: row })
      }
    }
    return result
  }, [tileset.columns, tileset.rows])

  // Scale for display
  const displayTileSize = Math.max(16, Math.min(32, 200 / tileset.columns))

  // Compute the current drag selection region (normalized so x/y is top-left)
  const dragRegion = useMemo(() => {
    if (!dragStart) return null
    const end = dragEnd ?? dragStart
    const x = Math.min(dragStart.x, end.x)
    const y = Math.min(dragStart.y, end.y)
    const x2 = Math.max(dragStart.x, end.x)
    const y2 = Math.max(dragStart.y, end.y)
    return { x, y, w: x2 - x + 1, h: y2 - y + 1 }
  }, [dragStart, dragEnd])

  const getTileFromEvent = useCallback(
    (e: React.MouseEvent): { x: number; y: number } | null => {
      const container = containerRef.current
      if (!container) return null
      const rect = container.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const col = Math.floor(px / displayTileSize)
      const row = Math.floor(py / displayTileSize)
      if (col < 0 || col >= tileset.columns || row < 0 || row >= tileset.rows) return null
      return { x: col, y: row }
    },
    [displayTileSize, tileset.columns, tileset.rows],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const tile = getTileFromEvent(e)
      if (!tile) return
      setDragStart(tile)
      setDragEnd(tile)
      e.preventDefault()
    },
    [getTileFromEvent],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragStart) return
      const tile = getTileFromEvent(e)
      if (tile) setDragEnd(tile)
    },
    [dragStart, getTileFromEvent],
  )

  const handleMouseUp = useCallback(() => {
    if (!dragStart) return
    const end = dragEnd ?? dragStart
    const x = Math.min(dragStart.x, end.x)
    const y = Math.min(dragStart.y, end.y)
    const x2 = Math.max(dragStart.x, end.x)
    const y2 = Math.max(dragStart.y, end.y)

    onSelect({
      tilesetId: tileset.id,
      x,
      y,
      w: x2 - x + 1,
      h: y2 - y + 1,
    })

    setDragStart(null)
    setDragEnd(null)
  }, [dragStart, dragEnd, tileset.id, onSelect])

  // Check if a tile is within the current selection (either committed or dragging)
  const isTileInSelection = useCallback(
    (tx: number, ty: number): boolean => {
      // Check drag region first
      if (dragRegion) {
        return (
          tx >= dragRegion.x &&
          tx < dragRegion.x + dragRegion.w &&
          ty >= dragRegion.y &&
          ty < dragRegion.y + dragRegion.h
        )
      }
      // Check committed selection
      if (
        selectedTile &&
        selectedTile.tilesetId === tileset.id
      ) {
        return (
          tx >= selectedTile.x &&
          tx < selectedTile.x + selectedTile.w &&
          ty >= selectedTile.y &&
          ty < selectedTile.y + selectedTile.h
        )
      }
      return false
    },
    [dragRegion, selectedTile, tileset.id],
  )

  return (
    <div className="relative overflow-auto p-2">
      {/* Selection info */}
      {selectedTile && selectedTile.tilesetId === tileset.id && (selectedTile.w > 1 || selectedTile.h > 1) && (
        <div className="mb-1 text-[10px] text-muted-foreground">
          Selection: {selectedTile.w}x{selectedTile.h} ({selectedTile.w * selectedTile.h} tiles)
        </div>
      )}

      <div
        ref={containerRef}
        className="relative select-none"
        style={{
          width: tileset.columns * displayTileSize,
          height: tileset.rows * displayTileSize,
          backgroundImage: `url(${tileset.imageUrl})`,
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tiles.map((tile) => {
          const isSelected = isTileInSelection(tile.x, tile.y)

          return (
            <div
              key={`${tile.x}-${tile.y}`}
              className={cn(
                "absolute border border-transparent transition-colors hover:border-white/40",
                isSelected && "border-white bg-white/20",
              )}
              style={{
                left: tile.x * displayTileSize,
                top: tile.y * displayTileSize,
                width: displayTileSize,
                height: displayTileSize,
                pointerEvents: "none",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

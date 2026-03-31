"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { useTilesetStore } from "@/store/tileset-store"
import type { Tileset } from "@/lib/types"

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
      onSelect={(x, y) =>
        setSelectedTile({
          tilesetId: activeTileset.id,
          x,
          y,
          w: 1,
          h: 1,
        })
      }
    />
  )
}

function TileGrid({
  tileset,
  selectedTile,
  onSelect,
}: {
  tileset: Tileset
  selectedTile: ReturnType<typeof useTilesetStore.getState>["selectedTile"]
  onSelect: (x: number, y: number) => void
}) {
  const tiles = useMemo(() => {
    const result: { x: number; y: number }[] = []
    for (let row = 0; row < tileset.rows; row++) {
      for (let col = 0; col < tileset.columns; col++) {
        result.push({ x: col, y: row })
      }
    }
    return result
  }, [tileset.columns, tileset.rows])

  // Scale for display — fit tiles in the panel
  const displayTileSize = Math.max(16, Math.min(32, 200 / tileset.columns))

  return (
    <div className="relative overflow-auto p-2">
      <div
        className="relative"
        style={{
          width: tileset.columns * displayTileSize,
          height: tileset.rows * displayTileSize,
          backgroundImage: `url(${tileset.imageUrl})`,
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
        }}
      >
        {tiles.map((tile) => {
          const isSelected =
            selectedTile?.tilesetId === tileset.id &&
            selectedTile.x === tile.x &&
            selectedTile.y === tile.y

          return (
            <div
              key={`${tile.x}-${tile.y}`}
              className={cn(
                "absolute cursor-pointer border border-transparent transition-colors hover:border-white/40",
                isSelected && "border-white bg-white/20",
              )}
              style={{
                left: tile.x * displayTileSize,
                top: tile.y * displayTileSize,
                width: displayTileSize,
                height: displayTileSize,
              }}
              onClick={() => onSelect(tile.x, tile.y)}
            />
          )
        })}
      </div>
    </div>
  )
}

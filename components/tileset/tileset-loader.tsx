"use client"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useTilesetStore } from "@/store/tileset-store"
import { createImageUrl, getTilesetDimensions } from "@/lib/texture-utils"

export function TilesetLoader() {
  const addTileset = useTilesetStore((s) => s.addTileset)
  const inputRef = useRef<HTMLInputElement>(null)
  const [tileWidth, setTileWidth] = useState(16)
  const [tileHeight, setTileHeight] = useState(16)

  const handleFile = useCallback(
    async (file: File) => {
      const imageUrl = createImageUrl(file)
      const dims = await getTilesetDimensions(imageUrl, tileWidth, tileHeight)

      addTileset({
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ""),
        imageUrl,
        tileWidth,
        tileHeight,
        columns: dims.columns,
        rows: dims.rows,
      })
    },
    [addTileset, tileWidth, tileHeight],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file?.type.startsWith("image/")) handleFile(file)
    },
    [handleFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ""
    },
    [handleFile],
  )

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center gap-2">
        <label className="text-[10px] text-muted-foreground">Tile W</label>
        <input
          type="number"
          value={tileWidth}
          onChange={(e) => setTileWidth(Number(e.target.value) || 16)}
          className="h-6 w-12 rounded border bg-background px-1 text-xs"
          min={1}
        />
        <label className="text-[10px] text-muted-foreground">H</label>
        <input
          type="number"
          value={tileHeight}
          onChange={(e) => setTileHeight(Number(e.target.value) || 16)}
          className="h-6 w-12 rounded border bg-background px-1 text-xs"
          min={1}
        />
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex min-h-[60px] cursor-pointer items-center justify-center rounded border border-dashed border-muted-foreground/30 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/60"
        onClick={() => inputRef.current?.click()}
      >
        Drop PNG or click to browse
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}

"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useTilesetStore } from "@/store/tileset-store"
import { TilesetLoader } from "./tileset-loader"
import { TilePicker } from "./tile-picker"
import { X } from "lucide-react"

function TilesetSelector() {
  const tilesets = useTilesetStore((s) => s.tilesets)
  const activeTilesetId = useTilesetStore((s) => s.activeTilesetId)
  const setActiveTileset = useTilesetStore((s) => s.setActiveTileset)
  const removeTileset = useTilesetStore((s) => s.removeTileset)

  const tilesetList = Object.values(tilesets)

  if (tilesetList.length === 0) return null

  const activeTileset = activeTilesetId ? tilesets[activeTilesetId] : null

  return (
    <div className="space-y-1 px-2 py-1.5">
      <label className="text-[10px] font-medium uppercase text-muted-foreground">
        Tilesets ({tilesetList.length})
      </label>

      {/* Dropdown-style selector */}
      <select
        value={activeTilesetId ?? ""}
        onChange={(e) => {
          if (e.target.value) setActiveTileset(e.target.value)
        }}
        className="h-7 w-full rounded border bg-background px-1.5 text-xs"
      >
        {tilesetList.map((ts) => (
          <option key={ts.id} value={ts.id}>
            {ts.name}
          </option>
        ))}
      </select>

      {/* List with remove buttons */}
      <div className="max-h-[120px] space-y-0.5 overflow-y-auto">
        {tilesetList.map((ts) => (
          <div
            key={ts.id}
            className={`flex items-center justify-between rounded px-1.5 py-0.5 text-xs ${
              ts.id === activeTilesetId
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            <button
              className="flex-1 truncate text-left"
              onClick={() => setActiveTileset(ts.id)}
            >
              {ts.name}
            </button>
            <span className="mx-1 shrink-0 text-[10px] text-muted-foreground">
              {ts.columns * ts.tileWidth}x{ts.rows * ts.tileHeight} ({ts.columns}x{ts.rows})
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                removeTileset(ts.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Active tileset metadata */}
      {activeTileset && (
        <div className="rounded bg-muted/30 px-1.5 py-1 text-[10px] text-muted-foreground">
          <div>{activeTileset.name}</div>
          <div>
            {activeTileset.tileWidth}x{activeTileset.tileHeight}px tiles |{" "}
            {activeTileset.columns}x{activeTileset.rows} grid |{" "}
            {activeTileset.columns * activeTileset.rows} tiles
          </div>
        </div>
      )}
    </div>
  )
}

export function TilesetPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-2 py-1.5 text-xs font-semibold">Tileset</div>
      <Separator />
      <TilesetLoader />
      <Separator />
      <TilesetSelector />
      <Separator />
      <ScrollArea className="flex-1">
        <TilePicker />
      </ScrollArea>
    </div>
  )
}

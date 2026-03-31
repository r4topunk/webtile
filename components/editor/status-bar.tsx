"use client"

import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"

export function StatusBar() {
  const tool = useEditorStore((s) => s.tool)
  const cameraType = useEditorStore((s) => s.cameraType)
  const objectCount = useSceneStore((s) => Object.keys(s.objects).length)
  const selectedTile = useTilesetStore((s) => s.selectedTile)

  return (
    <div className="flex h-6 items-center justify-between border-t bg-background px-3 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>Tool: {tool}</span>
        <span>Camera: {cameraType}</span>
        <span>Objects: {objectCount}</span>
      </div>
      <div>
        {selectedTile ? (
          <span>
            Tile: ({selectedTile.x}, {selectedTile.y})
          </span>
        ) : (
          <span>No tile selected</span>
        )}
      </div>
    </div>
  )
}

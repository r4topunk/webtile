"use client"

import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"

const planeLabels = { xz: "XZ", xy: "XY", yz: "YZ" } as const

export function StatusBar() {
  const tool = useEditorStore((s) => s.tool)
  const cameraType = useEditorStore((s) => s.cameraType)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const placementOffset = useEditorStore((s) => s.placementOffset)
  const objectCount = useSceneStore((s) => Object.keys(s.objects).length)
  const selectedCount = useSceneStore((s) => s.selectedIds.length)
  const selectedTile = useTilesetStore((s) => s.selectedTile)

  return (
    <div className="flex h-6 items-center justify-between border-t bg-background px-3 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>Tool: {tool}</span>
        <span>Camera: {cameraType}</span>
        <span>Objects: {objectCount}</span>
        {selectedCount > 0 && <span>Selected: {selectedCount}</span>}
        <span>
          Plane: {planeLabels[placementPlane]} | Offset: {placementOffset}
        </span>
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

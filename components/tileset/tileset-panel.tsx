"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { TilesetLoader } from "./tileset-loader"
import { TilePicker } from "./tile-picker"

export function TilesetPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-2 py-1.5 text-xs font-semibold">Tileset</div>
      <Separator />
      <TilesetLoader />
      <Separator />
      <ScrollArea className="flex-1">
        <TilePicker />
      </ScrollArea>
    </div>
  )
}

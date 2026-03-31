"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { TopBar } from "./top-bar"
import { StatusBar } from "./status-bar"
import { Viewport } from "@/components/viewport/viewport"
import { TilesetPanel } from "@/components/tileset/tileset-panel"

export default function EditorLayout() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid h-screen w-screen grid-rows-[auto_1fr_auto] overflow-hidden">
        <TopBar />
        <div className="grid min-h-0 grid-cols-[1fr_280px]">
          <div className="min-w-0 overflow-hidden">
            <Viewport />
          </div>
          <div className="overflow-hidden border-l">
            <TilesetPanel />
          </div>
        </div>
        <StatusBar />
      </div>
    </TooltipProvider>
  )
}

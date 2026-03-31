"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditorMenuBar } from "./menu-bar"
import { LeftToolbar } from "./left-toolbar"
import { StatusBar } from "./status-bar"
import { Viewport } from "@/components/viewport/viewport"
import { TilesetPanel } from "@/components/tileset/tileset-panel"
import { LayersPanel } from "@/components/panels/layers-panel"
import { PropertiesPanel } from "@/components/panels/properties-panel"
import { UVEditor } from "@/components/panels/uv-editor"
import { AutosaveRestoreDialog } from "@/components/dialogs/autosave-restore-dialog"
import { Timeline } from "@/components/animation/timeline"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useAutoSave } from "@/hooks/use-auto-save"

export default function EditorLayout() {
  useKeyboardShortcuts()
  useAutoSave()

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid h-screen w-screen grid-rows-[auto_1fr_auto_auto] overflow-hidden">
        {/* Menu bar */}
        <EditorMenuBar />

        {/* Main area: left toolbar + viewport + right sidebar */}
        <div className="grid min-h-0 grid-cols-[auto_1fr_280px]">
          {/* Left toolbar */}
          <LeftToolbar />

          {/* Viewport */}
          <div className="min-w-0 overflow-hidden">
            <Viewport />
          </div>

          {/* Right sidebar — tabbed panels */}
          <div className="flex h-full flex-col overflow-hidden border-l">
            <Tabs defaultValue="tileset" className="flex h-full flex-col gap-0">
              <TabsList className="w-full shrink-0 rounded-none">
                <TabsTrigger value="tileset" className="text-xs">
                  Tileset
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-xs">
                  Scene
                </TabsTrigger>
                <TabsTrigger value="properties" className="text-xs">
                  Props
                </TabsTrigger>
                <TabsTrigger value="uv" className="text-xs">
                  UV
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="tileset"
                className="min-h-0 flex-1 overflow-hidden"
              >
                <TilesetPanel />
              </TabsContent>
              <TabsContent
                value="layers"
                className="min-h-0 flex-1 overflow-hidden"
              >
                <LayersPanel />
              </TabsContent>
              <TabsContent
                value="properties"
                className="min-h-0 flex-1 overflow-auto"
              >
                <PropertiesPanel />
              </TabsContent>
              <TabsContent
                value="uv"
                className="min-h-0 flex-1 overflow-auto"
              >
                <UVEditor />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Timeline */}
        <Timeline />

        {/* Status bar */}
        <StatusBar />
      </div>
      <AutosaveRestoreDialog />
    </TooltipProvider>
  )
}

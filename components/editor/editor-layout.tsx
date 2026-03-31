"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopBar } from "./top-bar"
import { StatusBar } from "./status-bar"
import { Viewport } from "@/components/viewport/viewport"
import { TilesetPanel } from "@/components/tileset/tileset-panel"
import { LayersPanel } from "@/components/panels/layers-panel"
import { PropertiesPanel } from "@/components/panels/properties-panel"
import { AutosaveRestoreDialog } from "@/components/dialogs/autosave-restore-dialog"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useAutoSave } from "@/hooks/use-auto-save"
import { Separator } from "@/components/ui/separator"

export default function EditorLayout() {
  useKeyboardShortcuts()
  useAutoSave()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid h-screen w-screen grid-rows-[auto_1fr_auto] overflow-hidden">
        <TopBar />
        <div className="grid min-h-0 grid-cols-[1fr_280px]">
          <div className="min-w-0 overflow-hidden">
            <Viewport />
          </div>
          <div className="flex h-full flex-col overflow-hidden border-l">
            <Tabs defaultValue="tileset" className="flex h-full flex-col gap-0">
              <TabsList className="w-full shrink-0 rounded-none">
                <TabsTrigger value="tileset">Tileset</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
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
            </Tabs>
          </div>
        </div>
        <StatusBar />
      </div>
      <AutosaveRestoreDialog />
    </TooltipProvider>
  )
}

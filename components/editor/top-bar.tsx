"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { ExportDialog } from "@/components/dialogs/export-dialog"
import { ImportDialog } from "@/components/dialogs/import-dialog"
import { saveProjectToFile, loadProjectFromFile } from "@/lib/file-io"
import type { EditMode, EditorTool, PlacementPlane } from "@/lib/types"

const modes: { value: EditMode; label: string }[] = [
  { value: "object", label: "Object" },
  { value: "face", label: "Face" },
  { value: "vertex", label: "Vertex" },
  { value: "edge", label: "Edge" },
]

const planes: { value: PlacementPlane; label: string; key: string }[] = [
  { value: "xz", label: "XZ", key: "1" },
  { value: "xy", label: "XY", key: "2" },
  { value: "yz", label: "YZ", key: "3" },
]

export function TopBar() {
  const cameraType = useEditorStore((s) => s.cameraType)
  const toggleCameraType = useEditorStore((s) => s.toggleCameraType)
  const showGrid = useEditorStore((s) => s.showGrid)
  const toggleGrid = useEditorStore((s) => s.toggleGrid)
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const setPlacementPlane = useEditorStore((s) => s.setPlacementPlane)

  const exportOpen = useEditorStore((s) => s.exportDialogOpen)
  const setExportOpen = useEditorStore((s) => s.setExportDialogOpen)
  const importOpen = useEditorStore((s) => s.importDialogOpen)
  const setImportOpen = useEditorStore((s) => s.setImportDialogOpen)

  function handleUndo() {
    useSceneStore.temporal.getState().undo()
  }

  function handleRedo() {
    useSceneStore.temporal.getState().redo()
  }

  return (
    <div className="flex h-10 items-center gap-1 border-b bg-background px-2">
      <span className="mr-2 text-sm font-semibold tracking-tight">webtile</span>
      <Separator orientation="vertical" className="h-5" />

      {/* Tools */}
      <div className="ml-2 flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={tool === "select" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTool("select")}
            >
              Select
            </Button>
          </TooltipTrigger>
          <TooltipContent>Select objects (V)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={tool === "place" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTool("place")}
            >
              Place
            </Button>
          </TooltipTrigger>
          <TooltipContent>Place tiles (B)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={tool === "paint" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTool("paint")}
            >
              Paint
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paint faces (P)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Edit modes */}
      <div className="flex items-center gap-1">
        {modes.map((m) => (
          <Tooltip key={m.value}>
            <TooltipTrigger asChild>
              <Button
                variant={mode === m.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {m.label} mode (Tab to cycle)
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Placement plane selector */}
      <div className="flex items-center gap-1">
        {planes.map((p) => (
          <Tooltip key={p.value}>
            <TooltipTrigger asChild>
              <Button
                variant={placementPlane === p.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPlacementPlane(p.value)}
              >
                {p.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {p.label} plane ({p.key})
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Camera + Grid */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={toggleCameraType}
            >
              {cameraType === "orthographic" ? "Ortho" : "Persp"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle camera (5)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showGrid ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={toggleGrid}
            >
              Grid
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle grid (G)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleUndo}
            >
              Undo
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleRedo}
            >
              Redo
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Import / Export */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setImportOpen(true)}
            >
              Import
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import OBJ</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setExportOpen(true)}
            >
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export scene (Ctrl+E)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Project Save / Load */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => saveProjectToFile()}
            >
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save project (Ctrl+S)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => loadProjectFromFile()}
            >
              Open
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open project (Ctrl+O)</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1" />
      <span className="text-xs text-muted-foreground">Phase 4</span>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}

"use client"

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { ExportDialog } from "@/components/dialogs/export-dialog"
import { ImportDialog } from "@/components/dialogs/import-dialog"
import { saveProjectToFile, loadProjectFromFile } from "@/lib/file-io"

export function EditorMenuBar() {
  const toggleCameraType = useEditorStore((s) => s.toggleCameraType)
  const cameraType = useEditorStore((s) => s.cameraType)
  const showGrid = useEditorStore((s) => s.showGrid)
  const toggleGrid = useEditorStore((s) => s.toggleGrid)
  const setCameraPreset = useEditorStore((s) => s.setCameraPreset)

  const exportOpen = useEditorStore((s) => s.exportDialogOpen)
  const setExportOpen = useEditorStore((s) => s.setExportDialogOpen)
  const importOpen = useEditorStore((s) => s.importDialogOpen)
  const setImportOpen = useEditorStore((s) => s.setImportDialogOpen)

  return (
    <>
      <div className="flex h-8 items-center border-b bg-background px-1">
        <span className="px-2 text-xs font-bold tracking-tight">webtile</span>
        <Menubar className="h-7 border-none bg-transparent p-0 shadow-none">
          {/* File */}
          <MenubarMenu>
            <MenubarTrigger className="h-6 px-2 text-xs">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => saveProjectToFile()}>
                Save Project <MenubarShortcut>Ctrl+S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => loadProjectFromFile()}>
                Open Project <MenubarShortcut>Ctrl+O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => setImportOpen(true)}>
                Import OBJ...
              </MenubarItem>
              <MenubarItem onClick={() => setExportOpen(true)}>
                Export... <MenubarShortcut>Ctrl+E</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* Edit */}
          <MenubarMenu>
            <MenubarTrigger className="h-6 px-2 text-xs">Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => useSceneStore.temporal.getState().undo()}>
                Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => useSceneStore.temporal.getState().redo()}>
                Redo <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={() => {
                  const { selectedIds, removeObjects } = useSceneStore.getState()
                  if (selectedIds.length) removeObjects(selectedIds)
                }}
              >
                Delete Selected <MenubarShortcut>Del</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                onClick={() => {
                  const { selectedIds, duplicateObjects } = useSceneStore.getState()
                  if (selectedIds.length) duplicateObjects(selectedIds)
                }}
              >
                Duplicate <MenubarShortcut>Ctrl+D</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* View */}
          <MenubarMenu>
            <MenubarTrigger className="h-6 px-2 text-xs">View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={toggleCameraType}>
                {cameraType === "orthographic" ? "Switch to Perspective" : "Switch to Orthographic"}
                <MenubarShortcut>5</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={toggleGrid}>
                {showGrid ? "Hide Grid" : "Show Grid"}
                <MenubarShortcut>G</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Camera Presets</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => setCameraPreset("front")}>
                    Front <MenubarShortcut>Num 1</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onClick={() => setCameraPreset("right")}>
                    Right <MenubarShortcut>Num 3</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onClick={() => setCameraPreset("top")}>
                    Top <MenubarShortcut>Num 7</MenubarShortcut>
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  )
}

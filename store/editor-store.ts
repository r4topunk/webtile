import { create } from "zustand"
import type { CameraType, EditMode, EditorTool, PlacementPlane } from "@/lib/types"

export type CameraPreset = "front" | "top" | "right" | null

interface EditorState {
  tool: EditorTool
  mode: EditMode
  cameraType: CameraType
  gridSize: number
  showGrid: boolean
  placementPlane: PlacementPlane
  placementOffset: number
  exportDialogOpen: boolean
  importDialogOpen: boolean
  snapEnabled: boolean
  snapSize: number
  cameraPreset: CameraPreset
  showTimeline: boolean
  focusTarget: [number, number, number] | null

  setTool: (tool: EditorTool) => void
  setMode: (mode: EditMode) => void
  setCameraType: (type: CameraType) => void
  toggleCameraType: () => void
  setGridSize: (size: number) => void
  toggleGrid: () => void
  setPlacementPlane: (plane: PlacementPlane) => void
  setPlacementOffset: (offset: number) => void
  incrementPlacementOffset: () => void
  decrementPlacementOffset: () => void
  setExportDialogOpen: (open: boolean) => void
  setImportDialogOpen: (open: boolean) => void
  setSnapEnabled: (enabled: boolean) => void
  toggleSnap: () => void
  setSnapSize: (size: number) => void
  setCameraPreset: (preset: CameraPreset) => void
  toggleTimeline: () => void
  setFocusTarget: (target: [number, number, number] | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  tool: "place",
  mode: "object",
  cameraType: "orthographic",
  gridSize: 20,
  showGrid: true,
  placementPlane: "xz",
  placementOffset: 0,
  exportDialogOpen: false,
  importDialogOpen: false,
  snapEnabled: true,
  snapSize: 1,
  cameraPreset: null,
  showTimeline: false,
  focusTarget: null,

  setTool: (tool) => set({ tool }),
  setMode: (mode) => set({ mode }),
  setCameraType: (cameraType) => set({ cameraType }),
  toggleCameraType: () =>
    set((s) => ({
      cameraType: s.cameraType === "orthographic" ? "perspective" : "orthographic",
    })),
  setGridSize: (gridSize) => set({ gridSize }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setPlacementPlane: (placementPlane) => set({ placementPlane }),
  setPlacementOffset: (placementOffset) => set({ placementOffset }),
  incrementPlacementOffset: () => set((s) => ({ placementOffset: s.placementOffset + 1 })),
  decrementPlacementOffset: () => set((s) => ({ placementOffset: s.placementOffset - 1 })),
  setExportDialogOpen: (exportDialogOpen) => set({ exportDialogOpen }),
  setImportDialogOpen: (importDialogOpen) => set({ importDialogOpen }),
  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setSnapSize: (snapSize) => set({ snapSize: Math.max(0.1, snapSize) }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  toggleTimeline: () => set((s) => ({ showTimeline: !s.showTimeline })),
  setFocusTarget: (focusTarget) => set({ focusTarget }),
}))

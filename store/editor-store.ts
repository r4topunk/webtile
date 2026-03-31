import { create } from "zustand"
import type { CameraType, EditMode, EditorTool } from "@/lib/types"

interface EditorState {
  tool: EditorTool
  mode: EditMode
  cameraType: CameraType
  gridSize: number
  showGrid: boolean

  setTool: (tool: EditorTool) => void
  setMode: (mode: EditMode) => void
  setCameraType: (type: CameraType) => void
  toggleCameraType: () => void
  setGridSize: (size: number) => void
  toggleGrid: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  tool: "place",
  mode: "object",
  cameraType: "orthographic",
  gridSize: 20,
  showGrid: true,

  setTool: (tool) => set({ tool }),
  setMode: (mode) => set({ mode }),
  setCameraType: (cameraType) => set({ cameraType }),
  toggleCameraType: () =>
    set((s) => ({
      cameraType: s.cameraType === "orthographic" ? "perspective" : "orthographic",
    })),
  setGridSize: (gridSize) => set({ gridSize }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
}))

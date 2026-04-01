"use client"

import {
  Box,
  Square,
  CircleDot,
  Minus,
  MousePointer2,
  LayoutGrid,
  Paintbrush,
  Eraser,
  Camera,
  Grid3x3,
  Magnet,
} from "lucide-react"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import type { EditMode, EditorTool } from "@/lib/types"

const modeConfig: Record<
  EditMode,
  { icon: typeof Box; label: string; color: string }
> = {
  object: { icon: Box, label: "Object", color: "text-blue-400" },
  face: { icon: Square, label: "Face", color: "text-orange-400" },
  vertex: { icon: CircleDot, label: "Vertex", color: "text-green-400" },
  edge: { icon: Minus, label: "Edge", color: "text-purple-400" },
}

const toolConfig: Record<
  EditorTool,
  { icon: typeof MousePointer2; label: string }
> = {
  select: { icon: MousePointer2, label: "Select" },
  place: { icon: LayoutGrid, label: "Place" },
  paint: { icon: Paintbrush, label: "Paint" },
  erase: { icon: Eraser, label: "Erase" },
}

const planeLabels = { xz: "XZ", xy: "XY", yz: "YZ" } as const

export function StatusBar() {
  const tool = useEditorStore((s) => s.tool)
  const mode = useEditorStore((s) => s.mode)
  const cameraType = useEditorStore((s) => s.cameraType)
  const showGrid = useEditorStore((s) => s.showGrid)
  const snapEnabled = useEditorStore((s) => s.snapEnabled)
  const snapSize = useEditorStore((s) => s.snapSize)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const placementOffset = useEditorStore((s) => s.placementOffset)
  const objectCount = useSceneStore((s) => Object.keys(s.objects).length)
  const selectedCount = useSceneStore((s) => s.selectedIds.length)
  const selectedFaceCount = useSceneStore((s) => s.selectedFaceIds.length)
  const selectedVertexCount = useSceneStore((s) => s.selectedVertexIndices.length)
  const selectedEdgeCount = useSceneStore((s) => s.selectedEdgeIndices.length)

  const mc = modeConfig[mode]
  const ModeIcon = mc.icon
  const tc = toolConfig[tool]
  const ToolIcon = tc.icon

  // Selection info
  let selectionText = `Scene: ${objectCount} objects`
  if (mode === "face" && selectedFaceCount > 0) {
    selectionText = `${selectedFaceCount} face${selectedFaceCount !== 1 ? "s" : ""} selected`
  } else if (mode === "vertex" && selectedVertexCount > 0) {
    selectionText = `${selectedVertexCount} vert${selectedVertexCount !== 1 ? "ices" : "ex"} selected`
  } else if (mode === "edge" && selectedEdgeCount > 0) {
    selectionText = `${selectedEdgeCount} edge${selectedEdgeCount !== 1 ? "s" : ""} selected`
  } else if (selectedCount > 0) {
    selectionText = `${selectedCount} object${selectedCount !== 1 ? "s" : ""} selected`
  }

  return (
    <div className="flex h-6 items-center border-t border bg-muted px-3 text-xs text-muted-foreground">
      {/* Left: mode + tool */}
      <div className="flex items-center gap-2">
        <ModeIcon className={`h-3 w-3 ${mc.color}`} />
        <span className={mc.color}>{mc.label}</span>
        <span className="text-muted-foreground/50">|</span>
        <ToolIcon className="h-3 w-3" />
        <span>{tc.label}</span>
      </div>

      {/* Center: selection */}
      <div className="flex-1 text-center">{selectionText}</div>

      {/* Right: technical info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {cameraType === "perspective" ? (
            <Camera className="h-3 w-3" />
          ) : (
            <Box className="h-3 w-3" />
          )}
          <span>{cameraType === "perspective" ? "Persp" : "Ortho"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Grid3x3 className="h-3 w-3" />
          <span>{showGrid ? "ON" : "OFF"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Magnet className="h-3 w-3" />
          <span>
            {snapEnabled ? `ON (${snapSize})` : "OFF"}
          </span>
        </div>
        <span>
          {planeLabels[placementPlane]} +{placementOffset}
        </span>
      </div>
    </div>
  )
}

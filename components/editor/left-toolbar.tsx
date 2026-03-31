"use client"

import type { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useEditorStore } from "@/store/editor-store"
import type { EditMode, EditorTool, PlacementPlane } from "@/lib/types"
import {
  MousePointer2,
  LayoutGrid,
  Paintbrush,
  Box,
  Square,
  CircleDot,
  Minus,
  Pencil,
  MousePointer,
  Magnet,
} from "lucide-react"

function ToolButton({
  active,
  onClick,
  icon,
  shortcut,
  description,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  shortcut: string
  description: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
            active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="text-xs font-medium">{description}</div>
        <div className="text-[10px] text-muted-foreground">{shortcut}</div>
      </TooltipContent>
    </Tooltip>
  )
}

function PlaneButton({
  active,
  onClick,
  label,
  shortcut,
  description,
}: {
  active: boolean
  onClick: () => void
  label: string
  shortcut: string
  description: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`flex h-6 w-8 items-center justify-center rounded text-[10px] font-bold tracking-tight transition-colors ${
            active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="text-xs font-medium">{description}</div>
        <div className="text-[10px] text-muted-foreground">{shortcut}</div>
      </TooltipContent>
    </Tooltip>
  )
}

const ICON_SIZE = 16

const tools: {
  value: EditorTool
  icon: ReactNode
  shortcut: string
  description: string
}[] = [
  {
    value: "select",
    icon: <MousePointer2 size={ICON_SIZE} />,
    shortcut: "V",
    description: "Select & transform objects",
  },
  {
    value: "place",
    icon: <LayoutGrid size={ICON_SIZE} />,
    shortcut: "B",
    description: "Place tiles on the grid",
  },
  {
    value: "paint",
    icon: <Paintbrush size={ICON_SIZE} />,
    shortcut: "P",
    description: "Paint tiles onto faces",
  },
]

const modes: {
  value: EditMode
  icon: ReactNode
  description: string
}[] = [
  { value: "object", icon: <Box size={ICON_SIZE} />, description: "Object mode" },
  { value: "face", icon: <Square size={ICON_SIZE} />, description: "Face mode — E to extrude" },
  { value: "vertex", icon: <CircleDot size={ICON_SIZE} />, description: "Vertex mode" },
  { value: "edge", icon: <Minus size={ICON_SIZE} />, description: "Edge mode" },
]

const planes: {
  value: PlacementPlane
  label: string
  shortcut: string
  description: string
}[] = [
  { value: "xz", label: "XZ", shortcut: "1", description: "Floor plane (Y = offset)" },
  { value: "xy", label: "XY", shortcut: "2", description: "Front wall (Z = offset)" },
  { value: "yz", label: "YZ", shortcut: "3", description: "Side wall (X = offset)" },
]

function SnapToggle() {
  const snapEnabled = useEditorStore((s) => s.snapEnabled)
  const toggleSnap = useEditorStore((s) => s.toggleSnap)
  const snapSize = useEditorStore((s) => s.snapSize)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleSnap}
          className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
            snapEnabled
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          <Magnet size={ICON_SIZE} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="text-xs font-medium">
          Grid Snap: {snapEnabled ? `ON (${snapSize})` : "OFF"}
        </div>
        <div className="text-[10px] text-muted-foreground">
          Click to toggle. Hold Ctrl while dragging for temporary snap.
          <br />
          Hold Shift while dragging to lock to one axis.
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function LeftToolbar() {
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const setPlacementPlane = useEditorStore((s) => s.setPlacementPlane)
  const placementOffset = useEditorStore((s) => s.placementOffset)

  const isDrawMode = tool === "place" || tool === "paint"

  return (
    <div className="flex w-10 flex-col items-center gap-0.5 border-r bg-background py-2">
      {/* Draw / Edit mode toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTool(isDrawMode ? "select" : "place")}
            className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
              isDrawMode
                ? "bg-orange-600/90 text-white hover:bg-orange-500"
                : "bg-blue-600/90 text-white hover:bg-blue-500"
            }`}
          >
            {isDrawMode ? <Pencil size={ICON_SIZE} /> : <MousePointer size={ICON_SIZE} />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <div className="text-xs font-medium">
            {isDrawMode ? "Draw Mode" : "Edit Mode"}
          </div>
          <div className="text-[10px] text-muted-foreground">Click to switch</div>
        </TooltipContent>
      </Tooltip>

      <Separator className="my-1.5 w-6" />

      {/* Tools */}
      {tools.map((t) => (
        <ToolButton
          key={t.value}
          active={tool === t.value}
          onClick={() => setTool(t.value)}
          icon={t.icon}
          shortcut={t.shortcut}
          description={t.description}
        />
      ))}

      <Separator className="my-1.5 w-6" />

      {/* Edit modes */}
      {modes.map((m) => (
        <ToolButton
          key={m.value}
          active={mode === m.value}
          onClick={() => setMode(m.value)}
          icon={m.icon}
          shortcut="Tab"
          description={m.description}
        />
      ))}

      <Separator className="my-1.5 w-6" />

      {/* Placement plane */}
      {planes.map((p) => (
        <PlaneButton
          key={p.value}
          active={placementPlane === p.value}
          onClick={() => setPlacementPlane(p.value)}
          label={p.label}
          shortcut={p.shortcut}
          description={p.description}
        />
      ))}

      {/* Offset display */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mt-0.5 flex h-5 w-8 items-center justify-center rounded bg-muted text-[9px] font-mono text-muted-foreground">
            {placementOffset >= 0 ? "+" : ""}
            {placementOffset}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <div className="text-xs font-medium">Plane offset: {placementOffset}</div>
          <div className="text-[10px] text-muted-foreground">Shift + Scroll to adjust</div>
        </TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      {/* Snap toggle at bottom */}
      <Separator className="my-1.5 w-6" />
      <SnapToggle />
    </div>
  )
}

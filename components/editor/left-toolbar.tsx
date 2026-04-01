"use client"

import type { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEditorStore, type TransformMode } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import type { EditMode, EditorTool, PlacementPlane } from "@/lib/types"
import {
  MousePointer2,
  LayoutGrid,
  Paintbrush,
  Box,
  Square,
  CircleDot,
  Minus,
  Plus,
  Pencil,
  MousePointer,
  Magnet,
  Move,
  RotateCw,
  Maximize2,
  BoxSelect,
  Trash2,
  Eraser,
} from "lucide-react"

const ICON_SIZE = 16

// --- Reusable button components ---

function ToolButton({
  active,
  onClick,
  icon,
  shortcut,
  description,
  className,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  shortcut: string
  description: string
  className?: string
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
          } ${className ?? ""}`}
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

function ModeButton({
  active,
  onClick,
  icon,
  description,
  borderColor,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  description: string
  borderColor: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
            active
              ? `bg-accent/80 text-accent-foreground border-l-[3px] ${borderColor}`
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border-l-[3px] border-transparent"
          }`}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="text-xs font-medium">{description}</div>
        <div className="text-[10px] text-muted-foreground">Tab to cycle</div>
      </TooltipContent>
    </Tooltip>
  )
}

// --- Data ---

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
  {
    value: "erase",
    icon: <Eraser size={ICON_SIZE} />,
    shortcut: "",
    description: "Erase tiles",
  },
]

const modeColors: Record<EditMode, { border: string; bg: string }> = {
  object: { border: "border-l-blue-400", bg: "bg-blue-500/5" },
  face: { border: "border-l-orange-400", bg: "bg-orange-500/5" },
  vertex: { border: "border-l-green-400", bg: "bg-green-500/5" },
  edge: { border: "border-l-purple-400", bg: "bg-purple-500/5" },
}

const modes: {
  value: EditMode
  icon: ReactNode
  description: string
}[] = [
  { value: "object", icon: <Box size={ICON_SIZE} />, description: "Object mode" },
  { value: "face", icon: <Square size={ICON_SIZE} />, description: "Face mode" },
  { value: "vertex", icon: <CircleDot size={ICON_SIZE} />, description: "Vertex mode" },
  { value: "edge", icon: <Minus size={ICON_SIZE} />, description: "Edge mode" },
]

const transformModes: {
  value: TransformMode
  icon: ReactNode
  shortcut: string
  description: string
}[] = [
  { value: "translate", icon: <Move size={ICON_SIZE} />, shortcut: "W", description: "Move" },
  { value: "rotate", icon: <RotateCw size={ICON_SIZE} />, shortcut: "E", description: "Rotate" },
  { value: "scale", icon: <Maximize2 size={ICON_SIZE} />, shortcut: "R", description: "Scale" },
]

const planes: {
  value: PlacementPlane
  label: string
  fullLabel: string
  shortcut: string
  description: string
}[] = [
  { value: "xz", label: "XZ", fullLabel: "Floor", shortcut: "1", description: "Floor plane (Y = offset)" },
  { value: "xy", label: "XY", fullLabel: "Front", shortcut: "2", description: "Front wall (Z = offset)" },
  { value: "yz", label: "YZ", fullLabel: "Side", shortcut: "3", description: "Side wall (X = offset)" },
]

// --- Section header ---

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="w-full px-1 pt-1.5 pb-0.5">
      <span className="text-[8px] font-semibold uppercase tracking-wider text-neutral-500">
        {children}
      </span>
    </div>
  )
}

function SectionDivider() {
  return <div className="my-1 w-full border-b border-neutral-700" />
}

// --- Contextual sections ---

function ObjectContextSection() {
  const transformMode = useEditorStore((s) => s.transformMode)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)

  return (
    <div className="flex flex-col items-center gap-0.5">
      <SectionHeader>Gizmo</SectionHeader>
      {transformModes.map((t) => (
        <ToolButton
          key={t.value}
          active={transformMode === t.value}
          onClick={() => setTransformMode(t.value)}
          icon={t.icon}
          shortcut={t.shortcut}
          description={t.description}
        />
      ))}
    </div>
  )
}

function FaceContextSection() {
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const selectedFaceIds = useSceneStore((s) => s.selectedFaceIds)
  const extrudeFaces = useSceneStore((s) => s.extrudeFaces)
  const removeFaces = useSceneStore((s) => s.removeFaces)

  return (
    <div className="flex flex-col items-center gap-0.5">
      <SectionHeader>Face</SectionHeader>
      <ToolButton
        active={false}
        onClick={() => {
          if (selectedIds.length > 0 && selectedFaceIds.length > 0)
            extrudeFaces(selectedIds[0], selectedFaceIds)
        }}
        icon={<BoxSelect size={ICON_SIZE} />}
        shortcut="E"
        description="Extrude faces"
      />
      <ToolButton
        active={false}
        onClick={() => {
          if (selectedIds.length > 0 && selectedFaceIds.length > 0)
            removeFaces(selectedIds[0], selectedFaceIds)
        }}
        icon={<Trash2 size={ICON_SIZE} />}
        shortcut="Del"
        description="Delete faces"
      />
      <p className="mt-1 px-0.5 text-center text-[7px] leading-tight text-neutral-500">
        Select tile, click face to paint
      </p>
    </div>
  )
}

function VertexContextSection() {
  const snapEnabled = useEditorStore((s) => s.snapEnabled)
  const toggleSnap = useEditorStore((s) => s.toggleSnap)
  const snapSize = useEditorStore((s) => s.snapSize)

  return (
    <div className="flex flex-col items-center gap-0.5">
      <SectionHeader>Vertex</SectionHeader>
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
          <div className="text-xs font-medium">Snap: {snapEnabled ? `ON (${snapSize})` : "OFF"}</div>
          <div className="text-[10px] text-muted-foreground">Click to toggle</div>
        </TooltipContent>
      </Tooltip>
      <p className="mt-1 px-0.5 text-center text-[7px] leading-tight text-neutral-500">
        Hold X/Y/Z to lock axis
      </p>
      <p className="px-0.5 text-center text-[7px] leading-tight text-neutral-500">
        Hold Shift for auto-detect
      </p>
      <p className="px-0.5 text-center text-[7px] leading-tight text-neutral-500">
        Delete to remove
      </p>
    </div>
  )
}

function EdgeContextSection() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <SectionHeader>Edge</SectionHeader>
      <p className="mt-1 px-0.5 text-center text-[7px] leading-tight text-neutral-500">
        S to subdivide edge
      </p>
      <p className="px-0.5 text-center text-[7px] leading-tight text-neutral-500">
        Adds vertex at midpoint
      </p>
    </div>
  )
}

function ContextualSection({ editMode }: { editMode: EditMode }) {
  const bg = modeColors[editMode].bg

  return (
    <div className={`w-full flex flex-col items-center ${bg} py-0.5`}>
      {editMode === "object" && <ObjectContextSection />}
      {editMode === "face" && <FaceContextSection />}
      {editMode === "vertex" && <VertexContextSection />}
      {editMode === "edge" && <EdgeContextSection />}
    </div>
  )
}

// --- Snap toggle (bottom) ---

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

// --- Offset controls ---

function OffsetControls() {
  const placementOffset = useEditorStore((s) => s.placementOffset)
  const incrementPlacementOffset = useEditorStore((s) => s.incrementPlacementOffset)
  const decrementPlacementOffset = useEditorStore((s) => s.decrementPlacementOffset)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-10 items-center justify-between px-0.5">
          <button
            onClick={decrementPlacementOffset}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <Minus size={10} />
          </button>
          <span className="text-[9px] font-mono text-muted-foreground">
            {placementOffset >= 0 ? "+" : ""}
            {placementOffset}
          </span>
          <button
            onClick={incrementPlacementOffset}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <Plus size={10} />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="text-xs font-medium">Plane offset: {placementOffset}</div>
        <div className="text-[10px] text-muted-foreground">Shift + Scroll to adjust</div>
      </TooltipContent>
    </Tooltip>
  )
}

// --- Main toolbar ---

export function LeftToolbar() {
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const setPlacementPlane = useEditorStore((s) => s.setPlacementPlane)

  const isDrawMode = tool === "place" || tool === "paint" || tool === "erase"

  return (
    <div className="flex w-11 flex-col items-center gap-0.5 border-r bg-background py-2">
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

      <SectionDivider />

      {/* Tools */}
      <SectionHeader>Tools</SectionHeader>
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

      <SectionDivider />

      {/* Edit modes */}
      <SectionHeader>Mode</SectionHeader>
      {modes.map((m) => (
        <ModeButton
          key={m.value}
          active={mode === m.value}
          onClick={() => setMode(m.value)}
          icon={m.icon}
          description={m.description}
          borderColor={modeColors[m.value].border}
        />
      ))}

      <SectionDivider />

      {/* Contextual section */}
      <ContextualSection editMode={mode} />

      <SectionDivider />

      {/* Placement plane */}
      <SectionHeader>Plane</SectionHeader>
      {planes.map((p) => (
        <Tooltip key={p.value}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setPlacementPlane(p.value)}
              className={`flex h-6 w-8 items-center justify-center rounded text-[9px] font-bold tracking-tight transition-colors ${
                placementPlane === p.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              {p.fullLabel}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <div className="text-xs font-medium">{p.description}</div>
            <div className="text-[10px] text-muted-foreground">{p.shortcut}</div>
          </TooltipContent>
        </Tooltip>
      ))}

      {/* Offset controls */}
      <OffsetControls />

      <div className="flex-1" />

      {/* Snap toggle at bottom */}
      <SectionDivider />
      <SnapToggle />
    </div>
  )
}

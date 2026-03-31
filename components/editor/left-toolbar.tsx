"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useEditorStore } from "@/store/editor-store"
import type { EditMode, EditorTool, PlacementPlane } from "@/lib/types"

function ToolButton({
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
          className={`flex h-8 w-full items-center justify-center rounded text-[11px] font-medium transition-colors ${
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
        <div className="text-[10px] text-muted-foreground">Shortcut: {shortcut}</div>
      </TooltipContent>
    </Tooltip>
  )
}

const tools: { value: EditorTool; label: string; shortcut: string; description: string }[] = [
  { value: "select", label: "Sel", shortcut: "V", description: "Select and transform objects" },
  { value: "place", label: "Tile", shortcut: "B", description: "Place tiles on the grid" },
  { value: "paint", label: "Paint", shortcut: "P", description: "Paint tiles onto existing faces" },
]

const modes: { value: EditMode; label: string; description: string }[] = [
  { value: "object", label: "Obj", description: "Select and transform whole objects" },
  { value: "face", label: "Face", description: "Select and edit individual faces. E to extrude" },
  { value: "vertex", label: "Vert", description: "Select and drag individual vertices" },
  { value: "edge", label: "Edge", description: "Select and drag edges" },
]

const planes: { value: PlacementPlane; label: string; shortcut: string; description: string }[] = [
  { value: "xz", label: "XZ", shortcut: "1", description: "Place tiles on the floor plane (Y = offset)" },
  { value: "xy", label: "XY", shortcut: "2", description: "Place tiles on the front wall (Z = offset)" },
  { value: "yz", label: "YZ", shortcut: "3", description: "Place tiles on the side wall (X = offset)" },
]

export function LeftToolbar() {
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const placementPlane = useEditorStore((s) => s.placementPlane)
  const setPlacementPlane = useEditorStore((s) => s.setPlacementPlane)
  const placementOffset = useEditorStore((s) => s.placementOffset)

  return (
    <div className="flex w-12 flex-col gap-1 border-r bg-background px-1 py-2">
      {/* Mode toggle — Draw vs Edit, like Crocotile's Tab toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() =>
              setTool(tool === "select" ? "place" : "select")
            }
            className={`flex h-7 w-full items-center justify-center rounded text-[10px] font-bold transition-colors ${
              tool === "select"
                ? "bg-blue-600 text-white"
                : "bg-orange-600 text-white"
            }`}
          >
            {tool === "select" ? "EDIT" : "DRAW"}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <div className="text-xs font-medium">
            {tool === "select" ? "Edit Mode — selecting and transforming" : "Draw Mode — placing and painting"}
          </div>
          <div className="text-[10px] text-muted-foreground">Click to toggle between Draw and Edit</div>
        </TooltipContent>
      </Tooltip>

      <Separator className="my-1" />

      {/* Tools */}
      <div className="space-y-0.5">
        <div className="px-0.5 text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
          Tools
        </div>
        {tools.map((t) => (
          <ToolButton
            key={t.value}
            active={tool === t.value}
            onClick={() => setTool(t.value)}
            label={t.label}
            shortcut={t.shortcut}
            description={t.description}
          />
        ))}
      </div>

      <Separator className="my-1" />

      {/* Edit modes */}
      <div className="space-y-0.5">
        <div className="px-0.5 text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
          Mode
        </div>
        {modes.map((m) => (
          <ToolButton
            key={m.value}
            active={mode === m.value}
            onClick={() => setMode(m.value)}
            label={m.label}
            shortcut="Tab"
            description={m.description}
          />
        ))}
      </div>

      <Separator className="my-1" />

      {/* Placement plane */}
      <div className="space-y-0.5">
        <div className="px-0.5 text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
          Plane
        </div>
        {planes.map((p) => (
          <ToolButton
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
            <div className="flex h-6 w-full items-center justify-center rounded bg-muted text-[10px] font-mono text-muted-foreground">
              {placementOffset >= 0 ? "+" : ""}{placementOffset}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <div className="text-xs font-medium">Plane offset: {placementOffset}</div>
            <div className="text-[10px] text-muted-foreground">Shift+Scroll to adjust</div>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1" />
    </div>
  )
}

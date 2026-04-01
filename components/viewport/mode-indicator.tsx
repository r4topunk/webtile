"use client"

import { useEditorStore } from "@/store/editor-store"
import type { EditMode } from "@/lib/types"

const MODE_COLORS: Record<EditMode, string> = {
  object: "#60a5fa",   // blue-400
  face: "#fb923c",     // orange-400
  vertex: "#4ade80",   // green-400
  edge: "#c084fc",     // purple-400
}

export function ModeIndicator() {
  const mode = useEditorStore((s) => s.mode)
  const color = MODE_COLORS[mode]

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 h-[3px] z-10 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <span
        className="absolute top-1.5 left-2 z-10 text-[10px] font-bold tracking-widest uppercase pointer-events-none"
        style={{ color }}
      >
        {mode} mode
      </span>
    </>
  )
}

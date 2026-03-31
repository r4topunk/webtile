"use client"

import { useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useSceneStore } from "@/store/scene-store"
import { useEditorStore } from "@/store/editor-store"
import type { SceneObject, Vec3 } from "@/lib/types"

function Vec3Input({
  label,
  value,
  onChange,
}: {
  label: string
  value: Vec3
  onChange: (v: Vec3) => void
}) {
  const handleChange = useCallback(
    (axis: 0 | 1 | 2, raw: string) => {
      const n = parseFloat(raw)
      if (isNaN(n)) return
      const next: Vec3 = [...value]
      next[axis] = n
      onChange(next)
    },
    [value, onChange]
  )

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-1">
        {(["X", "Y", "Z"] as const).map((axis, i) => (
          <div key={axis} className="flex items-center gap-0.5">
            <span className="w-3 text-[10px] text-muted-foreground">
              {axis}
            </span>
            <Input
              type="number"
              step={0.1}
              value={value[i as 0 | 1 | 2]}
              onChange={(e) =>
                handleChange(i as 0 | 1 | 2, e.target.value)
              }
              className="h-6 px-1 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PropertiesPanel() {
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const objects = useSceneStore((s) => s.objects)
  const updateObjectPosition = useSceneStore((s) => s.updateObjectPosition)
  const updateObjectRotation = useSceneStore((s) => s.updateObjectRotation)
  const updateObjectScale = useSceneStore((s) => s.updateObjectScale)
  const updateObjectName = useSceneStore((s) => s.updateObjectName)

  if (selectedIds.length === 0) {
    return (
      <div className="p-2 text-xs text-muted-foreground">
        Select an object to view properties
      </div>
    )
  }

  if (selectedIds.length > 1) {
    return (
      <div className="p-2 text-xs text-muted-foreground">
        {selectedIds.length} objects selected
      </div>
    )
  }

  const obj = objects[selectedIds[0]]
  if (!obj) return null

  return (
    <div className="space-y-3 p-2">
      <div className="space-y-1">
        <label className="text-[10px] font-medium uppercase text-muted-foreground">
          Name
        </label>
        <Input
          value={obj.name}
          onChange={(e) => updateObjectName(obj.id, e.target.value)}
          className="h-6 text-xs"
        />
      </div>

      <Separator />

      <Vec3Input
        label="Position"
        value={obj.position}
        onChange={(v) => updateObjectPosition(obj.id, v)}
      />

      <Vec3Input
        label="Rotation"
        value={obj.rotation}
        onChange={(v) => updateObjectRotation(obj.id, v)}
      />

      <Vec3Input
        label="Scale"
        value={obj.scale}
        onChange={(v) => updateObjectScale(obj.id, v)}
      />

      <Separator />

      <div className="text-[10px] text-muted-foreground">
        Faces: {obj.faces.length} | Vertices: {obj.faces.length * 4}
      </div>

      <SubObjectInfo obj={obj} />
    </div>
  )
}

function SubObjectInfo({ obj }: { obj: SceneObject }) {
  const mode = useEditorStore((s) => s.mode)
  const selectedFaceIds = useSceneStore((s) => s.selectedFaceIds)
  const selectedVertexIndices = useSceneStore((s) => s.selectedVertexIndices)
  const selectedEdgeIndices = useSceneStore((s) => s.selectedEdgeIndices)

  // Get selected vertex positions
  const selectedVertexPositions = useMemo(() => {
    if (mode !== "vertex" || selectedVertexIndices.length === 0) return []
    const result: { index: number; pos: Vec3 }[] = []
    const indexSet = new Set(selectedVertexIndices)
    let vi = 0
    for (const face of obj.faces) {
      for (const v of face.vertices) {
        if (indexSet.has(vi)) {
          result.push({ index: vi, pos: v })
        }
        vi++
      }
    }
    return result
  }, [mode, selectedVertexIndices, obj.faces])

  if (mode === "face" && selectedFaceIds.length > 0) {
    return (
      <div className="space-y-1">
        <Separator />
        <div className="text-[10px] font-medium uppercase text-muted-foreground">
          Selected Faces: {selectedFaceIds.length}
        </div>
        <div className="text-[10px] text-muted-foreground">
          E to extrude | Del to delete
        </div>
      </div>
    )
  }

  if (mode === "vertex" && selectedVertexPositions.length > 0) {
    return (
      <div className="space-y-1">
        <Separator />
        <div className="text-[10px] font-medium uppercase text-muted-foreground">
          Selected Vertices: {selectedVertexPositions.length}
        </div>
        {selectedVertexPositions.slice(0, 4).map((v) => (
          <div key={v.index} className="grid grid-cols-3 gap-0.5 text-[10px] font-mono text-muted-foreground">
            <span>{v.pos[0].toFixed(2)}</span>
            <span>{v.pos[1].toFixed(2)}</span>
            <span>{v.pos[2].toFixed(2)}</span>
          </div>
        ))}
        {selectedVertexPositions.length > 4 && (
          <div className="text-[10px] text-muted-foreground">
            +{selectedVertexPositions.length - 4} more
          </div>
        )}
        <div className="text-[10px] text-muted-foreground">
          Drag to move | Shift+drag for axis lock
        </div>
      </div>
    )
  }

  if (mode === "edge" && selectedEdgeIndices.length > 0) {
    return (
      <div className="space-y-1">
        <Separator />
        <div className="text-[10px] font-medium uppercase text-muted-foreground">
          Selected Edges: {selectedEdgeIndices.length}
        </div>
      </div>
    )
  }

  return null
}

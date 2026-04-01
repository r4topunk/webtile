"use client"

import { useEffect, useRef } from "react"
import {
  Focus,
  Copy,
  Trash2,
  Monitor,
  ArrowUp,
  ArrowRight,
  Grid3X3,
  Magnet,
  Camera,
  Box,
  Paintbrush,
  MousePointer,
  Move3D,
  Maximize,
} from "lucide-react"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"

type MenuItem =
  | { type: "item"; label: string; shortcut?: string; icon?: React.ReactNode; action: () => void }
  | { type: "separator" }

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

export function ViewportContextMenu({ x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const mode = useEditorStore((s) => s.mode)
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const showGrid = useEditorStore((s) => s.showGrid)
  const snapEnabled = useEditorStore((s) => s.snapEnabled)
  const cameraType = useEditorStore((s) => s.cameraType)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("mousedown", handleClick)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("mousedown", handleClick)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  // Adjust position so menu doesn't overflow viewport
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const parent = menuRef.current.parentElement?.getBoundingClientRect()
    if (!parent) return
    if (rect.right > parent.right) {
      menuRef.current.style.left = `${x - rect.width}px`
    }
    if (rect.bottom > parent.bottom) {
      menuRef.current.style.top = `${y - rect.height}px`
    }
  }, [x, y])

  const items: MenuItem[] = []

  if (mode === "object") {
    if (selectedIds.length > 0) {
      items.push({
        type: "item",
        label: "Focus",
        shortcut: "F",
        icon: <Focus className="h-3.5 w-3.5" />,
        action: () => {
          const obj = useSceneStore.getState().objects[selectedIds[0]]
          if (obj) useEditorStore.getState().setFocusTarget(obj.position)
          onClose()
        },
      })
      items.push({
        type: "item",
        label: "Duplicate",
        shortcut: "Ctrl+D",
        icon: <Copy className="h-3.5 w-3.5" />,
        action: () => {
          useSceneStore.getState().duplicateObjects(selectedIds)
          onClose()
        },
      })
      items.push({
        type: "item",
        label: "Delete",
        shortcut: "Del",
        icon: <Trash2 className="h-3.5 w-3.5" />,
        action: () => {
          useSceneStore.getState().removeObjects(selectedIds)
          onClose()
        },
      })
      items.push({ type: "separator" })
    } else {
      items.push({
        type: "item",
        label: "Place Tile",
        icon: <Box className="h-3.5 w-3.5" />,
        action: () => {
          useEditorStore.getState().setTool("place")
          onClose()
        },
      })
    }
    items.push({
      type: "item",
      label: "Front View",
      shortcut: "1",
      icon: <Monitor className="h-3.5 w-3.5" />,
      action: () => {
        useEditorStore.getState().setCameraPreset("front")
        onClose()
      },
    })
    items.push({
      type: "item",
      label: "Top View",
      shortcut: "3",
      icon: <ArrowUp className="h-3.5 w-3.5" />,
      action: () => {
        useEditorStore.getState().setCameraPreset("top")
        onClose()
      },
    })
    items.push({
      type: "item",
      label: "Right View",
      shortcut: "2",
      icon: <ArrowRight className="h-3.5 w-3.5" />,
      action: () => {
        useEditorStore.getState().setCameraPreset("right")
        onClose()
      },
    })
  }

  if (mode === "face") {
    items.push({
      type: "item",
      label: "Extrude",
      shortcut: "E",
      icon: <Move3D className="h-3.5 w-3.5" />,
      action: () => {
        const scene = useSceneStore.getState()
        if (scene.selectedIds.length === 1 && scene.selectedFaceIds.length > 0) {
          scene.extrudeFaces(scene.selectedIds[0], scene.selectedFaceIds)
        }
        onClose()
      },
    })
    items.push({
      type: "item",
      label: "Delete Faces",
      shortcut: "Del",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      action: () => {
        const scene = useSceneStore.getState()
        if (scene.selectedIds.length === 1 && scene.selectedFaceIds.length > 0) {
          scene.removeFaces(scene.selectedIds[0], scene.selectedFaceIds)
        }
        onClose()
      },
    })
    items.push({
      type: "item",
      label: "Paint Face",
      icon: <Paintbrush className="h-3.5 w-3.5" />,
      action: () => {
        useEditorStore.getState().setTool("paint")
        onClose()
      },
    })
    items.push({
      type: "item",
      label: "Select All Faces",
      shortcut: "A",
      icon: <Maximize className="h-3.5 w-3.5" />,
      action: () => {
        const scene = useSceneStore.getState()
        if (scene.selectedIds.length === 1) {
          const obj = scene.objects[scene.selectedIds[0]]
          if (obj) {
            scene.setSelectedFaces(obj.faces.map((f) => f.id))
          }
        }
        onClose()
      },
    })
  }

  if (mode === "vertex") {
    items.push({
      type: "item",
      label: "Snap to Grid",
      icon: <Magnet className="h-3.5 w-3.5" />,
      action: () => {
        // Snap selected vertices to nearest grid point
        const scene = useSceneStore.getState()
        const editor = useEditorStore.getState()
        if (scene.selectedIds.length === 1 && scene.selectedVertexIndices.length > 0) {
          const obj = scene.objects[scene.selectedIds[0]]
          if (obj) {
            const snap = editor.snapSize
            let vi = 0
            for (const face of obj.faces) {
              for (let v = 0; v < 4; v++) {
                if (scene.selectedVertexIndices.includes(vi)) {
                  const delta: [number, number, number] = [
                    Math.round(face.vertices[v][0] / snap) * snap - face.vertices[v][0],
                    Math.round(face.vertices[v][1] / snap) * snap - face.vertices[v][1],
                    Math.round(face.vertices[v][2] / snap) * snap - face.vertices[v][2],
                  ]
                  scene.moveVertices(scene.selectedIds[0], [vi], delta)
                }
                vi++
              }
            }
          }
        }
        onClose()
      },
    })
    items.push({
      type: "item",
      label: "Select All Vertices",
      shortcut: "A",
      icon: <MousePointer className="h-3.5 w-3.5" />,
      action: () => {
        const scene = useSceneStore.getState()
        if (scene.selectedIds.length === 1) {
          const obj = scene.objects[scene.selectedIds[0]]
          if (obj) {
            const count = obj.faces.length * 4
            scene.setSelectedVertices(Array.from({ length: count }, (_, i) => i))
          }
        }
        onClose()
      },
    })
  }

  if (mode === "edge") {
    items.push({
      type: "item",
      label: "Select All Edges",
      shortcut: "A",
      icon: <MousePointer className="h-3.5 w-3.5" />,
      action: () => {
        const scene = useSceneStore.getState()
        if (scene.selectedIds.length === 1) {
          const obj = scene.objects[scene.selectedIds[0]]
          if (obj) {
            const edges: [number, number][] = []
            let vi = 0
            for (const face of obj.faces) {
              for (let v = 0; v < 4; v++) {
                edges.push([vi + v, vi + ((v + 1) % 4)])
              }
              vi += 4
            }
            scene.setSelectedEdges(edges)
          }
        }
        onClose()
      },
    })
  }

  // Always at bottom
  items.push({ type: "separator" })
  items.push({
    type: "item",
    label: `${showGrid ? "Hide" : "Show"} Grid`,
    shortcut: "G",
    icon: <Grid3X3 className="h-3.5 w-3.5" />,
    action: () => {
      useEditorStore.getState().toggleGrid()
      onClose()
    },
  })
  items.push({
    type: "item",
    label: `${snapEnabled ? "Disable" : "Enable"} Snap`,
    icon: <Magnet className="h-3.5 w-3.5" />,
    action: () => {
      useEditorStore.getState().toggleSnap()
      onClose()
    },
  })
  items.push({
    type: "item",
    label: `Camera: ${cameraType === "orthographic" ? "Perspective" : "Ortho"}`,
    shortcut: "5",
    icon: <Camera className="h-3.5 w-3.5" />,
    action: () => {
      useEditorStore.getState().toggleCameraType()
      onClose()
    },
  })

  return (
    <div
      ref={menuRef}
      className="absolute z-50 min-w-[180px] rounded-md border border-neutral-700 bg-neutral-800 p-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) =>
        item.type === "separator" ? (
          <div key={i} className="my-1 h-px bg-neutral-700" />
        ) : (
          <button
            key={i}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-700"
            onClick={item.action}
          >
            {item.icon && <span className="text-neutral-400">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="ml-4 text-[10px] text-neutral-500">{item.shortcut}</span>
            )}
          </button>
        ),
      )}
    </div>
  )
}

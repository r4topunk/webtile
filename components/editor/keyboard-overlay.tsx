"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { useEditorStore } from "@/store/editor-store"

const shortcuts = [
  {
    category: "Tools",
    items: [
      { key: "V", desc: "Select tool" },
      { key: "B", desc: "Place tile" },
      { key: "P", desc: "Paint tool" },
    ],
  },
  {
    category: "Edit Modes",
    items: [
      { key: "Tab", desc: "Cycle modes" },
      { key: "1", desc: "Object mode / XZ plane" },
      { key: "2", desc: "Face mode / XY plane" },
      { key: "3", desc: "Vertex mode / YZ plane" },
    ],
  },
  {
    category: "Camera",
    items: [
      { key: "0", desc: "Reset camera" },
      { key: "5", desc: "Toggle Ortho/Perspective" },
      { key: "F", desc: "Focus on selection" },
      { key: "Right-drag", desc: "Orbit" },
      { key: "Middle-drag", desc: "Pan" },
      { key: "Pinch", desc: "Zoom" },
    ],
  },
  {
    category: "Editing",
    items: [
      { key: "E", desc: "Extrude faces" },
      { key: "S", desc: "Subdivide edge" },
      { key: "Delete", desc: "Delete selected (faces/vertices/objects)" },
      { key: "Ctrl+D", desc: "Duplicate" },
      { key: "G", desc: "Toggle grid" },
    ],
  },
  {
    category: "Vertex Drag",
    items: [
      { key: "X / Y / Z", desc: "Lock to axis" },
      { key: "Shift", desc: "Auto-detect axis" },
      { key: "Ctrl", desc: "Toggle snap" },
    ],
  },
  {
    category: "File",
    items: [
      { key: "Ctrl+S", desc: "Save project" },
      { key: "Ctrl+O", desc: "Open project" },
      { key: "Ctrl+E", desc: "Export" },
      { key: "Ctrl+Z", desc: "Undo" },
      { key: "Ctrl+Shift+Z", desc: "Redo" },
    ],
  },
  {
    category: "Plane",
    items: [
      { key: "Shift+Scroll", desc: "Adjust offset" },
      { key: "Shift +/-", desc: "Adjust plane offset" },
    ],
  },
]

export function KeyboardOverlay() {
  const show = useEditorStore((s) => s.showKeyboardOverlay)
  const toggle = useEditorStore((s) => s.toggleKeyboardOverlay)

  useEffect(() => {
    if (!show) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [show, toggle])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggle()
      }}
    >
      <div className="mx-auto mt-20 max-w-4xl rounded-lg border border-neutral-700 bg-neutral-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-neutral-500">Press ? to close</p>
          </div>
          <button
            onClick={toggle}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="mb-2 text-xs uppercase tracking-wider text-neutral-400">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-neutral-300">
                      {item.desc}
                    </span>
                    <kbd className="min-w-[2rem] rounded bg-neutral-700 px-2 py-0.5 text-center font-mono text-xs text-neutral-200">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      // Ctrl+Z / Ctrl+Shift+Z — undo/redo
      if (ctrl && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (shift) {
          useSceneStore.temporal.getState().redo()
        } else {
          useSceneStore.temporal.getState().undo()
        }
        return
      }

      // Ctrl+D — duplicate selected
      if (ctrl && e.key.toLowerCase() === "d") {
        e.preventDefault()
        const { selectedIds, duplicateObjects } = useSceneStore.getState()
        if (selectedIds.length > 0) {
          duplicateObjects(selectedIds)
        }
        return
      }

      // Non-modifier shortcuts
      if (ctrl) return

      switch (e.key) {
        case "v":
        case "V":
          useEditorStore.getState().setTool("select")
          break
        case "b":
        case "B":
          useEditorStore.getState().setTool("place")
          break
        case "1":
          useEditorStore.getState().setPlacementPlane("xz")
          break
        case "2":
          useEditorStore.getState().setPlacementPlane("xy")
          break
        case "3":
          useEditorStore.getState().setPlacementPlane("yz")
          break
        case "5":
          useEditorStore.getState().toggleCameraType()
          break
        case "g":
        case "G":
          useEditorStore.getState().toggleGrid()
          break
        case "Delete":
        case "Backspace": {
          const { selectedIds, removeObjects } = useSceneStore.getState()
          if (selectedIds.length > 0) {
            removeObjects(selectedIds)
          }
          break
        }
      }
    }

    function handleWheel(e: WheelEvent) {
      if (!e.shiftKey) return
      e.preventDefault()
      if (e.deltaY < 0) {
        useEditorStore.getState().incrementPlacementOffset()
      } else {
        useEditorStore.getState().decrementPlacementOffset()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("wheel", handleWheel)
    }
  }, [])
}

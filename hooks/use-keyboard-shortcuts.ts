"use client"

import { useEffect } from "react"
import { useEditorStore } from "@/store/editor-store"
import { useSceneStore } from "@/store/scene-store"
import { useAnimationStore } from "@/store/animation-store"
import { saveProjectToFile, loadProjectFromFile } from "@/lib/file-io"

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

      // Ctrl+S — save project
      if (ctrl && e.key.toLowerCase() === "s") {
        e.preventDefault()
        saveProjectToFile()
        return
      }

      // Ctrl+O — open project
      if (ctrl && e.key.toLowerCase() === "o") {
        e.preventDefault()
        loadProjectFromFile()
        return
      }

      // Ctrl+E — open export dialog
      if (ctrl && e.key.toLowerCase() === "e") {
        e.preventDefault()
        useEditorStore.getState().setExportDialogOpen(true)
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

      const editorState = useEditorStore.getState()
      const sceneState = useSceneStore.getState()
      const animState = useAnimationStore.getState()

      switch (e.key) {
        case "v":
        case "V":
          editorState.setTool("select")
          break
        case "b":
        case "B":
          editorState.setTool("place")
          break
        case "p":
        case "P":
          editorState.setTool("paint")
          break
        case "f":
        case "F": {
          // Focus camera on selected object
          const { selectedIds, objects } = sceneState
          if (selectedIds.length === 1) {
            const obj = objects[selectedIds[0]]
            if (obj) {
              // Compute center of the object's faces
              let cx = 0, cy = 0, cz = 0, count = 0
              for (const face of obj.faces) {
                for (const v of face.vertices) {
                  cx += v[0] + obj.position[0]
                  cy += v[1] + obj.position[1]
                  cz += v[2] + obj.position[2]
                  count++
                }
              }
              if (count > 0) {
                editorState.setFocusTarget([cx / count, cy / count, cz / count])
              }
            }
          }
          break
        }
        case "Tab": {
          e.preventDefault()
          const modeOrder: Array<"object" | "face" | "vertex" | "edge"> = [
            "object",
            "face",
            "vertex",
            "edge",
          ]
          const currentIdx = modeOrder.indexOf(editorState.mode)
          const nextIdx = (currentIdx + 1) % modeOrder.length
          editorState.setMode(modeOrder[nextIdx])
          // Clear sub-object selections when switching modes
          sceneState.clearFaceSelection()
          sceneState.clearVertexSelection()
          sceneState.clearEdgeSelection()
          break
        }
        case "e":
        case "E": {
          // Extrude selected faces
          if (editorState.mode === "face") {
            const { selectedIds, selectedFaceIds, extrudeFaces } = sceneState
            if (selectedIds.length === 1 && selectedFaceIds.length > 0) {
              extrudeFaces(selectedIds[0], selectedFaceIds)
            }
          }
          break
        }
        case "1":
          editorState.setPlacementPlane("xz")
          break
        case "2":
          editorState.setPlacementPlane("xy")
          break
        case "3":
          editorState.setPlacementPlane("yz")
          break
        case "5":
          editorState.toggleCameraType()
          break
        case "g":
        case "G":
          editorState.toggleGrid()
          break
        // Camera presets (numpad)
        case "End": // Numpad 1
          editorState.setCameraPreset("front")
          break
        case "Home": // Numpad 7
          editorState.setCameraPreset("top")
          break
        case "PageDown": // Numpad 3
          editorState.setCameraPreset("right")
          break
        // Space — toggle animation playback
        case " ": {
          e.preventDefault()
          if (animState.isPlaying) {
            animState.pause()
          } else {
            animState.play()
          }
          break
        }
        case "Delete":
        case "Backspace": {
          // In face mode, delete selected faces instead of objects
          if (editorState.mode === "face") {
            const { selectedIds, selectedFaceIds, removeFaces } = sceneState
            if (selectedIds.length === 1 && selectedFaceIds.length > 0) {
              removeFaces(selectedIds[0], selectedFaceIds)
            }
          } else {
            const { selectedIds, removeObjects } = sceneState
            if (selectedIds.length > 0) {
              removeObjects(selectedIds)
            }
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

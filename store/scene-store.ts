import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { SceneFace, SceneObject, Vec3 } from "@/lib/types"

interface SceneState {
  objects: Record<string, SceneObject>
  selectedIds: string[]

  addObject: (obj: SceneObject) => void
  removeObject: (id: string) => void
  addFaceToObject: (objectId: string, face: SceneFace) => void
  updateObjectPosition: (id: string, position: Vec3) => void
  updateObjectRotation: (id: string, rotation: Vec3) => void
  updateObjectScale: (id: string, scale: Vec3) => void
  setSelection: (ids: string[]) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void

  /** Create a new object with a single face and return its id */
  placeNewTile: (face: SceneFace) => string
}

let objectCounter = 0

export const useSceneStore = create<SceneState>()(
  immer((set) => ({
    objects: {},
    selectedIds: [],

    addObject: (obj) =>
      set((state) => {
        state.objects[obj.id] = obj
      }),

    removeObject: (id) =>
      set((state) => {
        delete state.objects[id]
        state.selectedIds = state.selectedIds.filter((sid) => sid !== id)
      }),

    addFaceToObject: (objectId, face) =>
      set((state) => {
        const obj = state.objects[objectId]
        if (obj) obj.faces.push(face)
      }),

    updateObjectPosition: (id, position) =>
      set((state) => {
        const obj = state.objects[id]
        if (obj) obj.position = position
      }),

    updateObjectRotation: (id, rotation) =>
      set((state) => {
        const obj = state.objects[id]
        if (obj) obj.rotation = rotation
      }),

    updateObjectScale: (id, scale) =>
      set((state) => {
        const obj = state.objects[id]
        if (obj) obj.scale = scale
      }),

    setSelection: (ids) => set({ selectedIds: ids }),
    toggleSelection: (id) =>
      set((state) => {
        const idx = state.selectedIds.indexOf(id)
        if (idx >= 0) {
          state.selectedIds.splice(idx, 1)
        } else {
          state.selectedIds.push(id)
        }
      }),
    clearSelection: () => set({ selectedIds: [] }),

    placeNewTile: (face) => {
      const id = crypto.randomUUID()
      objectCounter++
      const obj: SceneObject = {
        id,
        name: `Tile ${objectCounter}`,
        parentId: null,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        faces: [face],
        visible: true,
        locked: false,
      }
      set((state) => {
        state.objects[id] = obj
      })
      return id
    },
  })),
)

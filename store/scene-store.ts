import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { temporal } from "zundo"
import type { SceneFace, SceneObject, Vec3 } from "@/lib/types"

interface SceneState {
  objects: Record<string, SceneObject>
  selectedIds: string[]

  addObject: (obj: SceneObject) => void
  removeObject: (id: string) => void
  removeObjects: (ids: string[]) => void
  addFaceToObject: (objectId: string, face: SceneFace) => void
  updateObjectPosition: (id: string, position: Vec3) => void
  updateObjectRotation: (id: string, rotation: Vec3) => void
  updateObjectScale: (id: string, scale: Vec3) => void
  setSelection: (ids: string[]) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  duplicateObjects: (ids: string[]) => string[]

  /** Create a new object with a single face and return its id */
  placeNewTile: (face: SceneFace) => string
}

let objectCounter = 0

export const useSceneStore = create<SceneState>()(
  temporal(
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

      removeObjects: (ids) =>
        set((state) => {
          for (const id of ids) {
            delete state.objects[id]
          }
          state.selectedIds = state.selectedIds.filter((sid) => !ids.includes(sid))
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

      duplicateObjects: (ids) => {
        const newIds: string[] = []
        set((state) => {
          for (const id of ids) {
            const original = state.objects[id]
            if (!original) continue
            const newId = crypto.randomUUID()
            objectCounter++
            const clone: SceneObject = {
              id: newId,
              name: `${original.name} copy`,
              parentId: original.parentId,
              position: [
                original.position[0] + 1,
                original.position[1],
                original.position[2],
              ],
              rotation: [...original.rotation] as Vec3,
              scale: [...original.scale] as Vec3,
              faces: original.faces.map((f) => ({
                ...f,
                id: crypto.randomUUID(),
                vertices: f.vertices.map((v) => [...v]) as [Vec3, Vec3, Vec3, Vec3],
                uvs: f.uvs.map((u) => [...u]) as SceneFace["uvs"],
              })),
              visible: original.visible,
              locked: false,
            }
            state.objects[newId] = clone
            newIds.push(newId)
          }
          state.selectedIds = newIds
        })
        return newIds
      },

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
    {
      limit: 100,
      equality: (pastState, currentState) =>
        JSON.stringify(pastState.objects) === JSON.stringify(currentState.objects) &&
        JSON.stringify(pastState.selectedIds) === JSON.stringify(currentState.selectedIds),
    },
  ),
)

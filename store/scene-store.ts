import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { temporal } from "zundo"
import type { SceneFace, SceneObject, TileRef, Vec2, Vec3 } from "@/lib/types"
import { extrudeFace, computeTileUVs } from "@/lib/geometry"
import { useToastStore } from "@/store/toast-store"

interface SceneState {
  objects: Record<string, SceneObject>
  objectOrder: string[]
  selectedIds: string[]

  // Sub-object selection (face/vertex/edge modes)
  selectedFaceIds: string[]
  selectedVertexIndices: number[]
  selectedEdgeIndices: [number, number][]

  addObject: (obj: SceneObject) => void
  removeObject: (id: string) => void
  removeObjects: (ids: string[]) => void
  addFaceToObject: (objectId: string, face: SceneFace) => void
  updateObjectPosition: (id: string, position: Vec3) => void
  updateObjectRotation: (id: string, rotation: Vec3) => void
  updateObjectScale: (id: string, scale: Vec3) => void
  updateObjectName: (id: string, name: string) => void
  toggleObjectVisibility: (id: string) => void
  toggleObjectLock: (id: string) => void
  setObjectParent: (id: string, parentId: string | null) => void
  reorderObject: (id: string, direction: "up" | "down") => void
  setSelection: (ids: string[]) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  duplicateObjects: (ids: string[]) => string[]
  clearAll: () => void
  loadObjects: (objects: Record<string, SceneObject>, order: string[]) => void

  // Face mode
  setSelectedFaces: (ids: string[]) => void
  toggleFaceSelection: (id: string) => void
  clearFaceSelection: () => void
  removeFaces: (objectId: string, faceIds: string[]) => void
  extrudeFaces: (objectId: string, faceIds: string[], distance?: number) => void

  // Vertex mode
  setSelectedVertices: (indices: number[]) => void
  toggleVertexSelection: (index: number) => void
  clearVertexSelection: () => void
  moveVertices: (objectId: string, vertexIndices: number[], delta: Vec3) => void

  // Vertex mode (delete)
  deleteVertices: (objectId: string, vertexIndices: number[]) => void

  // Edge mode
  setSelectedEdges: (edges: [number, number][]) => void
  toggleEdgeSelection: (edge: [number, number]) => void
  clearEdgeSelection: () => void
  subdivideEdge: (objectId: string, edgeIndices: [number, number]) => void

  // Paint mode
  paintFace: (objectId: string, faceId: string, tileRef: TileRef, tilesetColumns: number, tilesetRows: number) => void

  // UV editing
  updateFaceUVs: (objectId: string, faceId: string, uvs: [Vec2, Vec2, Vec2, Vec2]) => void

  /** Create a new object with a single face and return its id */
  placeNewTile: (face: SceneFace) => string
}

let objectCounter = 0

export const useSceneStore = create<SceneState>()(
  temporal(
    immer((set) => ({
      objects: {},
      objectOrder: [],
      selectedIds: [],
      selectedFaceIds: [],
      selectedVertexIndices: [],
      selectedEdgeIndices: [],

      addObject: (obj) =>
        set((state) => {
          state.objects[obj.id] = obj
          if (!state.objectOrder.includes(obj.id)) {
            state.objectOrder.push(obj.id)
          }
        }),

      removeObject: (id) =>
        set((state) => {
          delete state.objects[id]
          state.objectOrder = state.objectOrder.filter((oid) => oid !== id)
          state.selectedIds = state.selectedIds.filter((sid) => sid !== id)
        }),

      removeObjects: (ids) => {
        set((state) => {
          const idSet = new Set(ids)
          for (const id of ids) {
            delete state.objects[id]
          }
          state.objectOrder = state.objectOrder.filter((oid) => !idSet.has(oid))
          state.selectedIds = state.selectedIds.filter((sid) => !idSet.has(sid))
        })
        useToastStore.getState().addToast("Objects deleted", "success")
      },

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

      updateObjectName: (id, name) =>
        set((state) => {
          const obj = state.objects[id]
          if (obj) obj.name = name
        }),

      toggleObjectVisibility: (id) =>
        set((state) => {
          const obj = state.objects[id]
          if (obj) obj.visible = !obj.visible
        }),

      toggleObjectLock: (id) =>
        set((state) => {
          const obj = state.objects[id]
          if (obj) obj.locked = !obj.locked
        }),

      setObjectParent: (id, parentId) =>
        set((state) => {
          const obj = state.objects[id]
          if (obj) obj.parentId = parentId
        }),

      reorderObject: (id, direction) =>
        set((state) => {
          const idx = state.objectOrder.indexOf(id)
          if (idx < 0) return
          const target = direction === "up" ? idx - 1 : idx + 1
          if (target < 0 || target >= state.objectOrder.length) return
          const temp = state.objectOrder[target]
          state.objectOrder[target] = state.objectOrder[idx]
          state.objectOrder[idx] = temp
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
            state.objectOrder.push(newId)
            newIds.push(newId)
          }
          state.selectedIds = newIds
        })
        useToastStore.getState().addToast("Objects duplicated", "success")
        return newIds
      },

      clearAll: () =>
        set((state) => {
          state.objects = {}
          state.objectOrder = []
          state.selectedIds = []
          state.selectedFaceIds = []
          state.selectedVertexIndices = []
          state.selectedEdgeIndices = []
        }),

      loadObjects: (objects, order) =>
        set((state) => {
          state.objects = objects as Record<string, SceneObject>
          state.objectOrder = order
          state.selectedIds = []
          state.selectedFaceIds = []
          state.selectedVertexIndices = []
          state.selectedEdgeIndices = []
        }),

      // Face mode
      setSelectedFaces: (ids) => set({ selectedFaceIds: ids }),
      toggleFaceSelection: (id) =>
        set((state) => {
          const idx = state.selectedFaceIds.indexOf(id)
          if (idx >= 0) {
            state.selectedFaceIds.splice(idx, 1)
          } else {
            state.selectedFaceIds.push(id)
          }
        }),
      clearFaceSelection: () => set({ selectedFaceIds: [] }),

      removeFaces: (objectId, faceIds) => {
        set((state) => {
          const obj = state.objects[objectId]
          if (!obj) return
          const removeSet = new Set(faceIds)
          obj.faces = obj.faces.filter((f) => !removeSet.has(f.id))
          state.selectedFaceIds = state.selectedFaceIds.filter((id) => !removeSet.has(id))
          // If object has no faces left, remove it
          if (obj.faces.length === 0) {
            delete state.objects[objectId]
            state.selectedIds = state.selectedIds.filter((id) => id !== objectId)
          }
        })
        useToastStore.getState().addToast("Faces deleted", "success")
      },

      extrudeFaces: (objectId, faceIds, distance = 1) => {
        set((state) => {
          const obj = state.objects[objectId]
          if (!obj) return
          const faceIdSet = new Set(faceIds)
          const newFaceIds: string[] = []
          const facesToAdd: SceneFace[] = []

          for (let i = obj.faces.length - 1; i >= 0; i--) {
            const face = obj.faces[i]
            if (!faceIdSet.has(face.id)) continue
            // Extrude this face: remove original, add extruded faces
            const extruded = extrudeFace(face, distance)
            obj.faces.splice(i, 1)
            facesToAdd.push(...extruded)
            // The first face in extruded is the top face — select it
            newFaceIds.push(extruded[0].id)
          }

          obj.faces.push(...facesToAdd)
          // Select the new top faces
          state.selectedFaceIds = newFaceIds
        })
        useToastStore.getState().addToast("Faces extruded", "success")
      },

      // Vertex mode
      setSelectedVertices: (indices) => set({ selectedVertexIndices: indices }),
      toggleVertexSelection: (index) =>
        set((state) => {
          const idx = state.selectedVertexIndices.indexOf(index)
          if (idx >= 0) {
            state.selectedVertexIndices.splice(idx, 1)
          } else {
            state.selectedVertexIndices.push(index)
          }
        }),
      clearVertexSelection: () => set({ selectedVertexIndices: [] }),

      moveVertices: (objectId, vertexIndices, delta) =>
        set((state) => {
          const obj = state.objects[objectId]
          if (!obj) return
          // Build a set of unique vertex positions to move.
          // vertexIndices here refer to the flattened index across all face vertices.
          // Each face has 4 vertices, so faceIndex = floor(idx/4), vertexInFace = idx%4
          const indexSet = new Set(vertexIndices)
          let vi = 0
          for (const face of obj.faces) {
            for (let v = 0; v < 4; v++) {
              if (indexSet.has(vi)) {
                face.vertices[v] = [
                  face.vertices[v][0] + delta[0],
                  face.vertices[v][1] + delta[1],
                  face.vertices[v][2] + delta[2],
                ]
              }
              vi++
            }
          }
        }),

      deleteVertices: (objectId, vertexIndices) => {
        set((state) => {
          const obj = state.objects[objectId]
          if (!obj) return

          // Convert vertex indices to face indices
          // Each face has 4 vertices, so faceIndex = Math.floor(vertexIndex / 4)
          const faceIndicesToRemove = new Set<number>()
          for (const vi of vertexIndices) {
            faceIndicesToRemove.add(Math.floor(vi / 4))
          }

          // Get face IDs to remove
          const faceIdsToRemove = new Set<string>()
          obj.faces.forEach((face, i) => {
            if (faceIndicesToRemove.has(i)) {
              faceIdsToRemove.add(face.id)
            }
          })

          // Remove faces
          obj.faces = obj.faces.filter((f) => !faceIdsToRemove.has(f.id))

          // Clear vertex selection
          state.selectedVertexIndices = []
          state.selectedFaceIds = state.selectedFaceIds.filter(
            (id) => !faceIdsToRemove.has(id),
          )

          // If object has no faces left, remove it
          if (obj.faces.length === 0) {
            delete state.objects[objectId]
            state.objectOrder = state.objectOrder.filter((id) => id !== objectId)
            state.selectedIds = state.selectedIds.filter((id) => id !== objectId)
          }
        })
        useToastStore.getState().addToast("Vertices deleted", "success")
      },

      // Edge mode
      setSelectedEdges: (edges) => set({ selectedEdgeIndices: edges }),
      toggleEdgeSelection: (edge) =>
        set((state) => {
          const idx = state.selectedEdgeIndices.findIndex(
            (e) => (e[0] === edge[0] && e[1] === edge[1]) || (e[0] === edge[1] && e[1] === edge[0]),
          )
          if (idx >= 0) {
            state.selectedEdgeIndices.splice(idx, 1)
          } else {
            state.selectedEdgeIndices.push(edge)
          }
        }),
      clearEdgeSelection: () => set({ selectedEdgeIndices: [] }),

      subdivideEdge: (objectId, edgeIndices) => {
        set((state) => {
          const obj = state.objects[objectId]
          if (!obj) return

          const [idxA, idxB] = edgeIndices
          const faceIdxA = Math.floor(idxA / 4)
          const faceIdxB = Math.floor(idxB / 4)

          // The edge must be on the same face
          if (faceIdxA !== faceIdxB) return

          const faceIdx = faceIdxA
          const face = obj.faces[faceIdx]
          if (!face) return

          const localA = idxA % 4
          const localB = idxB % 4

          // Check if edge is consecutive (not diagonal)
          const isConsecutive = localB === (localA + 1) % 4 || localA === (localB + 1) % 4

          if (!isConsecutive) return // Skip diagonal edges

          // Normalize so that localB = (localA + 1) % 4
          let normA = localA
          let normB = localB
          if (localA === (localB + 1) % 4) {
            normA = localB
            normB = localA
          }

          // Compute midpoint of the edge (deep copy)
          const midpoint: Vec3 = [
            (face.vertices[normA][0] + face.vertices[normB][0]) / 2,
            (face.vertices[normA][1] + face.vertices[normB][1]) / 2,
            (face.vertices[normA][2] + face.vertices[normB][2]) / 2,
          ]

          const midUV: Vec2 = [
            (face.uvs[normA][0] + face.uvs[normB][0]) / 2,
            (face.uvs[normA][1] + face.uvs[normB][1]) / 2,
          ]

          // Find the opposite edge vertices
          const prevA = (normA + 3) % 4
          const nextB = (normB + 1) % 4

          // Midpoint of opposite edge (deep copy)
          const oppMidpoint: Vec3 = [
            (face.vertices[prevA][0] + face.vertices[nextB][0]) / 2,
            (face.vertices[prevA][1] + face.vertices[nextB][1]) / 2,
            (face.vertices[prevA][2] + face.vertices[nextB][2]) / 2,
          ]

          const oppMidUV: Vec2 = [
            (face.uvs[prevA][0] + face.uvs[nextB][0]) / 2,
            (face.uvs[prevA][1] + face.uvs[nextB][1]) / 2,
          ]

          // Split into two quads
          const face1Verts: [Vec3, Vec3, Vec3, Vec3] = [
            [...face.vertices[normA]] as Vec3,
            [...midpoint] as Vec3,
            [...oppMidpoint] as Vec3,
            [...face.vertices[prevA]] as Vec3,
          ]
          const face1UVs: [Vec2, Vec2, Vec2, Vec2] = [
            [...face.uvs[normA]] as Vec2,
            [...midUV] as Vec2,
            [...oppMidUV] as Vec2,
            [...face.uvs[prevA]] as Vec2,
          ]

          const face2Verts: [Vec3, Vec3, Vec3, Vec3] = [
            [...midpoint] as Vec3,
            [...face.vertices[normB]] as Vec3,
            [...face.vertices[nextB]] as Vec3,
            [...oppMidpoint] as Vec3,
          ]
          const face2UVs: [Vec2, Vec2, Vec2, Vec2] = [
            [...midUV] as Vec2,
            [...face.uvs[normB]] as Vec2,
            [...face.uvs[nextB]] as Vec2,
            [...oppMidUV] as Vec2,
          ]

          const newFace1: SceneFace = {
            id: crypto.randomUUID(),
            vertices: face1Verts,
            tileRef: face.tileRef ? { ...face.tileRef } : null,
            uvs: face1UVs,
          }

          const newFace2: SceneFace = {
            id: crypto.randomUUID(),
            vertices: face2Verts,
            tileRef: face.tileRef ? { ...face.tileRef } : null,
            uvs: face2UVs,
          }

          // Replace the original face with the two new faces
          const spliceIdx = obj.faces.indexOf(face)
          obj.faces.splice(spliceIdx, 1, newFace1, newFace2)

          // Clear selections
          state.selectedEdgeIndices = []
          state.selectedVertexIndices = []
        })
        useToastStore.getState().addToast("Edge subdivided", "success")
      },

      // Paint mode
      paintFace: (objectId, faceId, tileRef, tilesetColumns, tilesetRows) => {
        set((state) => {
          const obj = state.objects[objectId]
          if (!obj) return
          const face = obj.faces.find((f) => f.id === faceId)
          if (!face) return
          face.tileRef = tileRef
          face.uvs = computeTileUVs(tileRef, tilesetColumns, tilesetRows)
        })
        useToastStore.getState().addToast("Face painted", "success")
      },

      updateFaceUVs: (objectId, faceId, uvs) =>
        set((state) => {
          const obj = state.objects[objectId]
          if (!obj) return
          const face = obj.faces.find((f) => f.id === faceId)
          if (!face) return
          face.uvs = uvs
        }),

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
          state.objectOrder.push(id)
        })
        useToastStore.getState().addToast("Tile placed", "success")
        return id
      },
    })),
    {
      limit: 100,
      equality: (pastState, currentState) =>
        JSON.stringify(pastState.objects) === JSON.stringify(currentState.objects) &&
        JSON.stringify(pastState.objectOrder) === JSON.stringify(currentState.objectOrder) &&
        JSON.stringify(pastState.selectedIds) === JSON.stringify(currentState.selectedIds) &&
        JSON.stringify(pastState.selectedFaceIds) === JSON.stringify(currentState.selectedFaceIds) &&
        JSON.stringify(pastState.selectedVertexIndices) === JSON.stringify(currentState.selectedVertexIndices),
    },
  ),
)

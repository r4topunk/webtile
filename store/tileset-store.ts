import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Tileset, TileRef } from "@/lib/types"
import { disposeTilesetTexture } from "@/lib/texture-utils"

interface TilesetState {
  tilesets: Record<string, Tileset>
  activeTilesetId: string | null
  selectedTile: TileRef | null

  addTileset: (tileset: Tileset) => void
  removeTileset: (id: string) => void
  setActiveTileset: (id: string) => void
  setSelectedTile: (tile: TileRef | null) => void
  clearAll: () => void
  loadTilesets: (tilesets: Record<string, Tileset>) => void
}

export const useTilesetStore = create<TilesetState>()(
  immer((set) => ({
    tilesets: {},
    activeTilesetId: null,
    selectedTile: null,

    addTileset: (tileset) =>
      set((state) => {
        state.tilesets[tileset.id] = tileset
        if (!state.activeTilesetId) {
          state.activeTilesetId = tileset.id
        }
      }),

    removeTileset: (id) =>
      set((state) => {
        const tileset = state.tilesets[id]
        if (tileset) {
          disposeTilesetTexture(tileset.imageUrl)
        }
        delete state.tilesets[id]
        if (state.activeTilesetId === id) {
          const remaining = Object.keys(state.tilesets)
          state.activeTilesetId = remaining[0] ?? null
        }
        if (state.selectedTile?.tilesetId === id) {
          state.selectedTile = null
        }
      }),

    setActiveTileset: (id) => set({ activeTilesetId: id }),
    setSelectedTile: (tile) => set({ selectedTile: tile }),

    clearAll: () =>
      set((state) => {
        // Dispose all textures
        for (const tileset of Object.values(state.tilesets)) {
          disposeTilesetTexture(tileset.imageUrl)
        }
        state.tilesets = {}
        state.activeTilesetId = null
        state.selectedTile = null
      }),

    loadTilesets: (tilesets) =>
      set((state) => {
        state.tilesets = tilesets as Record<string, Tileset>
        const ids = Object.keys(tilesets)
        state.activeTilesetId = ids[0] ?? null
        state.selectedTile = null
      }),
  })),
)

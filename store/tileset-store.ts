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
  })),
)

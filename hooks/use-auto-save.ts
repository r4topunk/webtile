"use client"

import { useEffect, useRef } from "react"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"
import { autoSaveToLocalStorage } from "@/lib/file-io"

const DEBOUNCE_MS = 2000

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubScene = useSceneStore.subscribe(() => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        autoSaveToLocalStorage()
      }, DEBOUNCE_MS)
    })

    const unsubTileset = useTilesetStore.subscribe(() => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        autoSaveToLocalStorage()
      }, DEBOUNCE_MS)
    })

    return () => {
      unsubScene()
      unsubTileset()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
}

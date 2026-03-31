"use client"

import { Grid } from "@react-three/drei"
import { useEditorStore } from "@/store/editor-store"

export function GridOverlay() {
  const showGrid = useEditorStore((s) => s.showGrid)
  const gridSize = useEditorStore((s) => s.gridSize)

  if (!showGrid) return null

  return (
    <Grid
      args={[gridSize, gridSize]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#444"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#888"
      fadeDistance={gridSize * 2}
      fadeStrength={1}
      position={[0, -0.001, 0]}
      infiniteGrid
    />
  )
}

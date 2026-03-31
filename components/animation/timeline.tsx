"use client"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAnimationStore } from "@/store/animation-store"
import { useSceneStore } from "@/store/scene-store"
import { PlaybackControls } from "./playback-controls"
import type { Keyframe } from "@/store/animation-store"

const FRAME_WIDTH = 16
const HEADER_HEIGHT = 20
const TRACK_HEIGHT = 24
const KEYFRAME_SIZE = 10

export function Timeline() {
  const [collapsed, setCollapsed] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const currentFrame = useAnimationStore((s) => s.currentFrame)
  const totalFrames = useAnimationStore((s) => s.totalFrames)
  const keyframes = useAnimationStore((s) => s.keyframes)
  const setCurrentFrame = useAnimationStore((s) => s.setCurrentFrame)
  const addKeyframe = useAnimationStore((s) => s.addKeyframe)
  const removeKeyframe = useAnimationStore((s) => s.removeKeyframe)
  const isPlaying = useAnimationStore((s) => s.isPlaying)

  const selectedIds = useSceneStore((s) => s.selectedIds)
  const objects = useSceneStore((s) => s.objects)

  const selectedObjectId = selectedIds.length === 1 ? selectedIds[0] : null
  const selectedObject = selectedObjectId ? objects[selectedObjectId] : null

  const objectKeyframes = selectedObjectId
    ? keyframes.filter((kf) => kf.objectId === selectedObjectId)
    : []

  const frameToPixel = useCallback(
    (frame: number) => frame * FRAME_WIDTH,
    []
  )

  const pixelToFrame = useCallback(
    (px: number) => Math.max(0, Math.min(totalFrames - 1, Math.round(px / FRAME_WIDTH))),
    [totalFrames]
  )

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isPlaying) return
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollLeft = e.currentTarget.scrollLeft
    const x = e.clientX - rect.left + scrollLeft
    const frame = pixelToFrame(x)
    setCurrentFrame(frame)
  }

  function handleTrackDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isPlaying || !selectedObject) return
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollLeft = e.currentTarget.scrollLeft
    const x = e.clientX - rect.left + scrollLeft
    const frame = pixelToFrame(x)
    addKeyframe(
      selectedObject.id,
      frame,
      selectedObject.position,
      selectedObject.rotation,
      selectedObject.scale
    )
  }

  function handleKeyframeContextMenu(e: React.MouseEvent, kf: Keyframe) {
    e.preventDefault()
    e.stopPropagation()
    removeKeyframe(kf.id)
  }

  // Scrubber drag
  const isDragging = useRef(false)

  function handleScrubberPointerDown(e: React.PointerEvent) {
    if (isPlaying) return
    isDragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handleScrubberPointerMove(e: React.PointerEvent) {
    if (!isDragging.current || !trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const scrollLeft = trackRef.current.scrollLeft
    const x = e.clientX - rect.left + scrollLeft
    const frame = pixelToFrame(x)
    setCurrentFrame(frame)
  }

  function handleScrubberPointerUp() {
    isDragging.current = false
  }

  // Generate frame labels (every 5 frames)
  const frameLabels: number[] = []
  for (let i = 0; i < totalFrames; i += 5) {
    frameLabels.push(i)
  }

  const totalWidth = totalFrames * FRAME_WIDTH

  return (
    <div className="flex flex-col border-t bg-background">
      {/* Header bar — always visible */}
      <div className="flex h-8 items-center justify-between border-b px-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-xs"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "\u25B6" : "\u25BC"}
          </Button>
          <span className="text-xs font-medium">Timeline</span>
        </div>
        {!collapsed && <PlaybackControls />}
      </div>

      {/* Timeline body */}
      {!collapsed && (
        <div
          ref={trackRef}
          className="relative overflow-x-auto overflow-y-hidden"
          style={{ height: HEADER_HEIGHT + TRACK_HEIGHT + 16 }}
          onClick={handleTrackClick}
          onDoubleClick={handleTrackDoubleClick}
          onPointerMove={handleScrubberPointerMove}
          onPointerUp={handleScrubberPointerUp}
        >
          <div
            className="relative"
            style={{ width: totalWidth, minHeight: HEADER_HEIGHT + TRACK_HEIGHT + 16 }}
          >
            {/* Frame number ruler */}
            <div
              className="flex items-end border-b"
              style={{ height: HEADER_HEIGHT, width: totalWidth }}
            >
              {frameLabels.map((f) => (
                <span
                  key={f}
                  className="absolute text-[9px] text-muted-foreground"
                  style={{ left: frameToPixel(f), top: 2 }}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Track area */}
            <div
              className="relative"
              style={{ height: TRACK_HEIGHT + 16 }}
            >
              {/* Track label */}
              {selectedObject && (
                <div className="absolute left-0 top-0 z-10 flex h-6 items-center bg-background/80 px-1">
                  <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                    {selectedObject.name}
                  </span>
                </div>
              )}

              {/* Keyframe dots */}
              {objectKeyframes.map((kf) => (
                <div
                  key={kf.id}
                  className="absolute cursor-pointer"
                  style={{
                    left: frameToPixel(kf.frame) - KEYFRAME_SIZE / 2,
                    top: (TRACK_HEIGHT + 16) / 2 - KEYFRAME_SIZE / 2,
                    width: KEYFRAME_SIZE,
                    height: KEYFRAME_SIZE,
                  }}
                  onContextMenu={(e) => handleKeyframeContextMenu(e, kf)}
                  title={`Frame ${kf.frame} — right-click to delete`}
                >
                  <div
                    className="h-full w-full rotate-45 border border-amber-500 bg-amber-400"
                  />
                </div>
              ))}

              {/* Playhead / scrubber */}
              <div
                className="absolute top-0 z-20 cursor-col-resize"
                style={{
                  left: frameToPixel(currentFrame) - 1,
                  height: "100%",
                  width: 2,
                }}
                onPointerDown={handleScrubberPointerDown}
              >
                {/* Scrubber head */}
                <div className="relative -left-[5px] -top-[2px] h-3 w-3 bg-red-500" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
                {/* Scrubber line */}
                <div className="absolute left-0 top-2 h-full w-[2px] bg-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

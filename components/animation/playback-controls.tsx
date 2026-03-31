"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAnimationStore } from "@/store/animation-store"
import { useSceneStore } from "@/store/scene-store"

export function PlaybackControls() {
  const isPlaying = useAnimationStore((s) => s.isPlaying)
  const currentFrame = useAnimationStore((s) => s.currentFrame)
  const totalFrames = useAnimationStore((s) => s.totalFrames)
  const fps = useAnimationStore((s) => s.fps)
  const play = useAnimationStore((s) => s.play)
  const pause = useAnimationStore((s) => s.pause)
  const stop = useAnimationStore((s) => s.stop)
  const setFps = useAnimationStore((s) => s.setFps)
  const setTotalFrames = useAnimationStore((s) => s.setTotalFrames)
  const addKeyframe = useAnimationStore((s) => s.addKeyframe)

  const selectedIds = useSceneStore((s) => s.selectedIds)
  const objects = useSceneStore((s) => s.objects)

  function handleAddKeyframe() {
    if (selectedIds.length !== 1) return
    const obj = objects[selectedIds[0]]
    if (!obj) return
    addKeyframe(
      obj.id,
      currentFrame,
      obj.position,
      obj.rotation,
      obj.scale
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Play/Pause */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-xs"
            onClick={isPlaying ? pause : play}
          >
            {isPlaying ? "\u275A\u275A" : "\u25B6"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
      </Tooltip>

      {/* Stop */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-xs"
            onClick={stop}
          >
            {"\u25A0"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Stop</TooltipContent>
      </Tooltip>

      {/* Frame counter */}
      <span className="min-w-[60px] text-center text-xs text-muted-foreground tabular-nums">
        {currentFrame} / {totalFrames - 1}
      </span>

      {/* FPS input */}
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-muted-foreground">FPS</Label>
        <Input
          type="number"
          min={1}
          max={60}
          value={fps}
          onChange={(e) => setFps(parseInt(e.target.value) || 12)}
          className="h-6 w-12 px-1 text-xs"
        />
      </div>

      {/* Total frames input */}
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-muted-foreground">Frames</Label>
        <Input
          type="number"
          min={1}
          max={9999}
          value={totalFrames}
          onChange={(e) => setTotalFrames(parseInt(e.target.value) || 60)}
          className="h-6 w-16 px-1 text-xs"
        />
      </div>

      {/* Add keyframe button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleAddKeyframe}
            disabled={selectedIds.length !== 1}
          >
            + Key
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Add keyframe at current frame for selected object
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

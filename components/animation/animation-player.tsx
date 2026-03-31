"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useAnimationStore } from "@/store/animation-store"
import { useSceneStore } from "@/store/scene-store"
import { getInterpolatedTransform } from "@/lib/animation/interpolation"

/**
 * R3F component that drives animation playback.
 * When playing, advances frames based on FPS and applies
 * interpolated transforms to scene objects.
 */
export function AnimationPlayer() {
  const elapsedRef = useRef(0)

  useFrame((_, delta) => {
    const { isPlaying, currentFrame, totalFrames, fps, keyframes, setCurrentFrame } =
      useAnimationStore.getState()

    if (!isPlaying) {
      elapsedRef.current = 0
      return
    }

    elapsedRef.current += delta
    const frameDuration = 1 / fps

    if (elapsedRef.current >= frameDuration) {
      elapsedRef.current -= frameDuration

      const nextFrame = currentFrame + 1
      if (nextFrame >= totalFrames) {
        // Loop back to start
        setCurrentFrame(0)
      } else {
        setCurrentFrame(nextFrame)
      }
    }

    // Apply interpolated transforms to all objects that have keyframes
    const sceneState = useSceneStore.getState()
    const frame = useAnimationStore.getState().currentFrame

    // Collect unique objectIds from keyframes
    const objectIds = new Set(keyframes.map((kf) => kf.objectId))

    for (const objectId of objectIds) {
      const transform = getInterpolatedTransform(keyframes, frame, objectId)
      if (!transform) continue

      const obj = sceneState.objects[objectId]
      if (!obj) continue

      sceneState.updateObjectPosition(objectId, transform.position)
      sceneState.updateObjectRotation(objectId, transform.rotation)
      sceneState.updateObjectScale(objectId, transform.scale)
    }
  })

  return null
}

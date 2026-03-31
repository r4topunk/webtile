import type { Vec3 } from "@/lib/types"
import type { Keyframe } from "@/store/animation-store"

/**
 * Linear interpolation between two Vec3 values.
 */
export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

export type InterpolatedTransform = {
  position: Vec3
  rotation: Vec3
  scale: Vec3
} | null

/**
 * Given a list of keyframes for a specific object and a target frame,
 * find the surrounding keyframes and interpolate the transform.
 *
 * Returns null if no keyframes exist for the given objectId.
 */
export function getInterpolatedTransform(
  keyframes: Keyframe[],
  frame: number,
  objectId: string
): InterpolatedTransform {
  const objectKeyframes = keyframes
    .filter((kf) => kf.objectId === objectId)
    .sort((a, b) => a.frame - b.frame)

  if (objectKeyframes.length === 0) return null

  // Before the first keyframe — hold first keyframe values
  if (frame <= objectKeyframes[0].frame) {
    const kf = objectKeyframes[0]
    return { position: kf.position, rotation: kf.rotation, scale: kf.scale }
  }

  // After the last keyframe — hold last keyframe values
  const last = objectKeyframes[objectKeyframes.length - 1]
  if (frame >= last.frame) {
    return { position: last.position, rotation: last.rotation, scale: last.scale }
  }

  // Find the two surrounding keyframes
  let prev = objectKeyframes[0]
  let next = objectKeyframes[1]

  for (let i = 1; i < objectKeyframes.length; i++) {
    if (objectKeyframes[i].frame >= frame) {
      prev = objectKeyframes[i - 1]
      next = objectKeyframes[i]
      break
    }
  }

  // Exact keyframe match
  if (prev.frame === frame) {
    return { position: prev.position, rotation: prev.rotation, scale: prev.scale }
  }

  // Interpolate
  const t = (frame - prev.frame) / (next.frame - prev.frame)

  return {
    position: lerpVec3(prev.position, next.position, t),
    rotation: lerpVec3(prev.rotation, next.rotation, t),
    scale: lerpVec3(prev.scale, next.scale, t),
  }
}

import { create } from "zustand"
import type { Vec3 } from "@/lib/types"

export type Keyframe = {
  id: string
  objectId: string
  frame: number
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

interface AnimationState {
  keyframes: Keyframe[]
  currentFrame: number
  totalFrames: number
  fps: number
  isPlaying: boolean

  addKeyframe: (objectId: string, frame: number, position: Vec3, rotation: Vec3, scale: Vec3) => void
  removeKeyframe: (id: string) => void
  updateKeyframe: (id: string, updates: Partial<Pick<Keyframe, "position" | "rotation" | "scale">>) => void
  setCurrentFrame: (frame: number) => void
  setTotalFrames: (total: number) => void
  setFps: (fps: number) => void
  play: () => void
  pause: () => void
  stop: () => void
  clearKeyframesForObject: (objectId: string) => void
  clearAll: () => void
  getKeyframesForObject: (objectId: string) => Keyframe[]
  loadKeyframes: (keyframes: Keyframe[], totalFrames: number, fps: number) => void
}

export const useAnimationStore = create<AnimationState>((set, get) => ({
  keyframes: [],
  currentFrame: 0,
  totalFrames: 60,
  fps: 12,
  isPlaying: false,

  addKeyframe: (objectId, frame, position, rotation, scale) =>
    set((state) => {
      // Replace existing keyframe for same object at same frame
      const filtered = state.keyframes.filter(
        (kf) => !(kf.objectId === objectId && kf.frame === frame)
      )
      const newKf: Keyframe = {
        id: crypto.randomUUID(),
        objectId,
        frame,
        position: [...position] as Vec3,
        rotation: [...rotation] as Vec3,
        scale: [...scale] as Vec3,
      }
      return { keyframes: [...filtered, newKf] }
    }),

  removeKeyframe: (id) =>
    set((state) => ({
      keyframes: state.keyframes.filter((kf) => kf.id !== id),
    })),

  updateKeyframe: (id, updates) =>
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === id ? { ...kf, ...updates } : kf
      ),
    })),

  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setTotalFrames: (total) => set({ totalFrames: Math.max(1, total) }),
  setFps: (fps) => set({ fps: Math.max(1, Math.min(60, fps)) }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentFrame: 0 }),

  clearKeyframesForObject: (objectId) =>
    set((state) => ({
      keyframes: state.keyframes.filter((kf) => kf.objectId !== objectId),
    })),

  clearAll: () => set({ keyframes: [], currentFrame: 0, isPlaying: false }),

  getKeyframesForObject: (objectId) =>
    get().keyframes.filter((kf) => kf.objectId === objectId),

  loadKeyframes: (keyframes, totalFrames, fps) =>
    set({ keyframes, totalFrames, fps, currentFrame: 0, isPlaying: false }),
}))

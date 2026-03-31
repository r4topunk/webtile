import type { SceneObject, Tileset } from "@/lib/types"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"
import { useAnimationStore, type Keyframe } from "@/store/animation-store"
import { createImageUrl, getTilesetDimensions } from "@/lib/texture-utils"

export interface WebtileProject {
  version: 1
  scene: {
    objects: Record<string, SceneObject>
    objectOrder: string[]
  }
  tilesets: Record<
    string,
    Tileset & {
      /** base64 data URL of the tileset image */
      imageData: string
    }
  >
  animation?: {
    keyframes: Keyframe[]
    totalFrames: number
    fps: number
  }
}

/**
 * Convert a blob URL or object URL to a base64 data URL.
 */
async function blobUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert a base64 data URL back to an object URL.
 */
function base64ToObjectUrl(dataUrl: string): string {
  const [header, data] = dataUrl.split(",")
  const mimeMatch = header.match(/data:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : "image/png"
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mime })
  return URL.createObjectURL(blob)
}

/**
 * Serialize the current project state to a JSON-serializable object.
 */
export async function serializeProject(): Promise<WebtileProject> {
  const sceneState = useSceneStore.getState()
  const tilesetState = useTilesetStore.getState()

  // Deep clone objects to avoid mutating store
  const objects = JSON.parse(
    JSON.stringify(sceneState.objects)
  ) as Record<string, SceneObject>
  const objectOrder = [...sceneState.objectOrder]

  // Convert tileset image URLs to base64
  const tilesets: WebtileProject["tilesets"] = {}
  for (const [id, tileset] of Object.entries(tilesetState.tilesets)) {
    const imageData = await blobUrlToBase64(tileset.imageUrl)
    tilesets[id] = {
      ...JSON.parse(JSON.stringify(tileset)),
      imageData,
    }
  }

  // Serialize animation data
  const animState = useAnimationStore.getState()
  const animation = {
    keyframes: JSON.parse(JSON.stringify(animState.keyframes)) as Keyframe[],
    totalFrames: animState.totalFrames,
    fps: animState.fps,
  }

  return {
    version: 1,
    scene: { objects, objectOrder },
    tilesets,
    animation,
  }
}

/**
 * Deserialize a project JSON and restore state in both stores.
 */
export async function deserializeProject(
  project: WebtileProject
): Promise<void> {
  // Clear current state
  useTilesetStore.getState().clearAll()
  useSceneStore.getState().clearAll()

  // Restore tilesets — convert base64 back to object URLs
  const restoredTilesets: Record<string, Tileset> = {}
  const oldToNewUrl: Record<string, string> = {}

  for (const [id, tilesetData] of Object.entries(project.tilesets)) {
    const objectUrl = base64ToObjectUrl(tilesetData.imageData)
    const oldUrl = tilesetData.imageUrl
    oldToNewUrl[oldUrl] = objectUrl

    restoredTilesets[id] = {
      id: tilesetData.id,
      name: tilesetData.name,
      imageUrl: objectUrl,
      tileWidth: tilesetData.tileWidth,
      tileHeight: tilesetData.tileHeight,
      columns: tilesetData.columns,
      rows: tilesetData.rows,
    }
  }

  useTilesetStore.getState().loadTilesets(restoredTilesets)

  // Restore objects
  const objects = project.scene.objects
  const objectOrder = project.scene.objectOrder ?? Object.keys(objects)

  useSceneStore.getState().loadObjects(objects, objectOrder)

  // Restore animation data
  if (project.animation) {
    useAnimationStore.getState().loadKeyframes(
      project.animation.keyframes,
      project.animation.totalFrames,
      project.animation.fps
    )
  } else {
    useAnimationStore.getState().clearAll()
  }
}

/**
 * Serialize to JSON string for saving.
 */
export async function serializeProjectToJson(): Promise<string> {
  const project = await serializeProject()
  return JSON.stringify(project, null, 2)
}

/**
 * Deserialize from JSON string.
 */
export async function deserializeProjectFromJson(
  json: string
): Promise<void> {
  const project = JSON.parse(json) as WebtileProject
  if (project.version !== 1) {
    throw new Error(`Unsupported project version: ${project.version}`)
  }
  await deserializeProject(project)
}

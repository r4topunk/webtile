export type Vec3 = [number, number, number]
export type Vec2 = [number, number]

export type TileRef = {
  tilesetId: string
  x: number
  y: number
  w: number
  h: number
}

export type SceneFace = {
  id: string
  vertices: [Vec3, Vec3, Vec3, Vec3]
  tileRef: TileRef | null
  uvs: [Vec2, Vec2, Vec2, Vec2]
}

export type SceneObject = {
  id: string
  name: string
  parentId: string | null
  position: Vec3
  rotation: Vec3
  scale: Vec3
  faces: SceneFace[]
  visible: boolean
  locked: boolean
}

export type Tileset = {
  id: string
  name: string
  imageUrl: string
  tileWidth: number
  tileHeight: number
  columns: number
  rows: number
}

export type PlacementPlane = "xz" | "xy" | "yz"
export type EditorTool = "select" | "place" | "paint"
export type EditMode = "object" | "face" | "vertex" | "edge"
export type CameraType = "orthographic" | "perspective"

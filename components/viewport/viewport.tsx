"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { useEditorStore } from "@/store/editor-store"
import { Scene } from "./scene"

export function Viewport() {
  const cameraType = useEditorStore((s) => s.cameraType)

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-900">
      <Canvas
        style={{ position: "absolute", inset: 0 }}
        orthographic={cameraType === "orthographic"}
        camera={
          cameraType === "orthographic"
            ? { zoom: 50, position: [10, 10, 10], near: -1000, far: 1000 }
            : { fov: 60, position: [10, 10, 10], near: 0.1, far: 1000 }
        }
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#1a1a1a")
        }}
      >
        <OrbitControls
          makeDefault
          enableDamping={false}
          enableRotate
          enablePan
          mouseButtons={{
            LEFT: undefined as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
        <Scene />
      </Canvas>
    </div>
  )
}

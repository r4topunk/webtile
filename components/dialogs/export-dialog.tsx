"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSceneStore } from "@/store/scene-store"
import { useTilesetStore } from "@/store/tileset-store"
import { exportGltf } from "@/lib/exporters/gltf-exporter"
import { exportObj } from "@/lib/exporters/obj-exporter"

type ExportFormat = "glb" | "gltf" | "obj"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("glb")
  const [scaleFactor, setScaleFactor] = useState("1.0")
  const [embedTextures, setEmbedTextures] = useState(true)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const objects = useSceneStore.getState().objects
      const tilesets = useTilesetStore.getState().tilesets
      const scale = parseFloat(scaleFactor) || 1.0

      if (format === "glb" || format === "gltf") {
        const blob = await exportGltf(objects, tilesets, {
          binary: format === "glb",
          scaleFactor: scale,
          embedTextures,
        })
        const ext = format === "glb" ? ".glb" : ".gltf"
        triggerDownload(blob, `webtile-scene${ext}`)
      } else if (format === "obj") {
        const { obj, mtl } = exportObj(objects, tilesets, {
          scaleFactor: scale,
        })
        triggerDownload(obj, "webtile-scene.obj")
        triggerDownload(mtl, "webtile-scene.mtl")
      }

      onOpenChange(false)
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Export Scene</DialogTitle>
          <DialogDescription>
            Export the current scene to a 3D file format.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <div className="col-span-3">
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as ExportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glb">glTF Binary (.glb)</SelectItem>
                  <SelectItem value="gltf">glTF (.gltf)</SelectItem>
                  <SelectItem value="obj">Wavefront OBJ (.obj)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scale" className="text-right">
              Scale
            </Label>
            <Input
              id="scale"
              type="number"
              step="0.1"
              min="0.01"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(e.target.value)}
              className="col-span-3"
            />
          </div>

          {(format === "glb" || format === "gltf") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Textures</Label>
              <label className="col-span-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={embedTextures}
                  onChange={(e) => setEmbedTextures(e.target.checked)}
                  className="rounded border"
                />
                Embed textures in file
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

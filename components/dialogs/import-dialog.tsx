"use client"

import { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useSceneStore } from "@/store/scene-store"
import { importObj } from "@/lib/importers/obj-importer"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const selected = e.target.files?.[0] ?? null
    if (selected && !selected.name.endsWith(".obj")) {
      setError("Only .obj files are supported.")
      setFile(null)
      return
    }
    setFile(selected)
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    setError(null)

    try {
      const text = await file.text()
      const objects = importObj(text)

      if (objects.length === 0) {
        setError("No geometry found in file.")
        return
      }

      const addObject = useSceneStore.getState().addObject
      for (const obj of objects) {
        addObject(obj)
      }

      onOpenChange(false)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ""
    } catch (err) {
      console.error("Import failed:", err)
      setError("Failed to parse OBJ file.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Import OBJ</DialogTitle>
          <DialogDescription>
            Import a Wavefront OBJ file into the current scene.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">File</Label>
            <div className="col-span-3">
              <input
                ref={fileRef}
                type="file"
                accept=".obj"
                onChange={handleFileChange}
                className="text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {file && !error && (
            <p className="text-sm text-muted-foreground text-center">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

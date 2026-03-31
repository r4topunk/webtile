"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  hasAutoSave,
  getAutoSaveTimestamp,
  restoreAutoSave,
  clearAutoSave,
} from "@/lib/file-io"

export function AutosaveRestoreDialog() {
  const [open, setOpen] = useState(false)
  const [timestamp, setTimestamp] = useState<string>("")

  useEffect(() => {
    if (hasAutoSave()) {
      const ts = getAutoSaveTimestamp()
      if (ts) {
        setTimestamp(ts.toLocaleString())
      }
      setOpen(true)
    }
  }, [])

  const handleRestore = useCallback(async () => {
    try {
      await restoreAutoSave()
    } catch (err) {
      console.error("Failed to restore auto-save:", err)
    }
    setOpen(false)
  }, [])

  const handleDiscard = useCallback(() => {
    clearAutoSave()
    setOpen(false)
  }, [])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore auto-saved project?</DialogTitle>
          <DialogDescription>
            An auto-saved project was found
            {timestamp ? ` from ${timestamp}` : ""}.
            Would you like to restore it?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleDiscard}>
            Discard
          </Button>
          <Button onClick={handleRestore}>Restore</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

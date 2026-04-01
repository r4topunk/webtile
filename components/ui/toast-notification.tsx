"use client"

import { useEffect, useState } from "react"
import { useToastStore, type Toast } from "@/store/toast-store"

function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={`
        rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md
        transition-opacity duration-200 ease-out
        ${visible ? "opacity-100" : "opacity-0"}
      `}
    >
      {toast.message}
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

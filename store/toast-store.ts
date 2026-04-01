import { create } from "zustand"

export type ToastType = "success" | "info" | "warning" | "undo"

export interface Toast {
  id: string
  message: string
  type: ToastType
  createdAt: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, type: ToastType, onUndo?: () => void) => void
  removeToast: (id: string) => void
}

const MAX_TOASTS = 1
const AUTO_DISMISS_MS = 1500

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (message, type) => {
    const id = crypto.randomUUID()
    const toast: Toast = { id, message, type, createdAt: Date.now() }

    set((state) => {
      const next = [...state.toasts, toast]
      // Keep only the newest MAX_TOASTS
      if (next.length > MAX_TOASTS) {
        return { toasts: next.slice(next.length - MAX_TOASTS) }
      }
      return { toasts: next }
    })

    // Auto-dismiss
    setTimeout(() => {
      get().removeToast(id)
    }, AUTO_DISMISS_MS)
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

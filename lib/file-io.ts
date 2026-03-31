import {
  serializeProjectToJson,
  deserializeProjectFromJson,
} from "./serialization"

const WEBTILE_EXTENSION = ".webtile"
const AUTOSAVE_KEY = "webtile_autosave"

/**
 * Save project to a file using File System Access API with fallback.
 */
export async function saveProjectToFile(): Promise<void> {
  const json = await serializeProjectToJson()

  // Try File System Access API first
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: `project${WEBTILE_EXTENSION}`,
        types: [
          {
            description: "Webtile Project",
            accept: { "application/json": [WEBTILE_EXTENSION] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return
    } catch (err) {
      // User cancelled or API not available — fall through to blob download
      if ((err as DOMException)?.name === "AbortError") return
    }
  }

  // Fallback: blob download
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `project${WEBTILE_EXTENSION}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Load project from a file.
 */
export async function loadProjectFromFile(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = `${WEBTILE_EXTENSION},.json`
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve()
        return
      }
      try {
        const text = await file.text()
        await deserializeProjectFromJson(text)
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    // Handle cancel
    input.oncancel = () => resolve()
    input.click()
  })
}

/**
 * Save project to localStorage (auto-save).
 */
export async function autoSaveToLocalStorage(): Promise<void> {
  try {
    const json = await serializeProjectToJson()
    localStorage.setItem(AUTOSAVE_KEY, json)
    localStorage.setItem(`${AUTOSAVE_KEY}_timestamp`, Date.now().toString())
  } catch {
    // localStorage might be full or unavailable — silently ignore
  }
}

/**
 * Check if there is an auto-saved project in localStorage.
 */
export function hasAutoSave(): boolean {
  return localStorage.getItem(AUTOSAVE_KEY) !== null
}

/**
 * Get the timestamp of the last auto-save.
 */
export function getAutoSaveTimestamp(): Date | null {
  const ts = localStorage.getItem(`${AUTOSAVE_KEY}_timestamp`)
  if (!ts) return null
  return new Date(parseInt(ts, 10))
}

/**
 * Restore project from localStorage auto-save.
 */
export async function restoreAutoSave(): Promise<void> {
  const json = localStorage.getItem(AUTOSAVE_KEY)
  if (!json) throw new Error("No auto-save found")
  await deserializeProjectFromJson(json)
}

/**
 * Clear the auto-save from localStorage.
 */
export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY)
  localStorage.removeItem(`${AUTOSAVE_KEY}_timestamp`)
}

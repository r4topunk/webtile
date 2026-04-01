"use client"

import { useState, useEffect } from "react"
import { Image, Grid3x3, Box } from "lucide-react"
import { useEditorStore } from "@/store/editor-store"

const STORAGE_KEY = "webtile-onboarded"

const steps = [
  {
    icon: Image,
    title: "Load a Tileset",
    description:
      "Drag & drop a PNG tileset, or use the built-in sample. Find it in the Tileset tab on the right sidebar.",
  },
  {
    icon: Grid3x3,
    title: "Pick a Tile",
    description:
      "Click a tile in the tileset grid to select it. The selected tile will be used when placing.",
  },
  {
    icon: Box,
    title: "Place in 3D",
    description:
      'Switch to Place tool (B), then click on the grid to place tiles. Use camera controls to orbit around your scene.',
  },
]

export function Onboarding() {
  const show = useEditorStore((s) => s.showOnboarding)
  const setShow = useEditorStore((s) => s.setShowOnboarding)
  const [step, setStep] = useState(0)

  // Auto-show for first-time users
  useEffect(() => {
    if (typeof window === "undefined") return
    const onboarded = localStorage.getItem(STORAGE_KEY)
    if (!onboarded) {
      setShow(true)
    }
  }, [setShow])

  if (!show) return null

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1

  function handleSkip() {
    localStorage.setItem(STORAGE_KEY, "true")
    setShow(false)
    setStep(0)
  }

  function handleNext() {
    if (isLast) {
      handleSkip()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-auto max-w-md rounded-xl border border-neutral-700 bg-neutral-900 p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
            <Icon className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <h2 className="mb-2 text-center text-xl font-semibold text-neutral-100">
          {current.title}
        </h2>
        <p className="mb-8 text-center text-sm text-neutral-400">
          {current.description}
        </p>

        {/* Progress dots */}
        <div className="mb-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === step ? "bg-white" : "bg-neutral-600"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="rounded px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            {isLast ? "Start Building!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}

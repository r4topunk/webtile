"use client"

import dynamic from "next/dynamic"

const EditorLayout = dynamic(
  () => import("@/components/editor/editor-layout"),
  { ssr: false },
)

export default function Page() {
  return <EditorLayout />
}

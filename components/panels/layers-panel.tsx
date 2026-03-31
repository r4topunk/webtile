"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useSceneStore } from "@/store/scene-store"
import type { SceneObject } from "@/lib/types"
import { cn } from "@/lib/utils"

function buildHierarchy(objects: Record<string, SceneObject>, order: string[]) {
  // Build tree structure from flat list using objectOrder
  const rootIds: string[] = []
  const childrenMap: Record<string, string[]> = {}

  for (const id of order) {
    const obj = objects[id]
    if (!obj) continue
    if (!obj.parentId) {
      rootIds.push(id)
    } else {
      if (!childrenMap[obj.parentId]) childrenMap[obj.parentId] = []
      childrenMap[obj.parentId].push(id)
    }
  }

  return { rootIds, childrenMap }
}

interface LayerItemProps {
  obj: SceneObject
  depth: number
  isSelected: boolean
  childrenMap: Record<string, string[]>
  objects: Record<string, SceneObject>
}

function LayerItem({
  obj,
  depth,
  isSelected,
  childrenMap,
  objects,
}: LayerItemProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [editName, setEditName] = useState(obj.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const setSelection = useSceneStore((s) => s.setSelection)
  const toggleSelection = useSceneStore((s) => s.toggleSelection)
  const updateObjectName = useSceneStore((s) => s.updateObjectName)
  const toggleObjectVisibility = useSceneStore((s) => s.toggleObjectVisibility)
  const toggleObjectLock = useSceneStore((s) => s.toggleObjectLock)
  const removeObject = useSceneStore((s) => s.removeObject)
  const duplicateObjects = useSceneStore((s) => s.duplicateObjects)
  const reorderObject = useSceneStore((s) => s.reorderObject)
  const setObjectParent = useSceneStore((s) => s.setObjectParent)

  const children = childrenMap[obj.id] ?? []

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (obj.locked) return
      if (e.shiftKey) {
        toggleSelection(obj.id)
      } else {
        setSelection([obj.id])
      }
    },
    [obj.id, obj.locked, setSelection, toggleSelection]
  )

  const handleDoubleClick = useCallback(() => {
    setEditName(obj.name)
    setIsRenaming(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }, [obj.name])

  const commitRename = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== obj.name) {
      updateObjectName(obj.id, trimmed)
    }
    setIsRenaming(false)
  }, [editName, obj.id, obj.name, updateObjectName])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitRename()
      } else if (e.key === "Escape") {
        setIsRenaming(false)
      }
    },
    [commitRename]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const draggedId = e.dataTransfer.getData("text/plain")
      if (draggedId && draggedId !== obj.id) {
        setObjectParent(draggedId, obj.id)
      }
    },
    [obj.id, setObjectParent]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", obj.id)
      e.dataTransfer.effectAllowed = "move"
    },
    [obj.id]
  )

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex h-7 cursor-pointer items-center gap-1 px-1 text-xs hover:bg-accent",
              isSelected && "bg-accent/80 text-accent-foreground",
              obj.locked && "opacity-60"
            )}
            style={{ paddingLeft: `${depth * 16 + 4}px` }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            draggable
            onDragStart={handleDragStart}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={handleDrop}
          >
            {isRenaming ? (
              <Input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleKeyDown}
                className="h-5 flex-1 px-1 text-xs"
                autoFocus
              />
            ) : (
              <span className="flex-1 truncate">{obj.name}</span>
            )}

            <button
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 hover:bg-accent-foreground/10 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                toggleObjectVisibility(obj.id)
              }}
              title={obj.visible ? "Hide" : "Show"}
            >
              {obj.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </button>

            <button
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 hover:bg-accent-foreground/10 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                toggleObjectLock(obj.id)
              }}
              title={obj.locked ? "Unlock" : "Lock"}
            >
              {obj.locked ? (
                <Lock className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Unlock className="h-3 w-3" />
              )}
            </button>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={handleDoubleClick}>Rename</ContextMenuItem>
          <ContextMenuItem onClick={() => duplicateObjects([obj.id])}>
            <Copy className="mr-2 h-3 w-3" />
            Duplicate
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => toggleObjectVisibility(obj.id)}>
            {obj.visible ? (
              <>
                <EyeOff className="mr-2 h-3 w-3" /> Hide
              </>
            ) : (
              <>
                <Eye className="mr-2 h-3 w-3" /> Show
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => toggleObjectLock(obj.id)}>
            {obj.locked ? (
              <>
                <Unlock className="mr-2 h-3 w-3" /> Unlock
              </>
            ) : (
              <>
                <Lock className="mr-2 h-3 w-3" /> Lock
              </>
            )}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => reorderObject(obj.id, "up")}>
            <ChevronUp className="mr-2 h-3 w-3" /> Move Up
          </ContextMenuItem>
          <ContextMenuItem onClick={() => reorderObject(obj.id, "down")}>
            <ChevronDown className="mr-2 h-3 w-3" /> Move Down
          </ContextMenuItem>
          {obj.parentId && (
            <ContextMenuItem onClick={() => setObjectParent(obj.id, null)}>
              Unparent
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => removeObject(obj.id)}
          >
            <Trash2 className="mr-2 h-3 w-3" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Render children */}
      {children.map((childId) => {
        const child = objects[childId]
        if (!child) return null
        return (
          <LayerItem
            key={childId}
            obj={child}
            depth={depth + 1}
            isSelected={useSceneStore.getState().selectedIds.includes(childId)}
            childrenMap={childrenMap}
            objects={objects}
          />
        )
      })}
    </>
  )
}

export function LayersPanel() {
  const objects = useSceneStore((s) => s.objects)
  const objectOrder = useSceneStore((s) => s.objectOrder)
  const selectedIds = useSceneStore((s) => s.selectedIds)
  const setObjectParent = useSceneStore((s) => s.setObjectParent)

  const { rootIds, childrenMap } = useMemo(
    () => buildHierarchy(objects, objectOrder),
    [objects, objectOrder]
  )

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const handleRootDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const draggedId = e.dataTransfer.getData("text/plain")
      if (draggedId) {
        setObjectParent(draggedId, null)
      }
    },
    [setObjectParent]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="px-2 py-1.5 text-xs font-semibold">Layers</div>
      <Separator />
      <ScrollArea className="flex-1">
        <div
          className="min-h-[40px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleRootDrop}
        >
          {rootIds.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              No objects in scene
            </div>
          ) : (
            rootIds.map((id) => {
              const obj = objects[id]
              if (!obj) return null
              return (
                <LayerItem
                  key={id}
                  obj={obj}
                  depth={0}
                  isSelected={selectedSet.has(id)}
                  childrenMap={childrenMap}
                  objects={objects}
                />
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

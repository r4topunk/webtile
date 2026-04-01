# webtile

A web-based 3D tile editor inspired by [Crocotile 3D](https://crocotile3d.com/). Build 3D scenes using 2D pixel art tilesets — place tiles on a grid, shape geometry with vertex editing, paint faces, and export to glTF/OBJ.

Built with Next.js, React Three Fiber, and shadcn/ui.

## Features

**Core**
- Load PNG tilesets with configurable tile size
- Place tiles on XZ/XY/YZ planes at any offset
- 3D viewport with orbit, pan, zoom (macOS trackpad optimized)
- Orthographic and perspective camera modes
- 3D grid with RGB axis crosshair

**Editing**
- Object mode — select, move, rotate, scale with transform gizmo
- Face mode — select faces, extrude (E), delete
- Vertex mode — drag vertices to reshape geometry
- Edge mode — select edges
- Paint mode — click faces to swap tile textures

**Vertex Drag**
- Default: moves on active placement plane (2D)
- Hold X/Y/Z: lock to single axis (rebuilds drag plane dynamically)
- Hold Shift: auto-detect dominant axis
- Grid snap (0.5 default), toggle with magnet icon or hold Ctrl

**Project**
- Save/load `.webtile` projects (JSON with embedded tilesets)
- Auto-save to localStorage
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- Export to glTF/GLB, OBJ+MTL
- Import OBJ

**UI**
- Crocotile-inspired layout: menu bar, icon toolbar, tabbed sidebar
- Right sidebar: Tileset, Scene hierarchy, Properties, UV editor
- Collapsible animation timeline
- Rich tooltips on all toolbar buttons

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| B | Place tool |
| P | Paint tool |
| Tab | Cycle edit modes (Object/Face/Vertex/Edge) |
| 1 / 2 / 3 | Switch placement plane (XZ/XY/YZ) |
| Shift+Scroll | Adjust plane offset |
| 5 | Toggle ortho/perspective |
| G | Toggle grid |
| F | Focus camera on selection |
| E | Extrude selected faces |
| Delete | Delete selected |
| Ctrl+D | Duplicate |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save project |
| Ctrl+O | Open project |
| Ctrl+E | Export dialog |
| X / Y / Z | Lock vertex drag to axis |
| Shift (during drag) | Auto-lock to dominant axis |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js 16](https://nextjs.org/) + React 19
- [Three.js](https://threejs.org/) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) + [drei](https://github.com/pmndrs/drei)
- [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS 4
- [Zustand](https://github.com/pmndrs/zustand) + Immer + [Zundo](https://github.com/charkour/zundo) (undo)
- [Lucide React](https://lucide.dev/) icons

## Project Structure

```
app/                    Next.js app router
components/
  editor/               Menu bar, toolbar, status bar, layout
  viewport/             R3F canvas, scene, tile placer, grid
  tileset/              Tileset loader, tile picker
  panels/               Layers, properties, UV editor
  animation/            Timeline, playback, animation player
  dialogs/              Export, import, autosave restore
  ui/                   shadcn components
store/                  Zustand stores (editor, scene, tileset, animation)
lib/                    Types, geometry, texture utils, serialization, exporters
hooks/                  Keyboard shortcuts, auto-save
```

## License

MIT

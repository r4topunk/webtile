"use client"

type DrawFn = (ctx: CanvasRenderingContext2D) => void

function drawTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  drawFn: DrawFn,
) {
  ctx.save()
  ctx.translate(col * 16, row * 16)
  drawFn(ctx)
  ctx.restore()
}

/** Fill entire 16x16 tile with a solid color */
function fill(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 16, 16)
}

/** Set individual pixels */
function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

// ── Row 0: Ground/Floor ─────────────────────────────────────────────

function drawGrass(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#4a8c3f")
  const dots = [[2,3],[7,1],[12,4],[4,8],[9,10],[14,12],[1,13],[6,6],[11,14],[3,11]]
  for (const [x, y] of dots) px(ctx, "#3a6e30", x, y, 2, 2)
}

function drawDirt(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#8b6914")
  const dots = [[1,2],[5,6],[10,3],[3,10],[8,13],[13,8],[6,1],[11,11],[2,7],[14,5]]
  for (const [x, y] of dots) px(ctx, "#7a5c10", x, y, 2, 1)
}

function drawStone(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#888888")
  // Darker cracks
  for (let i = 0; i < 16; i += 4) {
    px(ctx, "#666666", 0, i, 16, 1)
    px(ctx, "#666666", i, 0, 1, 16)
  }
}

function drawSand(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#d4b860")
  const dots = [[3,2],[8,5],[1,9],[12,3],[6,12],[14,10],[4,6],[10,14]]
  for (const [x, y] of dots) px(ctx, "#c4a850", x, y)
}

function drawWater(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#3078c0")
  // Wave lines
  for (let y = 3; y < 16; y += 5) {
    for (let x = 0; x < 16; x += 2) {
      px(ctx, "#4090d8", x, y, 2, 1)
    }
    for (let x = 1; x < 16; x += 4) {
      px(ctx, "#50a0e8", x, y + 1, 2, 1)
    }
  }
}

function drawSnow(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#e8e8f0")
  const dots = [[2,4],[7,2],[12,6],[4,10],[9,13],[14,9],[1,14],[6,7]]
  for (const [x, y] of dots) px(ctx, "#c8d0e0", x, y)
}

function drawWoodPlanks(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#8b6340")
  // Horizontal plank lines
  for (let y = 0; y < 16; y += 4) {
    px(ctx, "#6b4830", 0, y, 16, 1)
  }
  // Vertical grain
  for (let x = 2; x < 16; x += 5) {
    px(ctx, "#7b5535", x, 0, 1, 16)
  }
}

function drawBrick(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#b04030")
  // Mortar lines (horizontal)
  for (let y = 0; y < 16; y += 4) {
    px(ctx, "#c8b898", 0, y, 16, 1)
  }
  // Mortar lines (vertical, offset)
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 0 : 8
    for (let x = offset; x < 16; x += 8) {
      px(ctx, "#c8b898", x, row * 4, 1, 4)
    }
  }
}

// ── Row 1: Walls ────────────────────────────────────────────────────

function drawStoneWall(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#808080")
  // Block pattern
  for (let y = 0; y < 16; y += 5) {
    px(ctx, "#606060", 0, y, 16, 1)
    const off = (y / 5) % 2 === 0 ? 0 : 4
    for (let x = off; x < 16; x += 8) {
      px(ctx, "#606060", x, y, 1, 5)
    }
  }
}

function drawWoodWall(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#7a5530")
  for (let x = 0; x < 16; x += 4) {
    px(ctx, "#5a3e20", x, 0, 1, 16)
  }
  // Grain
  for (let x = 1; x < 16; x += 4) {
    px(ctx, "#8a6540", x + 1, 0, 1, 16)
  }
}

function drawBrickWall(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#a03828")
  for (let y = 0; y < 16; y += 4) {
    px(ctx, "#d0c0a0", 0, y, 16, 1)
  }
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 0 : 6
    for (let x = offset; x < 16; x += 8) {
      px(ctx, "#d0c0a0", x, row * 4 + 1, 1, 3)
    }
  }
}

function drawMetal(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#505058")
  // Rivets
  const rivets = [[3,3],[12,3],[3,12],[12,12]]
  for (const [x, y] of rivets) {
    px(ctx, "#707078", x, y, 2, 2)
    px(ctx, "#404048", x + 1, y + 1)
  }
  // Highlight line
  px(ctx, "#606068", 0, 7, 16, 1)
}

function drawCeramic(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#e0e0e0")
  for (let x = 0; x < 16; x += 8) px(ctx, "#c0c0c0", x, 0, 1, 16)
  for (let y = 0; y < 16; y += 8) px(ctx, "#c0c0c0", 0, y, 16, 1)
}

function drawCobblestone(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#787878")
  const stones = [[1,1,5,4],[7,0,5,3],[13,1,3,4],[0,6,4,4],[5,5,5,5],[11,5,5,4],[2,11,4,4],[7,11,5,4],[13,10,3,5]]
  for (const [x, y, w, h] of stones) {
    px(ctx, "#686868", x, y, w, 1)
    px(ctx, "#686868", x, y, 1, h)
    px(ctx, "#909090", x + 1, y + h - 1, w - 1, 1)
    px(ctx, "#909090", x + w - 1, y + 1, 1, h - 1)
  }
}

function drawMossyStone(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#708070")
  const moss = [[1,2],[5,8],[10,4],[3,12],[8,1],[13,10],[6,14],[0,7]]
  for (const [x, y] of moss) px(ctx, "#508050", x, y, 3, 2)
  for (let i = 0; i < 16; i += 5) px(ctx, "#506050", 0, i, 16, 1)
}

function drawDarkWood(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#4a3020")
  for (let x = 0; x < 16; x += 4) px(ctx, "#3a2010", x, 0, 1, 16)
  for (let x = 2; x < 16; x += 4) px(ctx, "#5a4030", x, 0, 1, 16)
}

// ── Row 2: Details ──────────────────────────────────────────────────

function drawDoor(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#6b4420")
  // Frame
  px(ctx, "#4a3010", 0, 0, 16, 2)
  px(ctx, "#4a3010", 0, 0, 2, 16)
  px(ctx, "#4a3010", 14, 0, 2, 16)
  // Panels
  px(ctx, "#5a3818", 4, 3, 8, 4)
  px(ctx, "#5a3818", 4, 9, 8, 5)
  // Handle
  px(ctx, "#c0a030", 11, 9, 2, 2)
}

function drawWindow(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#606060")
  // Glass
  px(ctx, "#80b0d8", 2, 2, 12, 12)
  // Cross bars
  px(ctx, "#505050", 7, 2, 2, 12)
  px(ctx, "#505050", 2, 7, 12, 2)
  // Frame
  px(ctx, "#505050", 1, 1, 14, 1)
  px(ctx, "#505050", 1, 14, 14, 1)
  px(ctx, "#505050", 1, 1, 1, 14)
  px(ctx, "#505050", 14, 1, 1, 14)
}

function drawLadder(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  // Side rails
  px(ctx, "#7a5530", 3, 0, 2, 16)
  px(ctx, "#7a5530", 11, 0, 2, 16)
  // Rungs
  for (let y = 2; y < 16; y += 4) {
    px(ctx, "#8a6540", 5, y, 6, 2)
  }
}

function drawTorch(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  // Stick
  px(ctx, "#6b4420", 7, 6, 2, 10)
  // Flame
  px(ctx, "#f0a020", 6, 2, 4, 4)
  px(ctx, "#f8d040", 7, 1, 2, 3)
  px(ctx, "#ff6010", 7, 4, 2, 2)
}

function drawChest(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  // Body
  px(ctx, "#8b6340", 1, 5, 14, 10)
  // Lid
  px(ctx, "#9b7350", 1, 3, 14, 3)
  // Dark edge
  px(ctx, "#6b4830", 1, 5, 14, 1)
  // Clasp
  px(ctx, "#d4a030", 7, 4, 2, 3)
}

function drawSign(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  // Post
  px(ctx, "#6b4420", 7, 10, 2, 6)
  // Board
  px(ctx, "#b09060", 1, 2, 14, 8)
  px(ctx, "#8a7040", 1, 2, 14, 1)
  px(ctx, "#8a7040", 1, 9, 14, 1)
  // Text lines
  px(ctx, "#4a3020", 3, 4, 8, 1)
  px(ctx, "#4a3020", 4, 6, 6, 1)
}

function drawFlower(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  // Stem
  px(ctx, "#3a8030", 7, 7, 2, 8)
  // Leaves
  px(ctx, "#4a9a40", 5, 10, 2, 2)
  px(ctx, "#4a9a40", 9, 11, 2, 2)
  // Petals
  px(ctx, "#e03030", 5, 3, 2, 2)
  px(ctx, "#e03030", 9, 3, 2, 2)
  px(ctx, "#e03030", 5, 5, 2, 2)
  px(ctx, "#e03030", 9, 5, 2, 2)
  // Center
  px(ctx, "#f0d020", 7, 4, 2, 2)
}

function drawMushroom(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  // Stem
  px(ctx, "#e0d8c8", 6, 9, 4, 6)
  // Cap
  px(ctx, "#c03020", 3, 4, 10, 5)
  px(ctx, "#c03020", 5, 3, 6, 1)
  // Spots
  px(ctx, "#f0e8d0", 5, 5, 2, 2)
  px(ctx, "#f0e8d0", 9, 5, 2, 2)
  px(ctx, "#f0e8d0", 7, 3, 2, 1)
}

// ── Row 3: Nature ───────────────────────────────────────────────────

function drawTreeTrunk(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  px(ctx, "#5a3820", 5, 0, 6, 16)
  px(ctx, "#4a2810", 7, 0, 1, 16)
  px(ctx, "#6a4830", 9, 0, 1, 16)
}

function drawLeaves(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#3a8830")
  px(ctx, "#4a9840", 2, 2, 4, 4)
  px(ctx, "#4a9840", 8, 6, 4, 4)
  px(ctx, "#2a7020", 5, 5, 3, 3)
  px(ctx, "#2a7020", 9, 2, 3, 3)
  px(ctx, "#4aa040", 1, 8, 5, 4)
  px(ctx, "#2a7020", 10, 10, 4, 4)
}

function drawBush(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  px(ctx, "#3a8030", 2, 5, 12, 9)
  px(ctx, "#3a8030", 4, 3, 8, 2)
  px(ctx, "#4a9a40", 4, 5, 4, 3)
  px(ctx, "#4a9a40", 9, 7, 3, 3)
  px(ctx, "#2a6820", 6, 9, 4, 4)
}

function drawRock(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  px(ctx, "#808080", 3, 6, 10, 8)
  px(ctx, "#808080", 5, 4, 6, 2)
  px(ctx, "#909898", 5, 5, 4, 3)
  px(ctx, "#686868", 7, 8, 5, 5)
}

function drawCrystal(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  // Main crystal
  px(ctx, "#8040c0", 6, 2, 4, 12)
  px(ctx, "#a060e0", 7, 1, 2, 3)
  px(ctx, "#6030a0", 7, 10, 2, 4)
  // Side crystal
  px(ctx, "#7030b0", 3, 6, 3, 8)
  px(ctx, "#9050d0", 4, 5, 1, 2)
  // Highlight
  px(ctx, "#c090f0", 7, 3, 1, 2)
}

function drawLava(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#c03010")
  px(ctx, "#e06020", 1, 2, 4, 3)
  px(ctx, "#e06020", 8, 7, 5, 3)
  px(ctx, "#f0a030", 2, 3, 2, 1)
  px(ctx, "#f0a030", 9, 8, 3, 1)
  px(ctx, "#ff4010", 5, 10, 3, 2)
  px(ctx, "#e06020", 0, 12, 6, 3)
  px(ctx, "#f0a030", 12, 1, 3, 2)
}

function drawIce(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#a0d0f0")
  px(ctx, "#c0e0f8", 2, 1, 4, 3)
  px(ctx, "#c0e0f8", 9, 6, 5, 3)
  px(ctx, "#80b8e0", 4, 8, 3, 4)
  px(ctx, "#80b8e0", 0, 12, 5, 3)
  // Crack
  px(ctx, "#70a0c8", 6, 0, 1, 6)
  px(ctx, "#70a0c8", 7, 5, 1, 4)
}

function drawVine(ctx: CanvasRenderingContext2D) {
  fill(ctx, "transparent")
  ctx.clearRect(0, 0, 16, 16)
  // Main vine
  px(ctx, "#3a7828", 7, 0, 2, 16)
  // Leaves hanging left and right
  px(ctx, "#4a9838", 4, 3, 3, 2)
  px(ctx, "#4a9838", 9, 6, 3, 2)
  px(ctx, "#4a9838", 3, 10, 4, 2)
  px(ctx, "#4a9838", 10, 13, 3, 2)
  px(ctx, "#5aaa48", 5, 3, 1, 1)
  px(ctx, "#5aaa48", 10, 6, 1, 1)
}

// ── Row 4-6: Color palettes ─────────────────────────────────────────

const baseColors = ["#e03030", "#e08030", "#e0d030", "#30b030", "#30c0c0", "#3050d0", "#8030c0", "#d030a0"]
const lightColors = ["#f07070", "#f0b070", "#f0e878", "#70d870", "#70e0e0", "#7090f0", "#b070e0", "#f070d0"]
const darkColors = ["#901818", "#904818", "#908018", "#186818", "#187878", "#183090", "#501880", "#801860"]

// ── Row 7: Patterns ─────────────────────────────────────────────────

function drawCheckerboard(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < 16; y += 2) {
    for (let x = 0; x < 16; x += 2) {
      ctx.fillStyle = (x + y) % 4 === 0 ? "#e0e0e0" : "#404040"
      ctx.fillRect(x, y, 2, 2)
    }
  }
}

function drawStripesH(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < 16; y += 2) {
    ctx.fillStyle = y % 4 === 0 ? "#e0e0e0" : "#404040"
    ctx.fillRect(0, y, 16, 2)
  }
}

function drawStripesV(ctx: CanvasRenderingContext2D) {
  for (let x = 0; x < 16; x += 2) {
    ctx.fillStyle = x % 4 === 0 ? "#e0e0e0" : "#404040"
    ctx.fillRect(x, 0, 2, 16)
  }
}

function drawDiagonal(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#e0e0e0")
  ctx.fillStyle = "#404040"
  for (let i = -16; i < 32; i += 4) {
    for (let j = 0; j < 16; j++) {
      const x = i + j
      if (x >= 0 && x < 16) ctx.fillRect(x, j, 2, 1)
    }
  }
}

function drawDots(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#e0e0e0")
  ctx.fillStyle = "#404040"
  for (let y = 1; y < 16; y += 4) {
    for (let x = 1; x < 16; x += 4) {
      ctx.fillRect(x, y, 2, 2)
    }
  }
}

function drawCrosshatch(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#e0e0e0")
  ctx.fillStyle = "#404040"
  for (let i = 0; i < 16; i += 4) {
    ctx.fillRect(0, i, 16, 1)
    ctx.fillRect(i, 0, 1, 16)
  }
}

function drawGradient(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < 16; y++) {
    const v = Math.round((y / 15) * 255)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(0, y, 16, 1)
  }
}

function drawBlank(ctx: CanvasRenderingContext2D) {
  fill(ctx, "#000000")
}

// ── Main generator ──────────────────────────────────────────────────

export function generateSampleTileset(): {
  dataUrl: string
  name: string
  tileWidth: number
  tileHeight: number
  columns: number
  rows: number
} {
  const tileSize = 16
  const cols = 8
  const rows = 8
  const canvas = document.createElement("canvas")
  canvas.width = cols * tileSize
  canvas.height = rows * tileSize
  const ctx = canvas.getContext("2d")!

  // Clear with transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Row 0: Ground/Floor
  const row0: DrawFn[] = [drawGrass, drawDirt, drawStone, drawSand, drawWater, drawSnow, drawWoodPlanks, drawBrick]
  row0.forEach((fn, i) => drawTile(ctx, i, 0, fn))

  // Row 1: Walls
  const row1: DrawFn[] = [drawStoneWall, drawWoodWall, drawBrickWall, drawMetal, drawCeramic, drawCobblestone, drawMossyStone, drawDarkWood]
  row1.forEach((fn, i) => drawTile(ctx, i, 1, fn))

  // Row 2: Details
  const row2: DrawFn[] = [drawDoor, drawWindow, drawLadder, drawTorch, drawChest, drawSign, drawFlower, drawMushroom]
  row2.forEach((fn, i) => drawTile(ctx, i, 2, fn))

  // Row 3: Nature
  const row3: DrawFn[] = [drawTreeTrunk, drawLeaves, drawBush, drawRock, drawCrystal, drawLava, drawIce, drawVine]
  row3.forEach((fn, i) => drawTile(ctx, i, 3, fn))

  // Row 4: Base colors
  baseColors.forEach((color, i) => {
    drawTile(ctx, i, 4, (c) => fill(c, color))
  })

  // Row 5: Light colors
  lightColors.forEach((color, i) => {
    drawTile(ctx, i, 5, (c) => fill(c, color))
  })

  // Row 6: Dark colors
  darkColors.forEach((color, i) => {
    drawTile(ctx, i, 6, (c) => fill(c, color))
  })

  // Row 7: Patterns
  const row7: DrawFn[] = [drawCheckerboard, drawStripesH, drawStripesV, drawDiagonal, drawDots, drawCrosshatch, drawGradient, drawBlank]
  row7.forEach((fn, i) => drawTile(ctx, i, 7, fn))

  return {
    dataUrl: canvas.toDataURL("image/png"),
    name: "Sample Tileset",
    tileWidth: tileSize,
    tileHeight: tileSize,
    columns: cols,
    rows,
  }
}

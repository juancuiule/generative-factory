# Generative Factory

A generative art sketch built with [p5.js](https://p5js.org/) and TypeScript. It procedurally constructs industrial-machinery-inspired compositions: a grid of rectangular "factories", each subdivided into blocks that are then assigned visual roles — pulleys, cables, screws, animated pistons, icons, and labels — all drawn on layered canvases.

<img src="./palette.png" alt="palette: pink / blue / black" width="100%" style="max-width: 300px;">

---

## Running the project

```bash
pnpm install
pnpm dev        # Vite dev server at http://localhost:5173
pnpm build      # TypeScript check + Vite production build
pnpm preview    # Preview production build
```

---

## Keyboard controls

| Key | Action |
|-----|--------|
| `r` | Re-randomize everything (new seed values, layout, colors) |
| `c` | Re-randomize colors only |
| `h` | Toggle the lil-gui parameter panel |
| `f` | Toggle fullscreen |
| `d` | Toggle debug overlay (all blocks outlined + type labels) |

---

## Architecture

```
src/
├── main.ts          # p5 sketch entry point — orchestration, input, draw loop
├── config.ts        # Global constants: colors, palette, icons, layer names, factoryConfig
├── types.ts         # Shared type aliases (RandomFn)
├── industry.ts      # Creates the outer industry grid (rows × cols of factories)
├── block.ts         # Block class — geometry, state machine, drawing logic
├── budget-grid.ts   # Generic grid-subdivision algorithm
└── utils.ts         # getKeys typed-Object.keys helper
```

### Data flow

```
main.ts: setup
  └─ createIndustry()          → GridItem[][]
        └─ createFactory()     → Block[][]   (main grid)
        └─ createFactory()     → Block[][]   (meta grid inside biggest block)

main.ts: draw
  └─ forEachLayer.translate    (centers everything)
  └─ block.draw(p, params, factoryGrid, layers)
        └─ picks layer (main | pulley)
        └─ renders based on block.type
```

---

## Key modules

### `config.ts`

Central configuration hub. Contains:

- **`colors`** / **`palette`** — four named colours (`pink`, `black`, `blue`, `white`) mapped to hex values.
- **`inverted`** — maps each colour to its visual counterpart, used to pick icon tint.
- **`nailsPalette`** — screw cross-hair colour per background colour.
- **`params`** — mutable runtime parameters (background colour, block colour, icon, machine number) controlled by lil-gui.
- **`factoryConfig`** — tuneable geometry for screws, cables, pulley, animated blocks, and hidden-block ratios.
- **`assets`** — container for loaded `p5.Image` and `p5.Font` references.
- **`LAYERS`** — ordered tuple `["main", "pulley"]` defining draw order.

### `budget-grid.ts`

A direction-agnostic grid subdivider. Given a bounding box, a number of primary steps, and a number of sub-steps, it randomly partitions the available space (a "budget") to produce a 2-D array of `{ x, y, width, height }` cells. Works both horizontally and vertically via strategy functions (`GridFunctions`).

### `industry.ts — createIndustry`

Lays out a `rows × cols` grid of factory cells within `config.grid`. For each cell:

1. Calls `createFactory` (via `budget-grid`) to build the **main factory** block grid.
2. Finds the largest block in the main grid; if it exceeds a minimum threshold, replaces it with a `"meta"` block and builds a nested **meta factory** inside it.
3. Stores the result as a `GridItem` (mainFactory, metaFactory, offsets `dx/dy`, and the meta-factory origin `x/y`).

### `block.ts — Block`

The central entity. Each block holds:

- `props` — current `x, y, w, h, color, id`.
- `initialProps` — snapshot at construction, used as the rest position for animation.
- `type` — a state-machine value that drives rendering.
- `pulley` — cached pulley knuckle position shared across frames.

**Block types and their visuals:**

| Type | Visual |
|------|--------|
| `initial` | Plain filled rectangle |
| `hidden` | Not drawn (empty slot) |
| `biggest` | Filled rect + two concentric circles (pulley wheel) with animated knuckle; cables drawn to `pulley-end` blocks |
| `pulley-end` | Filled rect + centred white dot (cable anchor) |
| `screws` | Four corner nail-heads with cross-hair strokes |
| `cables` | Filled rect + 3 horizontal or vertical cable lines with plug endpoints |
| `cables-prev` | Plain filled rectangle (neighbour of a cables block) |
| `icon` | Filled rect + centred icon image (tension / warning / text) |
| `label` | Filled rect + two lines of monospace text ("Machine / #N") |
| `animated-prev` | Oscillates toward its previous block; draws a connecting line |
| `animated-next` | Oscillates toward its next block; draws a connecting line |
| `meta` | Invisible host — contains the nested meta factory |

Navigation helpers (`getPrevBlock`, `getNextBlock`) decode block IDs (`name-fx-fy-bi-bj`) to traverse the grid.

`getPulleyEndCoords` resolves the world-space positions of all `pulley-end` blocks so `biggest` can draw cables to them.

### `main.ts`

The p5 sketch. Responsibilities:

- **`preload`** — loads all icon images (icon × colour combinations) and the font.
- **`setup`** — creates the canvas and two off-screen graphics layers (`main`, `pulley`); calls `setRandomValues` to build the initial composition.
- **`draw`** — clears layers, applies a centering translate, iterates `factoryGrid`, translates per cell, calls `block.draw` for every block, then composites layers onto the canvas in order.
- **`setRandomValues`** — picks random colours, icon, machine number, rebuilds the grid, and assigns block types via `assignTypes`.
- **`assignTypes`** — walks every block and promotes eligible blocks from `"initial"` to a specific type following a priority order: biggest → screws → cables → icon → animated → label → pulley-end.

---

## Known issues

- **All blocks share the same `seed`** — the per-instance seed IIFE always produces the same number (mulberry32 starts from a fixed constant), so all animated blocks oscillate in sync. Intentional for now. (`block.ts:48`)

- **`factoryConfig.animatedBlocks.factors` uses unseeded `Math.random()`** — computed at module load time with the global RNG, not p5's seeded one, so not fully deterministic. (`config.ts:110`)

---

## Dependencies

| Package | Role |
|---------|------|
| `p5` | 2D canvas rendering, RNG, input |
| `lil-gui` | Floating parameter panel |
| `vite` | Dev server and bundler |
| `typescript` | Static typing |

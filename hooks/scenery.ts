// Scenery: one quiet row under Clawd, of things drifting by — sharks on the sea, koi, cherry
// blossom, autumn leaves, snow, stars, fireflies, birds. Made to sit at the edge of sight while
// you work, never to pull the eye: a handful of things on the row, in muted colors, each moving a
// cell every few seconds, twinkles that turn over slowly, and glyphs one cell wide in every
// terminal and app (no emoji).

import type { Local, Row, Segment } from './clawd'

export type Scenery = 'sea' | 'koi' | 'blossom' | 'leaves' | 'snow' | 'stars' | 'fireflies' | 'birds'
export const SCENERIES: readonly Scenery[] = ['sea', 'koi', 'blossom', 'leaves', 'snow', 'stars', 'fireflies', 'birds']

// One kind of thing in a scene: its looks, turned over every `turnMs`; how many to a stretch of
// `per` cells; and how fast it drifts, a cell every `stepMs`, leftward when `isLeftward`. Without
// `stepMs` it stays put, twinkling.
type Drifter = { looks: readonly string[]; colors: readonly string[]; per: number; stepMs?: number; isLeftward?: boolean; turnMs: number }

const SCENES: Readonly<Record<Scenery, readonly Drifter[]>> = {
  // Shark fins gliding along, a small fish going the other way, and the swell.
  sea: [
    { looks: ['~', '‿'], colors: ['#3e5a70'], per: 7, turnMs: 6000 },
    { looks: ['▲'], colors: ['#7f95a8'], per: 40, stepMs: 3200, turnMs: 60_000 },
    { looks: ['<><'], colors: ['#6fa3c4'], per: 60, stepMs: 5200, isLeftward: true, turnMs: 60_000 },
  ],
  // Koi turning slow circles in a pond: a fish or two, and a ripple now and then.
  koi: [
    { looks: ['∘', ' ', ' '], colors: ['#5a7184'], per: 12, turnMs: 4800 },
    { looks: ['><>'], colors: ['#e08a5a'], per: 45, stepMs: 4400, turnMs: 60_000 },
    { looks: ['<><'], colors: ['#e8e2d8'], per: 70, stepMs: 6000, isLeftward: true, turnMs: 60_000 },
  ],
  // Petals drifting on the breeze, turning over as they go.
  blossom: [
    { looks: ['✿', '❀', '·'], colors: ['#e8a6c1', '#c48aa3'], per: 12, stepMs: 3600, turnMs: 2400 },
  ],
  leaves: [
    { looks: ['❦', '❧', '·'], colors: ['#c7834a', '#a8643a', '#d1a65a'], per: 14, stepMs: 4000, isLeftward: true, turnMs: 2800 },
  ],
  // Snow drifting down and across, slower than anything else.
  snow: [
    { looks: ['❅', '·', '❆', '·'], colors: ['#c9d6e2', '#8fa1b3'], per: 10, stepMs: 5600, turnMs: 3200 },
  ],
  // Stars that stay put and twinkle, now and then one a little brighter.
  stars: [
    { looks: ['·', '·', '⋆', '·', '✧', '·'], colors: ['#8f96b8', '#c9cde8', '#6f7594'], per: 9, turnMs: 4000 },
  ],
  // Fireflies glowing up and fading, wandering a little.
  fireflies: [
    { looks: [' ', '·', '•', '·', ' ', ' '], colors: ['#c9d16b', '#8e9a4f'], per: 11, stepMs: 7000, turnMs: 1600 },
  ],
  // A bird or two gliding across a morning sky.
  birds: [
    { looks: ['v', '‿'], colors: ['#8a8f99'], per: 30, stepMs: 3000, turnMs: 1800 },
  ],
}

// A shooting star crosses the night now and then: one every this often, for a moment.
const SHOOTING_EVERY_MS = 4 * 60 * 1000
const SHOOTING_FOR_MS = 2400

// The scene for the `setting` ('auto', 'off' or a scene's name) at local time `local`: on 'auto',
// by the season and the hour, as a window would show it.
export function sceneryOf(setting: string, local: Local): Scenery | undefined {
  if (setting === 'off') return undefined
  if ((SCENERIES as readonly string[]).includes(setting)) return setting as Scenery
  const { month, hour, day } = local
  const isNight = hour >= 20 || hour < 5
  if (isNight) return month >= 6 && month <= 8 ? 'fireflies' : 'stars'
  if (month >= 3 && month <= 5) return hour < 10 && day % 2 === 0 ? 'birds' : 'blossom'
  if (month >= 6 && month <= 8) return day % 2 === 0 ? 'sea' : 'koi'
  if (month >= 9 && month <= 11) return 'leaves'

  return 'snow'
}

// A number from 0 to 1 for `n`, the same each time: where each thing starts, and its look.
const noise = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

// The scene's row, `width` cells wide, as it stands at `nowMs`.
export function sceneryRow(scenery: Scenery, width: number, nowMs: number): Row {
  const cells: (Segment | undefined)[] = Array.from({ length: width }, () => undefined)
  const put = (at: number, text: string, color: string) => {
    for (const [i, ch] of [...text].entries()) {
      const c = at + i
      if (c >= 0 && c < width) cells[c] = { text: ch, color }
    }
  }
  SCENES[scenery].forEach((kind, k) => {
    const count = Math.max(1, Math.round(width / kind.per))
    // Room to go off one edge and come back in at the other.
    const lap = width + 6
    for (let i = 0; i < count; i++) {
      const seed = k * 101 + i * 7 + 1
      const start = Math.floor(noise(seed) * lap)
      const steps = kind.stepMs === undefined ? 0 : Math.floor(nowMs / kind.stepMs + noise(seed + 3) * 5)
      const at = (((start + (kind.isLeftward ? -steps : steps)) % lap) + lap) % lap - 3
      const turn = Math.floor(nowMs / kind.turnMs + noise(seed + 5) * kind.looks.length)
      const look = kind.looks[turn % kind.looks.length]!
      if (look.trim() === '') continue
      put(at, look, kind.colors[i % kind.colors.length]!)
    }
  })
  if (scenery === 'stars' && nowMs % SHOOTING_EVERY_MS < SHOOTING_FOR_MS) {
    // A shooting star: a short streak racing left across the row.
    const at = width - Math.floor(((nowMs % SHOOTING_EVERY_MS) / SHOOTING_FOR_MS) * (width + 4))
    put(at, '✦──', '#c9cde8')
  }

  // Runs of empty cells as one space segment, and the rest joined where they share a color.
  const row: Row = []
  for (const cell of cells) {
    const part = cell ?? { text: ' ' }
    const last = row[row.length - 1]
    if (last !== undefined && last.color === part.color) last.text += part.text
    else row.push({ ...part })
  }

  return row
}

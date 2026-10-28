// Draws every Clawd frame the promo video shows, with the mod's own scene code, into
// promo/build/scenes.json for promo/page.html to play. Run from the repository's root:
//
//   bun promo/scenes.ts

import type { EmoteName, Kind } from '../types'

import { clawdScene, sceneSvg } from '../hooks/clawd'

// One Clawd frame: what it acts out, at what hour, and what it is watching typed.
type Spec = { kind?: Kind; emote?: EmoteName; hour?: number; castle?: number; caret?: number }

const CELL = { width: 24, height: 48 }
const SMALL = { width: 14, height: 28 }

const svg = (spec: Spec, frame: number, cell = CELL) =>
  sceneSvg(
    clawdScene({
      kind: spec.kind ?? 'idle',
      emote: spec.emote,
      frame,
      poseFrame: frame,
      nowMs: Date.UTC(2026, 9, 27, 6, 30),
      local: { hour: spec.hour ?? 12, weekday: 2, month: 10, day: 27 },
      castle: spec.castle ?? 0,
      ...(spec.caret !== undefined && { typing: { caret: spec.caret, isPet: false } }),
    }),
    cell,
  )

// `n` frames of one act, counting from 1 so an idle Clawd doesn't open on a blink.
const run = (spec: Spec, n: number, cell = CELL) => Array.from({ length: n }, (_, i) => svg(spec, i + 1, cell))

const TYPED = 'add a dark mode toggle'

const scenes: Record<string, string[]> = {
  meet: [...run({ emote: 'hop' }, 2).reverse(), ...run({ kind: 'happy', emote: 'wave', hour: 9 }, 14)],
  glasses: run({ kind: 'read', hour: 10 }, 8),
  commit: run({ kind: 'happy', emote: 'party', hour: 11 }, 8),
  dizzy: [...run({ kind: 'oops', hour: 13 }, 2), ...run({ kind: 'oops', emote: 'dizzy', hour: 13 }, 6)],
  typing: Array.from({ length: 8 }, (_, i) => svg({ hour: 14, caret: 2 + Math.round((TYPED.length * (i + 1)) / 8) }, i + 1)),
  love: run({ kind: 'love', emote: 'hearts', hour: 15 }, 8),
  long: run({ kind: 'happy', emote: 'milestone', hour: 16 }, 8),
  stretch: run({ kind: 'happy', emote: 'stretch', hour: 17 }, 8),
  night: run({ kind: 'think', emote: 'meditate', hour: 23 }, 8),
  sing: run({ kind: 'happy', emote: 'sing', hour: 12 }, 8, SMALL),
  fish: run({ emote: 'fish', hour: 18 }, 8, SMALL),
  castle: run({ emote: 'castle', hour: 12, castle: 10 }, 8, SMALL),
  meditate: run({ kind: 'think', emote: 'meditate', hour: 21 }, 8, SMALL),
  end: run({ kind: 'happy', emote: 'wave', hour: 20 }, 16),
}

await Bun.write(new URL('build/scenes.json', import.meta.url), JSON.stringify({ typed: TYPED, scenes }))
console.log(Object.entries(scenes).map(([id, frames]) => `${id}: ${frames.length}`).join(', '))

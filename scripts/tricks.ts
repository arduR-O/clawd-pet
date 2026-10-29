// Draws the README's galleries from the mod's own scene code, so the pictures can't drift from
// what Clawd draws: its newer tricks, or with `guests` its guests. Run from the repository's root:
//
//   bun scripts/tricks.ts > assets/tricks.svg
//   bun scripts/tricks.ts guests > assets/guests.svg

import type { EmoteName, Kind } from '../types'

import { SAYINGS, clawdScene, sceneSvg } from '../hooks/clawd'

type Frame = {
  kind?: Kind
  emote?: EmoteName
  line: string
  // What is typed in the prompt under Clawd, for the panel that watches it.
  typed?: string
}

type Panel = { title: string; frames: Frame[] }

// A gallery: what it shows, in how many columns, at what size.
type Sheet = {
  title: string
  columns: number
  cell: { width: number; height: number }
  panel: { width: number; height: number }
  fontSize: number
  panels: Panel[]
}

// Each frame shows this long, the mod's own tick.
const FRAME_S = 0.8
const GAP = 20
const BG = '#17131d'
const CARD = '#1f1a27'
const RULE = '#3a3346'
const DIM = '#a8a2b8'
const INK = '#eeeaf4'
const ORANGE = '#ff8800'

const repeat = (frame: Frame, times: number): Frame[] => Array.from({ length: times }, () => frame)
const typing = 'fix the login bug please'

const TRICKS: Panel[] = [
  {
    title: 'watches you type',
    frames: [0, 4, 8, 12, 16, 20, 24, 24, 24].map(n => ({ line: '', typed: typing.slice(0, n) })),
  },
  {
    title: 'thanks you for a yes',
    frames: [...repeat({ kind: 'happy', emote: 'hop', line: 'thanks!' }, 4), ...repeat({ emote: 'enough', line: 'fine, not that then.' }, 4)],
  },
  {
    title: 'a face for every mood',
    frames: [
      ...repeat({ kind: 'oops', line: 'pfft. that broke.' }, 2),
      ...repeat({ kind: 'oops', emote: 'dizzy', line: 'everything is spinning.' }, 3),
      ...repeat({ kind: 'love', emote: 'hearts', line: 'aw, thanks!' }, 2),
      ...repeat({ emote: 'tide', line: "whoa, tide's in!" }, 2),
      ...repeat({ emote: 'golden', line: 'ooh, sudo. fancy.' }, 2),
    ],
  },
  {
    title: 'reading glasses, same head',
    frames: repeat({ kind: 'read', line: 'reading clawd.ts' }, 4),
  },
  {
    title: 'stretch breaks',
    frames: repeat({ kind: 'happy', emote: 'stretch', line: '52 min in. stretch break?' }, 6),
  },
  {
    title: 'long turns end in confetti',
    frames: repeat({ kind: 'happy', emote: 'party', line: 'done! that took 4 min.' }, 6),
  },
]

// The guests, each with what brings it and the first thing it says.
const GUESTS: [EmoteName, string, Kind?][] = [
  ['sherlock', 'git blame'],
  ['jedi', 'git push --force'],
  ['gandalf', 'you say no'],
  ['terminator', 'kill -9'],
  ['delorean', 'git revert'],
  ['ninja', 'git stash'],
  ['duck', 'a bug story'],
  ['neo', 'a skill loads'],
  ['coffee', 'morning'],
  ['astronaut', 'an API error', 'oops'],
  ['oneup', 'red, then green', 'happy'],
  ['whale', 'docker'],
]
const firstLine: Partial<Record<EmoteName, string>> = {
  sherlock: SAYINGS.sherlock[1],
  jedi: SAYINGS.jedi[0],
  gandalf: SAYINGS.gandalf[0],
  terminator: SAYINGS.terminator[1],
  delorean: SAYINGS.delorean[0],
  ninja: 'poof. hidden.',
  duck: SAYINGS.duck[1],
  neo: 'I know pdf.',
  coffee: SAYINGS.coffee[0],
  astronaut: 'houston, a problem.',
  oneup: SAYINGS.oneup[1],
  whale: SAYINGS.whale[0],
}

const SHEETS: Record<string, Sheet> = {
  tricks: {
    title: "Clawd's newer tricks: watching you type, thanking you when you allow a permission request, a face for every mood, reading glasses, stretch breaks and confetti for long turns",
    columns: 2,
    // One cell of the band, as the hero picture draws it.
    cell: { width: 10, height: 20 },
    panel: { width: 320, height: 172 },
    fontSize: 15,
    panels: TRICKS,
  },
  guests: {
    title: "Clawd's guests: Sherlock, a Jedi, Gandalf, the Terminator, a DeLorean, a ninja, a rubber duck, Neo, coffee, an astronaut, a 1-UP mushroom and a whale",
    columns: 3,
    cell: { width: 8, height: 16 },
    panel: { width: 210, height: 150 },
    fontSize: 13,
    panels: GUESTS.map(([emote, when, kind]) => ({ title: `${emote === 'oneup' ? '1-UP' : emote} · ${when}`, frames: repeat({ kind, emote, line: firstLine[emote] ?? '' }, 4) })),
  },
}
const sheet = SHEETS[process.argv[2] ?? 'tricks']!
const { columns, cell: CELL, panel: PANEL, panels: PANELS } = sheet

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const local = { hour: 12, weekday: 2, month: 10, day: 27 }
const noon = Date.UTC(2026, 9, 27, 6, 30)

const width = columns * PANEL.width + (columns + 1) * GAP
const height = Math.ceil(PANELS.length / columns) * (PANEL.height + GAP) + GAP

const styles: string[] = []
const cards: string[] = []
for (const [p, panel] of PANELS.entries()) {
  const x = GAP + (p % columns) * (PANEL.width + GAP)
  const y = GAP + Math.floor(p / columns) * (PANEL.height + GAP)
  const n = panel.frames.length
  const cycle = (n * FRAME_S).toFixed(2)
  styles.push(
    `.p${p} { opacity: 0; animation: show${p} ${cycle}s infinite; animation-timing-function: step-end; }`,
    `@keyframes show${p} { 0% { opacity: 1 } ${(100 / n).toFixed(4)}% { opacity: 0 } 100% { opacity: 0 } }`,
  )
  let card = `<rect x="${x}" y="${y}" width="${PANEL.width}" height="${PANEL.height}" rx="10" fill="${CARD}"/>`
  card += `<text x="${x + 14}" y="${y + 24}" fill="${DIM}" font-size="13">${escape(panel.title)}</text>`
  const frames = panel.frames.map((frame, i) => {
    const caret = frame.typed === undefined ? undefined : 2 + frame.typed.length
    const rows = clawdScene({
      kind: frame.kind ?? 'idle',
      emote: frame.emote,
      frame: i + 1,
      nowMs: noon,
      local,
      ...(caret !== undefined && { typing: { caret, isPet: false } }),
    })
    const scene = sceneSvg(rows, CELL).replace('<svg ', `<svg x="${x + 6}" y="${y + 34}" `)
    let parts = scene
    if (frame.line !== '') {
      // As in the band: its name, and under it what it says.
      const named = y + 34 + 4 * CELL.height + 16
      parts += `<text x="${x + 14}" y="${named}" fill="${ORANGE}" font-weight="700">Clawd</text>`
      parts += `<text x="${x + 14}" y="${named + sheet.fontSize + 7}" fill="${DIM}">${escape(frame.line)}</text>`
    }
    if (frame.typed !== undefined) {
      const top = y + 122
      parts += `<rect x="${x + 14}" y="${top}" width="${PANEL.width - 28}" height="1" fill="${RULE}"/>`
      parts += `<text x="${x + 6 + 0 * CELL.width}" y="${top + 22}" fill="${INK}">❯ ${escape(frame.typed)}<tspan fill="${DIM}">▏</tspan></text>`
      parts += `<rect x="${x + 14}" y="${top + 32}" width="${PANEL.width - 28}" height="1" fill="${RULE}"/>`
    }

    return `<g class="p${p}" style="animation-delay:${(i * FRAME_S).toFixed(2)}s">${parts}</g>`
  })
  cards.push(card + frames.join(''))
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace" font-size="${sheet.fontSize}">
<title>${escape(sheet.title)}</title>
<style>
${styles.join('\n')}
</style>
<rect width="${width}" height="${height}" rx="12" fill="${BG}"/>
${cards.join('\n')}
</svg>
`

process.stdout.write(svg)

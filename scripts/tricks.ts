// Draws assets/tricks.svg, the README's gallery of Clawd's newer tricks, from the mod's own scene
// code, so the pictures can't drift from what Clawd draws. Run from the repository's root:
//
//   bun scripts/tricks.ts > assets/tricks.svg

import type { EmoteName, Kind } from '../types'

import { clawdScene, sceneSvg } from '../hooks/clawd'

type Frame = {
  kind?: Kind
  emote?: EmoteName
  line: string
  // What is typed in the prompt under Clawd, for the panel that watches it.
  typed?: string
}

type Panel = { title: string; frames: Frame[] }

// Each frame shows this long, the mod's own tick.
const FRAME_S = 0.8
// One cell of the band, as the hero picture draws it.
const CELL = { width: 10, height: 20 }
const PANEL = { width: 320, height: 172 }
const GAP = 20
const BG = '#17131d'
const CARD = '#1f1a27'
const RULE = '#3a3346'
const DIM = '#a8a2b8'
const INK = '#eeeaf4'
const ORANGE = '#ff8800'

const repeat = (frame: Frame, times: number): Frame[] => Array.from({ length: times }, () => frame)
const typing = 'fix the login bug please'

const PANELS: Panel[] = [
  {
    title: 'watches you type',
    frames: [0, 4, 8, 12, 16, 20, 24, 24, 24].map(n => ({ line: '', typed: typing.slice(0, n) })),
  },
  {
    title: 'taps its foot while you decide',
    frames: [...repeat({ emote: 'tap', line: 'psst. Bash needs your ok.' }, 6), ...repeat({ kind: 'happy', emote: 'hop', line: 'thanks!' }, 2)],
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

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const local = { hour: 12, weekday: 2, month: 10, day: 27 }
const noon = Date.UTC(2026, 9, 27, 6, 30)

const columns = 2
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
      parts += `<text x="${x + 14}" y="${y + 130}" fill="${ORANGE}" font-weight="700">Clawd</text>`
      parts += `<text x="${x + 14}" y="${y + 152}" fill="${DIM}">${escape(frame.line)}</text>`
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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace" font-size="15">
<title>Clawd's newer tricks: watching you type, tapping its foot at a permission prompt, a face for every mood, reading glasses, stretch breaks and confetti for long turns</title>
<style>
${styles.join('\n')}
</style>
<rect width="${width}" height="${height}" rx="12" fill="${BG}"/>
${cards.join('\n')}
</svg>
`

process.stdout.write(svg)

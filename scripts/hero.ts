// Draws assets/clawd.svg, the README's opening picture: Clawd above a Claude Code prompt, going
// through a few of its acts, drawn by the mod's own scene code. Run from the repository's root:
//
//   bun scripts/hero.ts > assets/clawd.svg

import type { EmoteName, Kind } from '../types'

import { clawdScene, sceneSvg } from '../hooks/clawd'

// One act: what Clawd does and says for `frames` frames, at what hour, with what in the prompt
// and on the spinner line above Clawd.
type Act = {
  kind?: Kind
  emote?: EmoteName
  line: string
  frames: number
  hour?: number
  prompt?: string
  spinner?: string
  // Typed into the prompt a few letters a frame, for Clawd to watch.
  typing?: string
}

const ACTS: Act[] = [
  { kind: 'happy', emote: 'wave', line: 'o/', frames: 4, hour: 9 },
  { kind: 'read', line: 'reading app.py…', frames: 4, hour: 10, spinner: 'Reading…' },
  { kind: 'oops', emote: 'dizzy', line: 'everything is spinning.', frames: 4, hour: 11, spinner: 'Fixing…' },
  { line: '', frames: 6, hour: 12, typing: 'add a dark mode toggle' },
  { kind: 'happy', emote: 'jedi', line: 'use the --force, Luke.', frames: 4, hour: 14, spinner: 'Pushing…' },
  { kind: 'happy', emote: 'sing', line: 'we will, we will… lint you ♪', frames: 5, hour: 16 },
  { kind: 'love', emote: 'hearts', line: 'aw, thanks!', frames: 4, hour: 17, prompt: '/pet' },
  { kind: 'think', emote: 'meditate', line: 'one with the code…', frames: 6, hour: 22, spinner: 'Pondering…' },
  { kind: 'happy', emote: 'party', line: 'shipped it! ✦', frames: 5, hour: 23 },
]

// Each frame shows this long.
const FRAME_S = 0.7
// One cell of the band.
const CELL = { width: 10, height: 20 }
const WIDTH = 660
const HEIGHT = 220
const BG = '#17131d'
const BAR = '#241e2c'
const RULE = '#3a3346'
const DIM = '#a8a2b8'
const INK = '#eeeaf4'
const ORANGE = '#ff8800'

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const frames: string[] = []
for (const act of ACTS) {
  for (let i = 0; i < act.frames; i++) {
    const typed = act.typing === undefined ? (act.prompt ?? '') : act.typing.slice(0, Math.round((act.typing.length * (i + 1)) / act.frames))
    const rows = clawdScene({
      kind: act.kind ?? 'idle',
      emote: act.emote,
      frame: i + 1,
      poseFrame: i,
      nowMs: Date.UTC(2026, 9, 27, 6, 30),
      local: { hour: act.hour ?? 12, weekday: 2, month: 10, day: 27 },
      ...(act.typing !== undefined && { typing: { caret: 2 + typed.length, isPet: false } }),
    })
    let frame = sceneSvg(rows, CELL).replace('<svg ', '<svg x="40" y="64" ')
    if (act.spinner !== undefined) frame += `<text x="20" y="54" fill="${ORANGE}">✻ <tspan fill="${DIM}">${escape(act.spinner)}</tspan></text>`
    frame += `<text x="230" y="84" fill="${ORANGE}" font-weight="700">Clawd${act.kind === 'love' ? ' ♥' : ''}</text>`
    if (act.line !== '') frame += `<text x="230" y="104" fill="${DIM}">${escape(act.line)}</text>`
    frame += `<text x="20" y="178" fill="${INK}">❯ ${escape(typed)}<tspan fill="${DIM}">▏</tspan></text>`
    frames.push(frame)
  }
}

const cycle = frames.length * FRAME_S
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace" font-size="15">
<title>Clawd, a crab above the Claude Code prompt: waving, reading, dizzy, watching you type, a Jedi, singing, petted, meditating and celebrating</title>
<style>
.f { opacity: 0; animation: show ${cycle.toFixed(2)}s infinite; animation-timing-function: step-end; }
@keyframes show { 0% { opacity: 1 } ${(100 / frames.length).toFixed(4)}% { opacity: 0 } 100% { opacity: 0 } }
</style>
<rect width="${WIDTH}" height="${HEIGHT}" rx="12" fill="${BG}"/>
<path d="M0 12a12 12 0 0 1 12-12h${WIDTH - 24}a12 12 0 0 1 12 12v16H0z" fill="${BAR}"/>
<circle cx="22" cy="14" r="5" fill="#ff5f57"/><circle cx="40" cy="14" r="5" fill="#febc2e"/><circle cx="58" cy="14" r="5" fill="#28c840"/>
<text x="${WIDTH / 2}" y="18" text-anchor="middle" fill="${DIM}" font-size="12">claude — ~/projects/app</text>
<rect x="20" y="154" width="${WIDTH - 40}" height="1" fill="${RULE}"/>
<rect x="20" y="186" width="${WIDTH - 40}" height="1" fill="${RULE}"/>
${frames.map((frame, i) => `<g class="f" style="animation-delay:${(i * FRAME_S).toFixed(2)}s">${frame}</g>`).join('\n')}
</svg>
`

process.stdout.write(svg)

import { expect, test } from 'claude-code/testing'

import { CLAWD, faceOf, joinRuns, clawdScene, sceneSvg, EMOTE_NAMES } from '../hooks/clawd'
import {
  BAND,
  auraShown,
  OPTIONS,
  NOON_IST,
  LATE_EVENING_IST,
  TYPED,
  start,
  cellsOf,
  TOQUE,
} from './helpers'

test('outside the terminal Clawd is drawn as a picture, its name and line as text', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)

  for (const surface of ['vscode', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const drawing = await ui.find({ type: 'Svg' })
    expect(String(drawing?.props.source)).toMatch(/^<svg [^>]*width="136" height="64"/)
    expect(String(drawing?.props.source)).toContain('fill="#ff8800"')
    expect(drawing?.props.alt).toBe('Clawd')
    expect(await ui.find({ type: 'Text', text: /^Clawd$/ })).toBeTruthy()
    // No block characters left to drift apart.
    expect(await ui.find({ type: 'Text', text: /▐▙███▟▌|▐▛███▜▌/ })).toBeFalsy()
    await ui.unmount()
  }
})

test('the picture draws block characters as pixel rectangles and the rest as text', () => {
  const svg = sceneSvg([
    [{ text: '█▀', color: '#ff8800' }],
    [{ text: '▐', color: '#ff8800' }, { text: '─', color: '#1a1a1a', backgroundColor: '#ff8800' }, { text: '<', color: '#ffcb6b' }],
  ])

  expect(svg).toMatch(/^<svg [^>]*width="24" height="32"/)
  // The top half row runs on across both cells: one rectangle 16 wide.
  expect(svg).toContain('<rect x="0" y="0" width="16" height="8" fill="#ff8800"/>')
  expect(svg).toContain('<rect x="0" y="8" width="8" height="8" fill="#ff8800"/>')
  // The eye: its cell's background, then a dark line through the middle.
  expect(svg).toContain('<rect x="8" y="16" width="8" height="16" fill="#ff8800"/>')
  expect(svg).toContain('<rect x="8" y="23" width="8" height="2" fill="#1a1a1a"/>')
  expect(svg).toContain('>&lt;</text>')
})

test('Clawd is drawn in NarutoDark orange', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/app.py' })

  const ui = await $.ui.mount(BAND)
  // Reading glasses: a dark frame round each of its own eyes, the bridge across the orange face,
  // and the outer rims past the face's edges, on no orange of their own.
  const rims = (await ui.findAll({ type: 'Text', text: /\(/ })).map(one => one.props)
  expect(rims).toContainEqual(expect.objectContaining({ color: '#1a1a1a', backgroundColor: '#ff8800' }))
  expect(rims.some(one => one.backgroundColor === undefined)).toBe(true)
  expect(await ui.find({ type: 'Text', text: /^▐▛$/ })).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /^\)─\($/ }))?.props.backgroundColor).toBe('#ff8800')
  // Busy reading, its claws go up and down.
  expect((await ui.find({ type: 'Text', text: /^(▝▜█████▛▘|▗▟█████▙▖)$/ }))?.props.color).toBe('#ff8800')
  expect(await ui.find({ type: 'Text', text: /reading app\.py/ })).toBeTruthy()
  await ui.unmount()
})

test('under the noon sun Clawd puts sunglasses on only for a while', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^██▀██$/ })).toBeFalsy()

  await $.command.run({ ...TYPED, command: 'pet', args: 'shades' })
  const shades = await ui.find({ type: 'Text', text: /^██▀██$/ })
  expect(shades?.props.backgroundColor).toBe('#ff8800')
  expect(await ui.find({ type: 'Text', text: /^☀$/ })).toBeTruthy()
  await ui.unmount()
})

test('the moon is out in the evening, and no sunglasses', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, LATE_EVENING_IST)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^[○☽●☾]$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^☀$/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /^██▀██$/ })).toBeFalsy()
  await ui.unmount()
})

test('a hopping Clawd springs up with a ! and crouches on the next frame', () => {
  const local = { hour: 10, weekday: 2, month: 10, day: 27 }
  const text = (row: { text: string }[]) => row.map(part => part.text).join('')

  const up = clawdScene({ kind: 'love', emote: 'hop', frame: 0, nowMs: NOON_IST, local })
  const down = clawdScene({ kind: 'love', emote: 'hop', frame: 1, nowMs: NOON_IST, local })

  // Up: face with a !, raised claws, legs. Down: an empty row, then face and lowered claws.
  expect(text(up[1]!)).toContain('!')
  expect(text(up[2]!)).toContain('▗▟█████▙▖')
  expect(text(up[3]!)).toContain('▘▘ ▝▝')
  expect(text(down[1]!).trim()).toBe('')
  expect(text(down[3]!)).toContain('▝▜█████▛▘')
})

test('a meditating Clawd starts where it stands and floats half a row a frame, under the sun', () => {
  // At noon, the sun right over Clawd.
  const local = { hour: 12, weekday: 2, month: 10, day: 27 }
  const text = (row: { text: string }[]) => row.map(part => part.text).join('')
  // How far down the shut eyes are from the standing face's row, in rows.
  const depth = (rows: { text: string }[][]) => {
    const at = rows.findIndex(row => row.some(part => part.text === '─' || part.text === '▔'))
    return at - 1 - (rows[at]!.some(part => part.text === '▔') ? 0.5 : 0)
  }

  const standing = clawdScene({ kind: 'think', emote: undefined, frame: 5, nowMs: NOON_IST, local })
  expect(text(standing[1]!)).toContain('▐▙███▟▌')
  const depths = Array.from({ length: 8 }, (_, poseFrame) => {
    const rows = clawdScene({ kind: 'think', emote: 'meditate', frame: 5 + poseFrame, poseFrame, nowMs: NOON_IST, local })
    expect(text(rows[0]!)).toContain('☀')
    // Legs tucked away.
    expect(rows.map(text).join('\n')).not.toMatch(/▘▘ ▝▝|▝▝ ▘▘/)
    return depth(rows)
  })

  expect(depths).toEqual([0, 0.5, 1, 0.5, 0, 0.5, 1, 0.5])
})

test('the umbrella stands off to the right of the face, its handle hooked into the right claw', () => {
  const local = { hour: 10, weekday: 2, month: 10, day: 27 }

  for (let frame = 0; frame < 4; frame++) {
    const [sky, face, arms] = clawdScene({ kind: 'idle', emote: 'rain', frame, nowMs: NOON_IST, local }).map(cellsOf)
    const faceEnd = face!.findIndex(cell => cell.text === '▌')
    const canopy = sky!.flatMap((cell, at) => (cell.color === '#ff91de' ? [at] : []))
    expect(canopy.length).toBe(5)
    // No piece of the canopy hangs over the face.
    expect(Math.min(...canopy)).toBeGreaterThan(faceEnd)
    // The shaft runs down from the canopy's middle to the hook, which turns into the claw's tip.
    const middle = canopy[2]!
    expect(face![middle]?.text).toBe('│')
    expect(arms![middle]?.text).toBe('╯')
    expect(arms!.slice(middle - 2, middle).map(cell => cell.text).join('')).toBe('▘─')
  }
})

test('reading glasses stick out past the face, but the head under them stays its own size', () => {
  const local = { hour: 10, weekday: 2, month: 10, day: 27 }
  // The columns Clawd's own orange covers in a row, and the glyphs at its two edges.
  const head = (row: { text: string; color?: string; backgroundColor?: string }[]) => {
    const cells = row.flatMap(part => [...part.text].map(text => ({ text, isHead: part.color === CLAWD || part.backgroundColor === CLAWD })))
    const first = cells.findIndex(cell => cell.isHead)
    const last = cells.findLastIndex(cell => cell.isHead)
    return { first, last, edges: `${cells[first]?.text}${cells[last]?.text}`, width: cells.length }
  }

  for (const glasses of [{ kind: 'read', emote: undefined }, { kind: 'idle', emote: 'glasses' }] as const) {
    const plain = clawdScene({ kind: 'idle', emote: undefined, frame: 1, nowMs: NOON_IST, local })
    const reading = clawdScene({ ...glasses, frame: 1, nowMs: NOON_IST, local })
    expect(head(reading[1]!)).toMatchObject({ first: head(plain[1]!).first, last: head(plain[1]!).last, edges: '▐▌' })
    // The rims sit just outside it, one either side.
    const text = reading[1]!.map(part => part.text).join('')
    expect(text[head(plain[1]!).first - 1]).toBe('(')
    expect(text[head(plain[1]!).last + 1]).toBe(')')
  }
})

test("Clawd's face follows its mood: a wince for trouble, hearts for love, a start at a seagull", () => {
  expect(faceOf('oops', undefined, 1)).toBe('wince')
  expect(faceOf('love', undefined, 1)).toBe('love')
  expect(faceOf('idle', 'hearts', 1)).toBe('love')
  expect(faceOf('idle', 'seagull', 1)).toBe('surprised')
  expect(faceOf('idle', 'bow', 1)).toBe('smug')
  expect(faceOf('read', undefined, 1)).toBe('glasses')
  expect(faceOf('think', undefined, 1)).toBe('up')
  // An emote's own face wins over the mood; a happy-eyed one wins over trouble.
  expect(faceOf('read', 'shades', 1)).toBe('shades')
  expect(faceOf('oops', 'party', 1)).toBe('happy')
  // A pose that shuts its eyes shuts them, whatever else.
  expect(faceOf('oops', 'hearts', 1, true)).toBe('shut')
  // It blinks now and then, but only with nothing going on.
  expect(faceOf('idle', undefined, 0)).toBe('shut')
  expect(faceOf('oops', undefined, 0)).toBe('wince')
})

test('heart eyes are drawn in deep red, so they show on the orange face', () => {
  const local = { hour: 10, weekday: 2, month: 10, day: 27 }
  const [, face] = clawdScene({ kind: 'love', emote: undefined, frame: 1, nowMs: NOON_IST, local })
  const hearts = face!.filter(part => part.text === '♥')
  expect(hearts).toHaveLength(2)
  for (const heart of hearts) expect(heart).toMatchObject({ color: '#c0143c', backgroundColor: CLAWD })
})

test('neighbouring runs in one style are joined, so a terminal draws fewer pieces', () => {
  const local = { hour: 10, weekday: 2, month: 10, day: 27 }
  const rows = clawdScene({ kind: 'idle', emote: undefined, frame: 1, nowMs: NOON_IST, local })
  const joined = joinRuns(rows)
  const text = (row: { text: string }[]) => row.map(part => part.text).join('')

  // The same picture, in fewer pieces: the sky's empty cells become one run.
  expect(joined.map(text)).toEqual(rows.map(text))
  expect(joined[0]!.length).toBeLessThan(rows[0]!.length)
  for (const row of joined) {
    for (const [i, part] of row.entries()) {
      const next = row[i + 1]
      if (next !== undefined) expect([next.color, next.backgroundColor]).not.toEqual([part.color, part.backgroundColor])
    }
  }
})

test('a spinning Clawd turns round a quarter a frame: front, side, back, other side', () => {
  const local = { hour: 21, weekday: 2, month: 10, day: 27 }
  const text = (row: { text: string }[]) => row.map(part => part.text).join('').trim()
  const views = Array.from({ length: 5 }, (_, frame) => clawdScene({ kind: 'idle', emote: 'spin', frame, nowMs: NOON_IST, local }))

  expect(views.map(rows => text(rows[1]!))).toEqual(['▐^███^▌', '▐██▜▌', '▐█████▌', '▐▛██▌', '▐^███^▌'])
  // Side on, it trails a swoosh behind it; front and back, none.
  expect(text(views[1]![2]!)).toBe('≈▐████▙▖')
  expect(text(views[3]![2]!)).toBe('▗▟████▌≈')
  expect(text(views[2]![2]!)).toBe('▝▜█████▛▘')
})

test('every frame of the umbrella and the spin fits within the sky', () => {
  for (const emote of ['rain', 'spin'] as const) {
    for (const hour of [3, 12.5]) {
      for (let frame = 0; frame < 8; frame++) {
        const rows = clawdScene({ kind: 'idle', emote, frame, nowMs: NOON_IST, local: { hour, weekday: 2, month: 10, day: 27 }, crew: 2 })
        for (const row of rows) expect(cellsOf(row).length).toBeLessThanOrEqual(17)
      }
    }
  }
})

test("the chef's hat sits centered over the face, a wide puff on a thin band, and fits within the sky", () => {
  const local = { hour: 12.5, weekday: 2, month: 10, day: 27 }

  for (let frame = 0; frame < 4; frame++) {
    const rows = clawdScene({ kind: 'idle', emote: 'chef', frame, nowMs: NOON_IST, local }).map(cellsOf)
    const [sky, face] = rows
    const hat = sky!.flatMap((cell, at) => (cell.color === TOQUE ? [at] : []))
    expect(hat.map(at => sky![at]!.text).join('')).toBe('▀▀███▀▀')
    // The hat spans the face exactly, from its left edge to its right one.
    const faceStart = face!.findIndex(cell => cell.text === '▐')
    expect(hat).toEqual(Array.from({ length: 7 }, (_, i) => faceStart + i))
    expect(face![faceStart + 6]?.text).toBe('▌')
    for (const row of rows) expect(row.length).toBeLessThanOrEqual(17)
  }
})

test('a bowing Clawd dips every other frame with its claws folded low', () => {
  const local = { hour: 10, weekday: 2, month: 10, day: 27 }
  const text = (row: { text: string }[]) => row.map(part => part.text).join('')

  const up = clawdScene({ kind: 'love', emote: 'bow', frame: 0, nowMs: NOON_IST, local })
  const down = clawdScene({ kind: 'love', emote: 'bow', frame: 1, nowMs: NOON_IST, local })

  expect(text(up[2]!)).toContain('▗▄█████▄▖')
  expect(text(up[3]!)).toContain('▘▘ ▝▝')
  expect(text(down[1]!).trim()).toBe('')
  expect(text(down[3]!)).toContain('▗▄█████▄▖')
})

test('a meditating Clawd sits with its claws raised beside its face, eyes shut, humming, and floats down and back', () => {
  const local = { hour: 12, weekday: 2, month: 10, day: 27 }
  const text = (row: { text: string }[]) => row.map(part => part.text).join('')
  const frames = [0, 1, 2].map(poseFrame => clawdScene({ kind: 'think', emote: 'meditate', frame: poseFrame, poseFrame, nowMs: NOON_IST, local }).map(text))
  // The row its shut eyes are on, and the mote's.
  const eyesAt = (rows: string[]) => rows.findIndex(row => /[─▔]███[─▔]/.test(row))
  const moteAt = (rows: string[]) => rows.findIndex((row, r) => r > 0 && /[·˚✧]/.test(row.slice(0, 2)))

  const [first, second, third] = frames as [string[], string[], string[]]
  // Claw tips up either side of its face, eyes shut, and no legs under it.
  expect(first[1]).toMatch(/▟.*▐─███─▌.*▙/)
  expect(first.join('\n')).not.toMatch(/▘▘ ▝▝|▝▝ ▘▘/)
  expect(first[1]).toContain('ᵒᵐ')
  // Half a row down a frame: its eyes along the top of the next row, then the middle of it.
  expect(eyesAt(first)).toBe(1)
  expect(second[eyesAt(second)]).toContain('▔███▔')
  expect(eyesAt(second)).toBe(2)
  expect(eyesAt(third)).toBe(2)
  // A mote of light drifts up its left side, a row a frame.
  expect([moteAt(first), moteAt(second), moteAt(third)]).toEqual([3, 2, 1])
})

test('/pet meditate glows and hums in the band', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'meditate' })

  expect(await auraShown(ui)).toBe(true)
  expect(await ui.find({ type: 'Text', text: /^ᵒᵐ$/ })).toBeTruthy()
  await ui.unmount()
})

test('a stretch reaches both claws up over its head, and a yawn opens wide', () => {
  const local = { hour: 10, weekday: 2, month: 10, day: 27 }
  const text = (row: { text: string }[]) => row.map(part => part.text).join('')
  const [sky, , claws] = clawdScene({ kind: 'idle', emote: 'stretch', frame: 0, nowMs: NOON_IST, local }).map(text)
  expect(sky).toMatch(/▟.{5}▙/)
  expect(claws).toContain('▗▄█████▄▖')

  const [, face, body] = clawdScene({ kind: 'idle', emote: 'yawn', frame: 0, nowMs: NOON_IST, local }).map(text)
  expect(face).toContain('─███─')
  expect(body).toContain('▝▜██O██▛▘')
})

test('every emote, on every frame, by day and by night, fits within the band', () => {
  const width = (row: { text: string }[]) => row.reduce((cells, part) => cells + [...part.text].length, 0)
  for (const emote of EMOTE_NAMES) {
    for (const hour of [10, 22]) {
      for (let frame = 0; frame < 8; frame++) {
        const rows = clawdScene({ kind: 'idle', emote, frame, poseFrame: frame, nowMs: NOON_IST, local: { hour, weekday: 2, month: 10, day: 27 }, castle: 10 })
        expect({ emote, frame, widest: Math.max(...rows.map(width)) <= 17 }).toEqual({ emote, frame, widest: true })
      }
    }
  }
})

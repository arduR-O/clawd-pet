import { expect, mock, test } from 'claude-code/testing'

import { AURA, CALM, clawdScene, sceneSvg, songbookLines, spinnerTake } from '../hooks/clawd'

const BAND = {
  plugin: 'clawd',
  component: 'AbovePrompt',
  surface: 'terminal',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 60,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

type Args = Parameters<Parameters<typeof test>[1]>

type Shown = { findAll: (query: { type: string }) => Promise<readonly { props: { backgroundColor?: string } }[]> }

// Whether the aura round a meditating Clawd shows.
async function auraShown(ui: Shown) {
  return (await ui.findAll({ type: 'Text' })).some(one => AURA.includes(one.props.backgroundColor ?? ''))
}

const MUSIC = 'Queen, Wasia Project, Goodnight Saigon by Billy Joel'
// The settings the tests run with: India's time, a 17:30 leave time and some music.
const OPTIONS = { utc_offset: '+05:30', leave_at: '17:30', music: MUSIC }
// With Last.fm on as well.
const LASTFM = { options: { ...OPTIONS, lastfm_user: 'listener', lastfm_api_key: 'k3y' } }

// 06:30 UTC is noon in India, the offset Clawd's sky follows by default.
const NOON_IST = Date.UTC(2026, 9, 27, 6, 30)
const LATE_EVENING_IST = Date.UTC(2026, 9, 27, 17, 0)

// The tools the plugin registered in the last test's session.
const registered: { name: string; isDeferred?: unknown }[] = []

async function start($: Args[0], on: Args[1], stored: Record<string, unknown> = {}, now = 1_000_000) {
  const clock = mock.clock(on, { now })
  mock.store(on, stored)
  on('command.register', () => ({ value: { command: 'pet' } }))
  registered.length = 0
  on('tool.register', (_, e) => {
    registered.push(e)

    return { value: { tool: `mcp__clawd__${e.name}` } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  return clock
}

test('Moss reacts to a Bash call, then settles', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'moss' })
  await $.tool.call({ tool: 'Bash', command: 'ls -la' })

  const ui = await $.ui.mount(BAND)
  expect((await ui.find({ type: 'Text', text: /\$ ls -la/ }))?.text).toBe('$ ls -la')
  expect(await ui.find({ type: 'Text', text: /> </ })).toBeTruthy()

  await clock.advance(4000)
  expect(await ui.find({ type: 'Text', text: /\$ ls/ })).toBeFalsy()
  await ui.unmount()
})

test('/pet counts pets across calls', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'moss' })
  await $.command.run({ command: 'pet', args: '' })
  await $.command.run({ command: 'pet', args: '' })

  const ui = await $.ui.mount(BAND)
  expect((await ui.find({ type: 'Text', text: /purr/ }))?.text).toBe('purr (pet #2)')
  expect(await ui.find({ type: 'Text', text: /♥ ♥/ })).toBeTruthy()
  await ui.unmount()
})

test('Moss falls asleep after a quiet while', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'moss' })
  await clock.advance(6 * 60 * 1000)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /z z z/ })).toBeTruthy()
  await ui.unmount()
})

test('Clawd is the default', { options: OPTIONS }, async ($, on) => {
  await start($, on)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^Clawd$/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet refresh-songs forgets the songbook and writes a new one', LASTFM, async ($, on) => {
  const prompts: string[] = []
  on('model.complete', (_, e) => {
    prompts.push(e.prompt)
    const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

    return { value: { isAnswered: true, text: 'where do i begiiin\nwe will, we will\nsomebody to looove', usage } }
  })
  on('http.fetch', () => ({ value: { ok: true, status: 200, text: '{}' } }))
  const songbook = { day: '10-27', source: 'lastfm:listener', style: 4, taste: 'x', checkedAt: NOON_IST, lines: ['old song ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)
  expect(prompts.length).toBe(0)

  const ran = await $.command.run({ command: 'pet', args: 'refresh-songs' })
  await clock.advance(1_500)

  expect(ran.text).toBeUndefined()
  expect(prompts.length).toBe(1)
})

test('/pet refresh-songs with no music set says Clawd keeps its built-in songs', { options: { utc_offset: '+05:30' } }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)

  const ran = await $.command.run({ command: 'pet', args: 'refresh-songs' })

  expect(ran.text).toContain('built-in songs')
})

test('/pet off hides the pet, and Clawd turns down pets and Claude', { options: OPTIONS }, async ($, on) => {
  // The engine's own band, drawn when the pet steps aside.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
  await start($, on, { species: 'clawd' })
  const ui = await $.ui.mount(BAND)

  const off = await $.command.run({ command: 'pet', args: 'off' })
  expect(off.text).toBe('Pet hidden until /pet on.')
  expect(await ui.find({ type: 'Text', text: /^Clawd$/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeTruthy()
  expect((await $.command.run({ command: 'pet', args: '' })).text).toBe('The pet is hidden; /pet on brings it back.')
  expect((await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'hi' })).result).toContain('/pet off')
  await ui.unmount()
})

test('a pet hidden in an earlier session stays hidden until /pet on', { options: OPTIONS }, async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
  await start($, on, { species: 'clawd', off: true })
  const later = await $.ui.mount(BAND)
  expect(await later.find({ type: 'Text', text: /^Clawd$/ })).toBeFalsy()
  await $.command.run({ command: 'pet', args: 'on' })
  expect(await later.find({ type: 'Text', text: /^Clawd$/ })).toBeTruthy()
  await later.unmount()
})

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

test('the garden starts as seeds', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'garden' })

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^garden$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /0\/6 in bloom/ })).toBeTruthy()
  await ui.unmount()
})

test('watering grows the garden, and growth is kept', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'garden', growth: 17 })
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /5\/6 in bloom/ })).toBeTruthy()

  await $.command.run({ command: 'pet', args: '' })
  expect(await ui.find({ type: 'Text', text: /in full bloom/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /watered \(#1\)/ })).toBeTruthy()
  await ui.unmount()
})

test('Clawd is drawn in NarutoDark orange', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/app.py' })

  const ui = await $.ui.mount(BAND)
  // Reading glasses: a dark frame round each of its own eyes, the bridge across the orange face.
  expect((await ui.find({ type: 'Text', text: /^\($/ }))?.props).toMatchObject({ color: '#1a1a1a', backgroundColor: '#ff8800' })
  expect(await ui.find({ type: 'Text', text: /^▛$/ })).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /^─$/ }))?.props.backgroundColor).toBe('#ff8800')
  // Busy reading, its claws go up and down.
  expect((await ui.find({ type: 'Text', text: /^(▝▜█████▛▘|▗▟█████▙▖)$/ }))?.props.color).toBe('#ff8800')
  expect(await ui.find({ type: 'Text', text: /reading app\.py/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet glasses puts the reading glasses on', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'glasses' })
  expect(await ui.findAll({ type: 'Text', text: /^\($/ })).toHaveLength(2)
  expect(await ui.findAll({ type: 'Text', text: /^\)$/ })).toHaveLength(2)
  expect(await ui.find({ type: 'Text', text: /\(glasses\)/ })).toBeTruthy()
  await ui.unmount()
})

test('under the noon sun Clawd puts sunglasses on only for a while', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^██▀██$/ })).toBeFalsy()

  await $.command.run({ command: 'pet', args: 'shades' })
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

test('Clawd keeps still while Claude is idle, for reading', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /too bright\./ })).toBeTruthy()

  // Past where the first idle emote used to come, 22-90s in.
  for (let wait = 0; wait < 3; wait++) {
    await clock.advance(30_000)
    expect(await ui.find({ type: 'Text', text: /too bright\./ })).toBeTruthy()
  }
  await ui.unmount()
})

test('Clawd does an emote now and then while Claude works', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  await $.prompt.submit({ text: 'go' })
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true } })

  // The first emote comes about 22s into the turn and lasts 4s or more.
  await clock.advance(24_000)
  // A song shows its first letters so far: one of the starter songs' openings.
  const emotes =
    /o\/|crab rave|blub|scuttle|did you hear|munch|soaking it in|shades on|six… seven|UwU|\*hic\*|SEAGULL|molts|cousin|pearl|tide's in|rain|vibing|wheee|^(mama|is th|we wi|don't|anoth|under|goodn|we sa|soft)/
  expect(await ui.find({ type: 'Text', text: emotes })).toBeTruthy()
  await ui.unmount()
})

test('a pet gets a reaction, and only a long spree gets told off', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: '' })
  expect(await ui.find({ type: 'Text', text: /^Clawd ♥$/ })).toBeTruthy()

  for (let pet = 2; pet <= 5; pet++) {
    await $.command.run({ command: 'pet', args: '' })
  }
  expect(await ui.find({ type: 'Text', text: /ok ok, I get it\./ })).toBeFalsy()

  await $.command.run({ command: 'pet', args: '' })
  expect(await ui.find({ type: 'Text', text: /ok ok, I get it\./ })).toBeTruthy()
  // Heavy lids rather than eyes that vanish.
  expect(await ui.find({ type: 'Text', text: /^▀$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeTruthy()
  await ui.unmount()
})

test("Clawd riffs on the spinner's word while Claude works", { options: OPTIONS }, async ($, on) => {
  // Stands for the engine's own spinner beneath the plugin.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>spinner</Text>
  })
  await start($, on, { species: 'clawd' }, NOON_IST)
  const spinner = await $.ui.mount({
    plugin: 'clawd',
    component: 'Spinner',
    surface: 'terminal',
    props: { word: 'Moonwalking', message: null, suffix: '…', mode: 'thinking' },
  })
  expect(await spinner.find({ type: 'Text', text: /spinner/ })).toBeTruthy()

  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true } })
  expect(await ui.find({ type: 'Text', text: /crabs invented that\. sideways\.|hee-hee!/ })).toBeTruthy()
  await ui.unmount()
  await spinner.unmount()
})

test('Clawd has opinions', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' })
  const ui = await $.ui.mount(BAND)
  const says = async (text: RegExp) => Boolean(await ui.find({ type: 'Text', text }))

  await $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  expect(await says(/not my shells/)).toBe(true)

  await $.tool.call({ tool: 'Bash', command: 'pytest -x' })
  expect(await says(/tests passed\. suspicious\./)).toBe(true)

  await $.tool.call({ tool: 'Read', file_path: '/repo/app.py' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/app.py' })
  expect(await says(/app\.py again\?/)).toBe(true)

  for (const pattern of ['foo', 'bar', 'baz']) {
    await $.tool.call({ tool: 'Grep', pattern })
  }
  expect(await says(/search #3\. lost, are we\?/)).toBe(true)

  // A plain command it has no view on is just shown.
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(await says(/^\$ ls$/)).toBe(true)
  await ui.unmount()
})

test('/pet treat feeds Clawd, and every 10th treat is noted', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd', treats: 9 }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const fed = await $.command.run({ command: 'pet', args: 'treat' })
  expect(fed.text).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /treat #10\. spoiled crab\./ })).toBeTruthy()
  await ui.unmount()
})

test('/pet trick does a trick, and only Clawd does them', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'trick' })
  const tricks = /ta-da|six… seven|boing|waves both claws|sideways shuffle|wiggle wiggle|takes a bow|UwU|spins/
  expect(await ui.find({ type: 'Text', text: tricks })).toBeTruthy()
  await ui.unmount()

  await $.command.run({ command: 'pet', args: 'moss' })
  const refused = await $.command.run({ command: 'pet', args: 'trick' })
  expect(refused.text).toContain('/pet clawd')
})

test('a commit that goes through gets confetti', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: add things"' })
  expect(await ui.find({ type: 'Text', text: /committed! party!/ })).toBeTruthy()

  await $.tool.call({ tool: 'Bash', command: 'git push origin main' })
  expect(await ui.find({ type: 'Text', text: /shipped it!/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet moss switches, and an unknown name is refused', { options: OPTIONS }, async ($, on) => {
  await start($, on)
  const refused = await $.command.run({ command: 'pet', args: 'dragon' })
  expect(refused.text).toContain('/pet garden')

  await $.command.run({ command: 'pet', args: 'moss' })
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^Moss$/ })).toBeTruthy()
  await ui.unmount()
})

test("Clawd greets the session's first prompt, then takes later ones in stride", { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ text: 'add a login page' })
  expect(await ui.find({ type: 'Text', text: /what are we making\?/ })).toBeTruthy()

  await $.prompt.submit({ text: 'now add tests' })
  expect(await ui.find({ type: 'Text', text: /what are we making\?/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /go on…|listening\.|mhm, mhm\.|another one!|on it\.|ok, next\./ })).toBeTruthy()
  await ui.unmount()
})

test('Clawd has a line for slash commands and skills', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  const says = async (text: RegExp) => Boolean(await ui.find({ type: 'Text', text }))

  await $.prompt.submit({ text: '/code-review', command: { name: 'code-review', args: '' } })
  expect(await says(/red pen time\./)).toBe(true)

  await $.prompt.submit({ text: '/deploy', command: { name: 'deploy', args: '' } })
  expect(await says(/\/deploy\? sure\./)).toBe(true)

  await $.tool.call({ tool: 'Skill', skill: 'some-plugin:simplify' })
  expect(await says(/less is more\./)).toBe(true)

  await $.tool.call({ tool: 'Skill', skill: 'pdf' })
  expect(await says(/grabbing the pdf manual\./)).toBe(true)
  await ui.unmount()
})

// Tuesday 27 Oct 2026, in IST (UTC+5:30): leave time is 17:30 IST, 12:00 UTC.
const istOn = (day: number, hour: number, minute: number) => Date.UTC(2026, 9, day, hour, minute) - 330 * 60_000

test('an hour before leave time, idle Clawd counts down to it', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, istOn(27, 17, 10))

  const ui = await $.ui.mount(BAND)

  // 17:30 - 17:10
  expect(await ui.find({ type: 'Text', text: /^20 min till 5:30\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('in the last 15 minutes before leave time, Clawd nudges for a commit', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, istOn(27, 17, 20))

  const ui = await $.ui.mount(BAND)

  expect(await ui.find({ type: 'Text', text: /^10 min to 5:30\. commit something\?$/ })).toBeTruthy()
  await ui.unmount()
})

test('at leave time, Clawd says go home', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, istOn(27, 17, 30))

  const ui = await $.ui.mount(BAND)

  expect(await ui.find({ type: 'Text', text: /^5:30! shoo, go home\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('a prompt after leave time gets asked if it is the last one', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, istOn(27, 18, 0))
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ text: 'fix the flaky test' })

  expect(await ui.find({ type: 'Text', text: /^past 5:30\? one more, then home\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('a turn that finishes after leave time ends with go home', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, istOn(27, 18, 0))
  const ui = await $.ui.mount(BAND)

  await $.turn.complete({ answer: 'fixed.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })

  expect(await ui.find({ type: 'Text', text: /^done\. now go home\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('on a weekend Clawd says nothing about leave time', { options: OPTIONS }, async ($, on) => {
  // Sunday 1 Nov 2026, 17:10 IST: dusk.
  await start($, on, { species: 'clawd' }, istOn(32, 17, 10))

  const ui = await $.ui.mount(BAND)

  expect(await ui.find({ type: 'Text', text: /5:30/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /^nice sunset\.$/ })).toBeTruthy()
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

test('deep thinking on a word with no take of its own gets a nod, not a meditation', { options: OPTIONS }, async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>spinner</Text>
  })
  await start($, on, { species: 'clawd' }, NOON_IST)
  const spinner = await $.ui.mount({
    plugin: 'clawd',
    component: 'Spinner',
    surface: 'terminal',
    props: { word: 'Wobbling', message: null, suffix: '…', mode: 'thinking' },
  })

  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true } })
  expect(await ui.find({ type: 'Text', text: /wobbling/ })).toBeTruthy()
  expect(await auraShown(ui)).toBe(false)
  await ui.unmount()
  await spinner.unmount()
})

test('a meditating Clawd tucks its legs away, eyes shut, small claws at its sides, and floats down and back', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'meditate' })
  // Small claws at its sides, tips turned up beside the face.
  expect(await ui.find({ type: 'Text', text: /^▗▐$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▝▜$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▛▘$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^█████$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^─$/ })).toBeTruthy()
  // An aura glows round it.
  expect(await auraShown(ui)).toBe(true)
  // Humming.
  expect(await ui.find({ type: 'Text', text: /^ᵒᵐ$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /▘▘ ▝▝|▝▝ ▘▘/ })).toBeFalsy()

  // A frame later it is half a row down, its shut eyes along the top of a row.
  await clock.advance(800)
  expect(await ui.find({ type: 'Text', text: /^▝▀▀▀▀▀▘$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▔$/ })).toBeTruthy()
  await ui.unmount()
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

test('/pet <emote> shows that emote on demand', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const shown = await $.command.run({ command: 'pet', args: 'uwu' })
  expect(shown.text).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^w$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /\(uwu\)/ })).toBeTruthy()

  await $.command.run({ command: 'pet', args: 'meditate' })
  expect(await auraShown(ui)).toBe(true)
  await ui.unmount()
})

// NOON_IST is a whole number of seconds divisible by 4, so leaving at it, or 1-3s after,
// picks pastime 0-3: sleep, fish, juggle, castle.
const LEFT_TO_FISH = NOON_IST + 1000
const LEFT_TO_JUGGLE = NOON_IST + 2000
const LEFT_TO_BUILD = NOON_IST + 3000
// Past the 5 min doze; 460 frames, mid-way through a fishing cycle of 30.
const AWAY_MS = 6 * 60 * 1000 + 8000

test('back at night after a doze, Clawd stretches awake', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, istOn(27, 2, 0))
  const ui = await $.ui.mount(BAND)
  await clock.advance(AWAY_MS)

  await $.prompt.submit({ text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^\*stretch\* oh, you're back!$/ })).toBeTruthy()
  await ui.unmount()
})

test('back by day, Clawd looks up from its pastime', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, LEFT_TO_FISH)
  const ui = await $.ui.mount(BAND)
  await clock.advance(AWAY_MS)

  await $.prompt.submit({ text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^oh hi! the fish weren't biting\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('away more than 25 minutes by day, Clawd has given up its pastime for a nap', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, LEFT_TO_FISH)
  // Mounted after the wait: drawing every frame of 26 minutes runs past the test's time limit.
  await clock.advance(26 * 60 * 1000)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^\*stretch\* oh, you're back!$/ })).toBeTruthy()
  await ui.unmount()
})

test('a prompt within 5 minutes gets no welcome back', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, LEFT_TO_FISH)
  const ui = await $.ui.mount(BAND)
  await clock.advance(4 * 60 * 1000)

  await $.prompt.submit({ text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^ooh, what are we making\?$/ })).toBeTruthy()
  await ui.unmount()
})

test('away by day, Clawd goes fishing', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd' }, LEFT_TO_FISH)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^fishing… shh\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^╱$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^~~[◦•]~$/ })).toBeTruthy()
  await ui.unmount()
})

test('away by day, Clawd juggles two pearls at a time', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd' }, LEFT_TO_JUGGLE)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^juggling\. don't distract me\.$/ })).toBeTruthy()
  expect(await ui.findAll({ type: 'Text', text: /^●$/ })).toHaveLength(2)
  await ui.unmount()
})

test('away by day with no turns done today, Clawd starts a sandcastle', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd' }, LEFT_TO_BUILD)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^building a sandcastle\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▗▖$/ })).toBeTruthy()
  await ui.unmount()
})

test("the sandcastle stands as tall as today's turns, with a flag from 10", { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd', castle: { day: '10-27', turns: 12 } }, LEFT_TO_BUILD)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^sandcastle: 12 turns tall\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▟██▙$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▐▌▐▌$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^⚑$/ })).toBeTruthy()
  await ui.unmount()
})

test("yesterday's sandcastle is gone", { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd', castle: { day: '10-26', turns: 12 } }, LEFT_TO_BUILD)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^building a sandcastle\.$/ })).toBeTruthy()
  await ui.unmount()
})

test("a finished turn adds a storey to today's stored sandcastle", { options: OPTIONS }, async ($, on) => {
  let kept: unknown
  on('store.set', { key: 'castle' }, (_, e, next) => {
    kept = e.value

    return next(e)
  })
  await start($, on, { species: 'clawd', castle: { day: '10-27', turns: 2 } }, NOON_IST)

  await $.turn.complete({ answer: 'fixed.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })

  expect(kept).toEqual({ day: '10-27', turns: 3 })
})

test("a subagent's finished turn adds nothing to the sandcastle", { options: OPTIONS }, async ($, on) => {
  let kept: unknown
  on('store.set', { key: 'castle' }, (_, e, next) => {
    kept = e.value

    return next(e)
  })
  await start($, on, { species: 'clawd', castle: { day: '10-27', turns: 2 } }, NOON_IST)

  await $.turn.complete({ answer: 'found it.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer', agentId: 'a1' })

  expect(kept).toBeUndefined()
})

test("the first turn of a new day starts a new sandcastle", { options: OPTIONS }, async ($, on) => {
  let kept: unknown
  on('store.set', { key: 'castle' }, (_, e, next) => {
    kept = e.value

    return next(e)
  })
  await start($, on, { species: 'clawd', castle: { day: '10-26', turns: 9 } }, NOON_IST)

  await $.turn.complete({ answer: 'fixed.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })

  expect(kept).toEqual({ day: '10-27', turns: 1 })
})

test('two failed tools in a row make Clawd facepalm', { options: OPTIONS }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: 'make: *** No rule', isError: true }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  await $.tool.call({ tool: 'Bash', command: 'make' })
  expect(await ui.find({ type: 'Text', text: /^pfft\. that broke\.$/ })).toBeTruthy()

  await $.tool.call({ tool: 'Bash', command: 'make' })

  expect(await ui.find({ type: 'Text', text: /^…again\.$/ })).toBeTruthy()
  // A claw over one eye.
  expect(await ui.find({ type: 'Text', text: /^▟█$/ })).toBeTruthy()
  await ui.unmount()
})

test('a failure after a success is not facepalmed', { options: OPTIONS }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: 'make: *** No rule', isError: true }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  await $.tool.call({ tool: 'Bash', command: 'make' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/Makefile' })

  await $.tool.call({ tool: 'Bash', command: 'make' })

  expect(await ui.find({ type: 'Text', text: /^pfft\. that broke\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('a new prompt starts the failure streak over', { options: OPTIONS }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: 'make: *** No rule', isError: true }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  await $.tool.call({ tool: 'Bash', command: 'make' })
  await $.prompt.submit({ text: 'try again' })

  await $.tool.call({ tool: 'Bash', command: 'make' })

  expect(await ui.find({ type: 'Text', text: /^pfft\. that broke\.$/ })).toBeTruthy()
  await ui.unmount()
})

const SUMMARY = { role: 'user', text: 'summary so far', toolUses: [] } as const

test('compacting the conversation squishes Clawd flat', { options: OPTIONS }, async ($, on) => {
  on('session.compact', () => ({ messages: [SUMMARY] }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.session.compact({ trigger: 'manual', messages: [SUMMARY] })

  expect(await ui.find({ type: 'Text', text: /^\*squish\* making room\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▟▛▀███▀▜▙$/ })).toBeTruthy()
  await ui.unmount()
})

test("a subagent's compaction leaves Clawd alone", { options: OPTIONS }, async ($, on) => {
  on('session.compact', () => ({ messages: [SUMMARY] }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.session.compact({ trigger: 'auto', agentId: 'a1', messages: [SUMMARY] })

  expect(await ui.find({ type: 'Text', text: /squish/ })).toBeFalsy()
  await ui.unmount()
})

test('a compaction computed ahead of time leaves Clawd alone', { options: OPTIONS }, async ($, on) => {
  on('session.compact', () => ({ messages: [SUMMARY] }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.session.compact({ trigger: 'precompute', messages: [SUMMARY] })

  expect(await ui.find({ type: 'Text', text: /squish/ })).toBeFalsy()
  await ui.unmount()
})

// The thinking family's acts, in order; the first and fourth are meditations, saying any of CALM.
const PONDERING = ['calm', 'shh. big brain at work.', 'blub… deep thoughts…', 'calm', 'thinking about shells…', 'blub… inner peace…']

// Shows the band working with `word` on a thinking spinner. No prompt starts the turn, so
// Clawd's emotes, which come only in a turn, stay off the spinner's acts.
async function thinkAbout($: Args[0], on: Args[1], word: string) {
  // Stands for the engine's own spinner beneath the plugin.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>spinner</Text>
  })
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const spinner = await $.ui.mount({
    plugin: 'clawd',
    component: 'Spinner',
    surface: 'terminal',
    props: { word, message: null, suffix: '…', mode: 'thinking' },
  })
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true } })
  await clock.advance(3200)

  return { clock, spinner, ui }
}

type Band = { findAll: (query: { type: string }) => Promise<readonly { text: string }[]> }

// Which of PONDERING Clawd is acting out ('calm' for any meditation), or undefined for none.
async function actShown(ui: Band) {
  const texts = (await ui.findAll({ type: 'Text' })).map(one => one.text)

  return texts.some(text => CALM.includes(text)) ? 'calm' : PONDERING.find(line => texts.includes(line))
}

// The meditation line Clawd is saying, if any.
async function calmShown(ui: Band) {
  return (await ui.findAll({ type: 'Text' })).map(one => one.text).find(text => CALM.includes(text))
}

// Whether `seen` runs on, in order, from somewhere in PONDERING, going round.
const followsPondering = (seen: readonly (string | undefined)[]) =>
  PONDERING.some((_, start) => seen.every((act, i) => act === PONDERING[(start + i) % PONDERING.length]))

test("while the spinner's word stays up, Clawd moves on to its next act every 12s", { options: OPTIONS }, async ($, on) => {
  const { clock, spinner, ui } = await thinkAbout($, on, 'Pondering')
  const seen = [await actShown(ui)]
  for (let step = 1; step < 3; step++) {
    await clock.advance(12_000)
    seen.push(await actShown(ui))
  }

  expect(followsPondering(seen)).toBe(true)
  await ui.unmount()
  await spinner.unmount()
})

test('a meditating line always comes with the hover, any other never, and the two lines differ', { options: OPTIONS }, async ($, on) => {
  const { clock, spinner, ui } = await thinkAbout($, on, 'Pondering')

  const calm: string[] = []
  for (let step = 0; step < PONDERING.length; step++) {
    const act = await actShown(ui)
    expect(act).toBeDefined()
    expect(await auraShown(ui)).toBe(act === 'calm')
    const line = await calmShown(ui)
    if (line !== undefined) calm.push(line)
    await clock.advance(12_000)
  }
  expect(calm.length).toBe(2)
  expect(calm[0]).not.toBe(calm[1])
  await ui.unmount()
  await spinner.unmount()
})

test('long thinking grows a thought bubble over Clawd', { options: OPTIONS }, async ($, on) => {
  const { clock, spinner, ui } = await thinkAbout($, on, 'Wobbling')
  expect(await ui.find({ type: 'Text', text: /^∘$/ })).toBeFalsy()

  // Starts 6s in and grows a step every 3s: full at 12s.
  await clock.advance(9200)

  expect(await ui.find({ type: 'Text', text: /·∘○/ })).toBeTruthy()
  await ui.unmount()
  await spinner.unmount()
})

test('a turn past two minutes makes Clawd sweat', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true } })
  await $.prompt.submit({ text: 'refactor everything' })
  expect(await ui.find({ type: 'Text', text: /^[’,]$/ })).toBeFalsy()

  await clock.advance(121_000)

  expect((await ui.find({ type: 'Text', text: /^[’,]$/ }))?.props.color).toBe('#8ab6d6')
  await ui.unmount()
})

test('a tiny cousin marches by while a subagent is out, and the crew is welcomed back', { options: OPTIONS }, async ($, on) => {
  let release = () => {}
  on('tool.call', { tool: 'Agent' }, async () => {
    await new Promise<void>(resolve => {
      release = resolve
    })

    return { result: {} }
  })
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const call = $.tool.call({ tool: 'Agent', description: 'look around', prompt: 'look around' })
  await clock.advance(800)
  expect(await ui.find({ type: 'Text', text: /^(▞▚|▚▞)$/ })).toBeTruthy()

  release()
  await call
  expect(await ui.find({ type: 'Text', text: /^the crew is back\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet hiccup makes Clawd hic', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'hiccup' })

  expect(await ui.find({ type: 'Text', text: /^hic!$/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet rain has Clawd hold up an umbrella', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'rain' })

  expect(await ui.find({ type: 'Text', text: /▗▟█▙▖/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /─╯/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /'/ })).toBeTruthy()
  await ui.unmount()
})

// A row as one cell per column, each with its character and color.
const cellsOf = (row: { text: string; color?: string }[]) => row.flatMap(part => [...part.text].map(text => ({ text, color: part.color })))

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

test('a spinning Clawd turns round a quarter a frame: front, side, back, other side', () => {
  const local = { hour: 21, weekday: 2, month: 10, day: 27 }
  const text = (row: { text: string }[]) => row.map(part => part.text).join('').trim()
  const views = Array.from({ length: 5 }, (_, frame) => clawdScene({ kind: 'idle', emote: 'spin', frame, nowMs: NOON_IST, local }))

  expect(views.map(rows => text(rows[1]!))).toEqual(['▐▀███▀▌', '▐██▜▌', '▐█████▌', '▐▛██▌', '▐▀███▀▌'])
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

test('/pet spin and the spinner word Spinning make Clawd spin', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'spin' })
  expect(await ui.find({ type: 'Text', text: /^\(spin\)$/ })).toBeTruthy()
  await ui.unmount()

  for (const word of ['Spinning', 'Whirlpooling']) {
    for (let step = 0; step < 2; step++) expect(spinnerTake(word, 0, step).pose).toBe('spin')
  }
})

test('a subagent sent off in the background is not waited back', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Agent', description: 'look around', prompt: 'look around', run_in_background: true })

  expect(await ui.find({ type: 'Text', text: /the crew is back/ })).toBeFalsy()
  await ui.unmount()
})

test('/pet sing sings a line from the songbook, a few letters at a time', { options: OPTIONS }, async ($, on) => {
  const songbook = { day: '10-27', source: `music:${MUSIC}`, style: 4, lines: ['mama, oooooooo, the build is green ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  // The songbook loads a moment after the session starts.
  await clock.advance(1_500)
  const ui = await $.ui.mount(BAND)

  const sung = await $.command.run({ command: 'pet', args: 'sing' })
  expect(sung.text).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^mama, oooo$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^[♪♫]$/ })).toBeTruthy()

  await clock.advance(6_000)
  expect(await ui.find({ type: 'Text', text: /^mama, oooooooo, the build is green ♪$/ })).toBeTruthy()
  await ui.unmount()
})

test("a stale songbook is rewritten once by Claude, in the music's vibe", { options: OPTIONS }, async ($, on) => {
  const prompts: string[] = []
  on('model.complete', (_, e) => {
    prompts.push(e.prompt)
    const text = '1. ooh, the tests are green\n- another one bites the bug\n"we will, we will lint you"\nok'
    const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

    return { value: { isAnswered: true, text, usage } }
  })
  const writes: unknown[] = []
  on('store.set', { key: 'songbook' }, (_, e, next) => {
    writes.push(e.value)

    return next(e)
  })
  const songbook = { day: '10-26', source: `music:${MUSIC}`, lines: ['yesterday ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)

  expect(prompts.length).toBe(1)
  expect(prompts[0]).toContain('Wasia Project')
  expect(writes).toEqual([
    {
      day: '10-27',
      source: `music:${MUSIC}`,
      style: 4,
      taste: MUSIC,
      checkedAt: NOON_IST + 1000,
      lines: ['ooh, the tests are green ♪', 'another one bites the bug ♪', 'we will, we will lint you ♪'],
    },
  ])
})

test('with no music and no Last.fm set, Clawd sings its built-in songs and calls no model', async ($, on) => {
  let asked = 0
  on('model.complete', () => {
    asked += 1

    return { value: { isAnswered: false, text: '' } }
  })
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  await clock.advance(1_500)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'sing' })

  expect(asked).toBe(0)
  expect(await ui.find({ type: 'Text', text: /^(mama|is th|we wi|don't|anoth|under|goodn|we sa|soft)/ })).toBeTruthy()
  await ui.unmount()
})

test("today's songbook is not written again", { options: OPTIONS }, async ($, on) => {
  let asked = 0
  on('model.complete', () => {
    asked += 1

    return { value: { isAnswered: false, reason: 'empty-reply' } }
  })
  const songbook = { day: '10-27', source: `music:${MUSIC}`, style: 4, lines: ['today ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)

  expect(asked).toBe(0)
})

test('/pet vibe puts on headphones, then Clawd breaks into song with them on', { options: OPTIONS }, async ($, on) => {
  const songbook = { day: '10-27', source: `music:${MUSIC}`, style: 4, lines: ['ooh, the tests are green ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'vibe' })
  expect(await ui.find({ type: 'Text', text: /^♪ \*vibing\* ♪$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^╭$/ })).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /^█$/ }))?.props.color).toBe('#8a8fbf')

  await clock.advance(5_000 + 6_000)
  expect(await ui.find({ type: 'Text', text: /^ooh, the tests are green ♪$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^╭$/ })).toBeTruthy()

  // The headphones come off once the song is over.
  await clock.advance(2_000)
  expect(await ui.find({ type: 'Text', text: /^╭$/ })).toBeFalsy()
  await ui.unmount()
})

test('away by day, Clawd may listen to music with its headphones on', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd' }, NOON_IST + 4000)
  await clock.advance(AWAY_MS)
  const ui = await $.ui.mount(BAND)

  expect(await ui.find({ type: 'Text', text: /^♪ \*vibing\* ♪$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^╭$/ })).toBeTruthy()
  await ui.unmount()
})

// Answers Last.fm's two lookups; `played` false answers as a user with no plays this week.
function lastfmStub(on: Parameters<Parameters<typeof test>[1]>[1], urls: string[], played = true) {
  on('http.fetch', (_, e) => {
    urls.push(e.url)
    const body = e.url.includes('gettopartists')
      ? { topartists: { artist: played ? [{ name: 'Laufey' }, { name: 'Queen' }] : [] } }
      : { toptracks: { track: played ? [{ name: 'From the Start', artist: { name: 'Laufey' } }] : [] } }

    return { value: { status: 200, ok: true, headers: {}, text: JSON.stringify(body) } }
  })
}

function modelStub(on: Parameters<Parameters<typeof test>[1]>[1], prompts: string[]) {
  on('model.complete', (_, e) => {
    prompts.push(e.prompt)
    const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

    return { value: { isAnswered: true, text: 'one ♪\ntwo two ♪\nthree three ♪', usage } }
  })
}

test("with a Last.fm key, the songbook follows this week's plays", LASTFM, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls)
  modelStub(on, prompts)
  // Today's book came from the music setting; Last.fm being set up writes a new one now.
  const songbook = { day: '10-27', source: `music:${MUSIC}`, lines: ['old ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)

  expect(urls.length).toBe(2)
  expect(urls.every(url => url.includes('user=listener') && url.includes('period=7day'))).toBe(true)
  expect(prompts[0]).toContain('Laufey, Queen, From the Start by Laufey')
})

test('with no plays this week, the songbook falls back to the music setting', LASTFM, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls, false)
  modelStub(on, prompts)
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  await clock.advance(1_500)

  expect(prompts[0]).toContain(MUSIC)
})

test('without a Last.fm key, Last.fm is never asked', { options: OPTIONS }, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls)
  modelStub(on, prompts)
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  await clock.advance(1_500)

  expect(urls).toEqual([])
  expect(prompts[0]).toContain(MUSIC)
})

const GOLD = '#ffcb6b'
const TOQUE = '#f4f1de'
const WATER = '#8ab6d6'

// Whether some part of the band reads `text` in `color`.
async function shows(ui: Awaited<ReturnType<Args[0]['ui']['mount']>>, text: RegExp, color: string) {
  return (await ui.findAll({ type: 'Text', text })).some(one => one.props.color === color)
}

const CHEF_LINES = ['chef claude in the kitchen.', 'needs more salt.', 'yes, chef!']
const SNACK_LINES = ['smells good. save me some.', 'is that for me?', '*sniff sniff*', 'I brought a fork.']

test('a cooking word puts the chef hat on for every chef line, and a crumb by every snack one', { options: OPTIONS }, async ($, on) => {
  const { clock, spinner, ui } = await thinkAbout($, on, 'Sautéing')
  const said = new Set<string>()

  for (let step = 0; step < CHEF_LINES.length + SNACK_LINES.length; step++) {
    const texts = (await ui.findAll({ type: 'Text' })).map(one => one.text)
    const line = [...CHEF_LINES, ...SNACK_LINES].find(one => texts.includes(one))
    expect(line).toBeDefined()
    said.add(line!)
    expect(await shows(ui, /^▀$/, TOQUE)).toBe(CHEF_LINES.includes(line!))
    expect(await shows(ui, /^·$/, GOLD)).toBe(SNACK_LINES.includes(line!))
    await clock.advance(12_000)
  }
  // Every act came round once.
  expect(said.size).toBe(CHEF_LINES.length + SNACK_LINES.length)
  await ui.unmount()
  await spinner.unmount()
})

test('/pet chef, /pet hardhat and /pet cry show those emotes', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ command: 'pet', args: 'chef' })
  expect(await ui.find({ type: 'Text', text: /^\(chef\)$/ })).toBeTruthy()
  expect(await shows(ui, /^▀$/, TOQUE)).toBe(true)

  await $.command.run({ command: 'pet', args: 'hardhat' })
  expect(await ui.find({ type: 'Text', text: /^\(hardhat\)$/ })).toBeTruthy()
  expect(await shows(ui, /^▗$/, GOLD)).toBe(true)
  expect(await shows(ui, /^▀$/, TOQUE)).toBe(false)

  await $.command.run({ command: 'pet', args: 'cry' })
  expect(await ui.find({ type: 'Text', text: /^\(cry\)$/ })).toBeTruthy()
  // Shut eyes and a tear.
  expect(await ui.find({ type: 'Text', text: /^─$/ })).toBeTruthy()
  expect(await shows(ui, /^[‚¸]$/, WATER)).toBe(true)
  await ui.unmount()
})

test('Onioning makes Clawd cry', { options: OPTIONS }, async ($, on) => {
  const { spinner, ui } = await thinkAbout($, on, 'Onioning')

  expect(await ui.find({ type: 'Text', text: /^(\*cries in crab\*|who is cutting onions\?)$/ })).toBeTruthy()
  expect(await shows(ui, /^[‚¸]$/, WATER)).toBe(true)
  await ui.unmount()
  await spinner.unmount()
})

test('fetching with curl has Clawd holding a snack', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'curl -s https://example.com' })

  expect(await ui.find({ type: 'Text', text: /^fetching snacks\?$/ })).toBeTruthy()
  expect(await shows(ui, /^·$/, GOLD)).toBe(true)
  await ui.unmount()
})

test('/simplify sits Clawd down to meditate', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ text: '/simplify', command: { name: 'simplify', args: '' } })

  expect(await ui.find({ type: 'Text', text: /^less is more\.$/ })).toBeTruthy()
  expect(await auraShown(ui)).toBe(true)
  await ui.unmount()
})

const RAISED = /^▗▟█████▙▖$/
const LOWERED = /^▝▜█████▛▘$/

test('more dependencies get a sigh with claws hanging, not pumping', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'npm install left-pad' })

  expect(await ui.find({ type: 'Text', text: /^more dependencies\? sigh\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▀$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: LOWERED })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: RAISED })).toBeFalsy()
  await ui.unmount()
})

test('passing tests get a suspicious squint, not a cheer', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'pytest -x' })

  expect(await ui.find({ type: 'Text', text: /^tests passed\. suspicious\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▀$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: LOWERED })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: RAISED })).toBeFalsy()
  await ui.unmount()
})

test('a prompt in the night gets a yawn', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, istOn(27, 2, 0))
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ text: 'one more thing' })

  expect(await ui.find({ type: 'Text', text: /^at this hour\?$/ })).toBeTruthy()
  // Eyes shut mid-yawn.
  expect(await ui.find({ type: 'Text', text: /^─$/ })).toBeTruthy()
  await ui.unmount()
})

test('back by day from the sandcastle, Clawd shows it off', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, LEFT_TO_BUILD)
  const ui = await $.ui.mount(BAND)
  await clock.advance(AWAY_MS)

  await $.prompt.submit({ text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^oh hi! look, a castle\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▗▖$/ })).toBeTruthy()
  await ui.unmount()
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

test("spinner lines about the tide, rain, made-up words and hot air get poses to match", () => {
  // Each step moves on to the family's next act, so enough steps meet them all.
  const pose = (word: string, line: string) =>
    Array.from({ length: 8 }, (_, step) => spinnerTake(word, 0, step)).find(one => one.line === line)?.pose

  expect(pose('Billowing', 'the tide is turning.')).toBe('tide')
  expect(pose('Ebbing', 'tide going out.')).toBe('tide')
  expect(pose('Precipitating', 'feels like rain.')).toBe('rain')
  expect(pose('Kerfuffling', 'is that even a word?')).toBe('peek')
  expect(pose('Bloviating', 'get to the point.')).toBe('enough')
})

test('a songbook drops repeated lines', () => {
  expect(songbookLines('ooh, the build ♪\nooh, the build ♪\n- under pressure… to ship')).toEqual([
    'ooh, the build ♪',
    'under pressure… to ship ♪',
  ])
})

test('a songbook written by an older prompt is written again', { options: OPTIONS }, async ($, on) => {
  const prompts: string[] = []
  modelStub(on, prompts)
  const songbook = { day: '10-27', source: `music:${MUSIC}`, lines: ['old style ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)

  expect(prompts.length).toBe(1)
  expect(prompts[0]).toContain('actually sings')
})

const LASTFM_SONGBOOK = {
  day: '10-27',
  source: 'lastfm:listener',
  style: 4,
  taste: 'Laufey, Queen, From the Start by Laufey',
  checkedAt: NOON_IST,
  lines: ['from the start… of the build ♪'],
}

test('Last.fm looked at moments ago is not asked again', LASTFM, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls)
  modelStub(on, prompts)
  const clock = await start($, on, { species: 'clawd', songbook: LASTFM_SONGBOOK }, NOON_IST)
  await clock.advance(1_500)

  expect(urls).toEqual([])
  expect(prompts).toEqual([])
})

// Last looked at over 3 hours ago, so the next look is due.
const LOOKED_LONG_AGO = NOON_IST - 3 * 60 * 60 * 1000 - 1

test('after 3 hours Last.fm is looked at again, and an unchanged week rewrites nothing', LASTFM, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls)
  modelStub(on, prompts)
  const songbook = { ...LASTFM_SONGBOOK, checkedAt: LOOKED_LONG_AGO }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)

  expect(urls.length).toBe(2)
  expect(prompts).toEqual([])
})

test('when your plays move on, the songbook is rewritten at the next look', LASTFM, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls)
  modelStub(on, prompts)
  const songbook = { ...LASTFM_SONGBOOK, taste: 'Andy Williams, Lewis Capaldi', checkedAt: LOOKED_LONG_AGO }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)

  expect(prompts.length).toBe(1)
  expect(prompts[0]).toContain('Laufey')
})

const TALK = 'mcp__clawd__clawd'

test('Claude gets a clawd tool, listed from the start and allowed without asking', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)

  expect(registered.map(one => [one.name, one.isDeferred])).toEqual([['clawd', false]])
  const verdict = await $.tool.check({ tool: TALK, input: { action: 'ask' } })
  expect(verdict.decision).toBe('allow')
})

test('Claude can have Clawd act something out, and Clawd says its line', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const done = await $.tool.call({ tool: TALK, action: 'act', emote: 'party', line: 'green tests, claude!' })
  expect(done.result).toBe('Clawd did "party" and said "green tests, claude!".')
  expect(await ui.find({ type: 'Text', text: /^green tests, claude!$/ })).toBeTruthy()
  // The tool call itself gets no reaction of its own over Clawd's line.
  expect(await ui.find({ type: 'Text', text: /mcp__clawd__clawd/ })).toBeFalsy()
  await ui.unmount()
})

test('Clawd refuses an emote it does not know, naming the ones it does', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)

  const refused = await $.tool.call({ tool: TALK, action: 'act', emote: 'backflip', line: 'hi' })
  expect(refused.deny).toContain('emote must be one of: wave, dance')
})

test("a long line is cut to fit beside Clawd", { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)

  const done = await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'x'.repeat(60) })
  expect(done.result).toBe(`Clawd did "wave" and said "${'x'.repeat(39)}…".`)
})

test('Claude may talk to Clawd twice a turn, and a new prompt starts the count over', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, NOON_IST)

  await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'hi' })
  await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'hi again' })
  const third = await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'and again' })
  expect(third.result).toContain('still busy')

  await $.prompt.submit({ text: 'next thing' })
  const fresh = await $.tool.call({ tool: TALK, action: 'ask' })
  expect(fresh.result).toContain('watching you work')
})

test('asking Clawd how it is doing tells Claude its pets, treats, sandcastle and songbook', { options: OPTIONS }, async ($, on) => {
  const songbook = { day: '10-27', source: `music:${MUSIC}`, style: 4, taste: MUSIC, lines: ['la ♪'] }
  const castle = { day: '10-27', turns: 4 }
  await start($, on, { species: 'clawd', pets: 12, treats: 1, castle, songbook }, NOON_IST)

  const status = await $.tool.call({ tool: TALK, action: 'ask' })
  expect(status.result).toBe(
    "Clawd is happily watching you work. It's 12:00 (midday) where the user is." +
      ' It has been petted 12 times and fed 1 treat so far.' +
      " Today's sandcastle is 4 turns tall." +
      ` Its songbook follows: ${MUSIC}.`,
  )
})

test('Claude can ask Clawd to sing, and hears the line', { options: OPTIONS }, async ($, on) => {
  const songbook = { day: '10-27', source: `music:${MUSIC}`, style: 4, lines: ['under pressure… to ship it ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)

  const sung = await $.tool.call({ tool: TALK, action: 'sing' })
  expect(sung.result).toBe('Clawd sang: "under pressure… to ship it ♪"')
})

test('with the garden on screen, Clawd is off duty', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'garden' }, NOON_IST)

  const done = await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'hi' })
  expect(done.result).toContain('the garden; Clawd is off duty')
})

test('a prompt that names Clawd makes it perk up, and a kind word makes it glow', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ text: 'what does clawd think?' })
  expect(await ui.find({ type: 'Text', text: /^you called\?$/ })).toBeTruthy()

  await $.prompt.submit({ text: 'thanks Clawd, good job' })
  expect(await ui.find({ type: 'Text', text: /^aw, thanks!$/ })).toBeTruthy()
  await ui.unmount()
})

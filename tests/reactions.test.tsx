import { expect, test } from 'claude-code/testing'

import { spinnerTake, SAYINGS, sayingOf, type Saying } from '../hooks/clawd'
import {
  BAND,
  auraShown,
  OPTIONS,
  NOON_IST,
  SUBMITTED,
  TYPED,
  anyTool,
  start,
  istOn,
  promptFirst,
  SUMMARY,
  PONDERING,
  thinkAbout,
  actShown,
  calmShown,
  followsPondering,
  GOLD,
  TOQUE,
  WATER,
  shows,
  CHEF_LINES,
  SNACK_LINES,
  RAISED,
  LOWERED,
  saying,
} from './helpers'

test('Clawd does an emote now and then while Claude works', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, {}, NOON_IST)
  await $.prompt.submit({ ...SUBMITTED, text: 'go' })
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true } })

  // The first emote comes about 22s into the turn and lasts 4s or more.
  await clock.advance(24_000)
  // A song shows its first letters so far: one of the starter songs' openings.
  const emotes =
    /o\/|crab rave|blub|scuttle|did you hear|munch|soaking it in|shades on|six… seven|UwU|\*hic\*|SEAGULL|molts|cousin|pearl|tide's in|rain|vibing|wheee|^(mama|is th|we wi|don't|anoth|under|we met|and we|remem|and so|I can|stones|I beca|I am w|Amie|nothing|I'll f|they wi|those|please|near|every|welcome|you can|there's|in sleep|that voice|sing once)/
  expect(await ui.find({ type: 'Text', text: emotes })).toBeTruthy()
  await ui.unmount()
})

test("Clawd riffs on the spinner's word while Claude works", { options: OPTIONS }, async ($, on) => {
  // Stands for the engine's own spinner beneath the plugin.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>spinner</Text>
  })
  await start($, on, {}, NOON_IST)
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
  const clock = await start($, on, {})
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
    await $.tool.call(anyTool({ tool: 'Grep', pattern }))
  }
  expect(await says(/search #3\. lost, are we\?/)).toBe(true)

  // Once Sherlock's visit is over, a plain command it has no view on is just shown.
  await clock.advance(10_000)
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(await says(/^\$ ls$/)).toBe(true)
  await ui.unmount()
})

test('a commit that goes through gets confetti', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: add things"' })
  expect(await ui.find({ type: 'Text', text: /committed! party!/ })).toBeTruthy()

  await $.tool.call({ tool: 'Bash', command: 'git push origin main' })
  expect(await ui.find({ type: 'Text', text: /shipped it!/ })).toBeTruthy()
  await ui.unmount()
})

test("Clawd greets the session's first prompt, then takes later ones in stride", { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'add a login page' })
  expect(await ui.find({ type: 'Text', text: /what are we making\?/ })).toBeTruthy()

  await $.prompt.submit({ ...SUBMITTED, text: 'now add tests' })
  expect(await ui.find({ type: 'Text', text: /what are we making\?/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /go on…|listening\.|mhm, mhm\.|another one!|on it\.|ok, next\./ })).toBeTruthy()
  await ui.unmount()
})

test('Clawd has a line for slash commands and skills', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)
  const says = async (text: RegExp) => Boolean(await ui.find({ type: 'Text', text }))

  await $.prompt.submit({ ...SUBMITTED, text: '/code-review', command: { name: 'code-review', args: '' } })
  expect(await says(/red pen time\./)).toBe(true)

  await $.prompt.submit({ ...SUBMITTED, text: '/deploy', command: { name: 'deploy', args: '' } })
  expect(await says(/\/deploy\? sure\./)).toBe(true)

  await $.tool.call({ tool: 'Skill', skill: 'some-plugin:simplify' })
  expect(await says(/less is more\./)).toBe(true)

  // A skill it has no view on goes straight into Claude's head, as kung fu went into Neo's.
  await $.tool.call({ tool: 'Skill', skill: 'pdf' })
  expect(await says(/^I know pdf\.$/)).toBe(true)
  await ui.unmount()
})

test('deep thinking on a word with no take of its own gets a nod, not a meditation', { options: OPTIONS }, async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>spinner</Text>
  })
  await start($, on, {}, NOON_IST)
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

test('two failed tools in a row make Clawd facepalm', { options: OPTIONS }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: 'make: *** No rule', isError: true }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)
  await $.tool.call({ tool: 'Bash', command: 'make' })
  expect(await ui.find({ type: 'Text', text: /^pfft\. that broke\.$/ })).toBeTruthy()

  await $.tool.call({ tool: 'Bash', command: 'make' })

  expect(await ui.find({ type: 'Text', text: /^…again\.$/ })).toBeTruthy()
  // A claw over one eye.
  expect(await ui.find({ type: 'Text', text: /^▟█$/ })).toBeTruthy()
  await ui.unmount()
})

test('a third failure in a row leaves Clawd dizzy, seeing stars', { options: OPTIONS }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: 'make: *** No rule', isError: true }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)
  await $.tool.call({ tool: 'Bash', command: 'make' })
  await $.tool.call({ tool: 'Bash', command: 'make' })

  await $.tool.call({ tool: 'Bash', command: 'make' })

  expect(await ui.find({ type: 'Text', text: /^everything is spinning\.$/ })).toBeTruthy()
  expect(await ui.findAll({ type: 'Text', text: /^×$/ })).toHaveLength(2)
  expect(await ui.find({ type: 'Text', text: /✦/ })).toBeTruthy()
  await ui.unmount()
})

test('while a permission prompt waits, Clawd taps its foot, and thanks the person for an ok', { options: OPTIONS }, async ($, on) => {
  let clock: Awaited<ReturnType<typeof start>> | undefined
  promptFirst($, on, () => clock!, 'allow')
  clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const call = $.tool.call({ tool: 'Bash', command: 'rm -r build' })
  await clock.advance(4000)
  expect(await ui.find({ type: 'Text', text: /^psst\. Bash needs your ok\.$/ })).toBeTruthy()
  // Still asking well past an ordinary reaction, a claw up, with no idle emote over it.
  expect(await ui.find({ type: 'Text', text: /^▗▟█████▛▘$/ })).toBeTruthy()

  await clock.advance(1000)
  await call
  expect(await ui.find({ type: 'Text', text: /^thanks!$/ })).toBeTruthy()
  await ui.unmount()
})

test('a refused permission prompt gets a shrug', { options: OPTIONS }, async ($, on) => {
  let clock: Awaited<ReturnType<typeof start>> | undefined
  promptFirst($, on, () => clock!, 'deny')
  clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const call = $.tool.call({ tool: 'Bash', command: 'make deploy' })
  await clock.advance(5000)
  await call

  expect(await ui.find({ type: 'Text', text: /^fine, not that then\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('turning down something destructive brings out the wizard', { options: OPTIONS }, async ($, on) => {
  let clock: Awaited<ReturnType<typeof start>> | undefined
  promptFirst($, on, () => clock!, 'deny')
  clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const call = $.tool.call({ tool: 'Bash', command: 'rm -r build' })
  await clock.advance(5000)
  await call
  // From tapping its foot, through a crouch, to the wizard.
  await clock.advance(800)

  expect(await ui.find({ type: 'Text', text: /^you shall not pass!$/ })).toBeTruthy()
  // The grey hat, and the staff's glowing tip.
  expect(await ui.find({ type: 'Text', text: /▗▟█▙▖/ })).toBeTruthy()
  await ui.unmount()
})

test('a question from Claude is announced as one', { options: OPTIONS }, async ($, on) => {
  on('classic.PermissionRequest', () => ({}))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.classic.PermissionRequest({ tool_name: 'AskUserQuestion', tool_input: {} })
  expect(await ui.find({ type: 'Text', text: /^Claude has a question for you\.$/ })).toBeTruthy()

  // The turn ending clears it, answered or not.
  await $.turn.complete({ answer: 'ok.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })
  expect(await ui.find({ type: 'Text', text: /question/ })).toBeFalsy()
  await ui.unmount()
})

test('a failure after a success is not facepalmed', { options: OPTIONS }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: 'make: *** No rule', isError: true }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)
  await $.tool.call({ tool: 'Bash', command: 'make' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/Makefile' })

  await $.tool.call({ tool: 'Bash', command: 'make' })

  expect(await ui.find({ type: 'Text', text: saying('broke') })).toBeTruthy()
  await ui.unmount()
})

test('a new prompt starts the failure streak over', { options: OPTIONS }, async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: 'make: *** No rule', isError: true }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)
  await $.tool.call({ tool: 'Bash', command: 'make' })
  await $.prompt.submit({ ...SUBMITTED, text: 'try again' })

  await $.tool.call({ tool: 'Bash', command: 'make' })

  expect(await ui.find({ type: 'Text', text: saying('broke') })).toBeTruthy()
  await ui.unmount()
})

test('compacting the conversation squishes Clawd flat', { options: OPTIONS }, async ($, on) => {
  on('session.compact', () => ({ messages: [SUMMARY] }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.session.compact({ trigger: 'manual', messages: [SUMMARY] })

  expect(await ui.find({ type: 'Text', text: /^\*squish\* making room\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▟▛▀███▀▜▙$/ })).toBeTruthy()
  await ui.unmount()
})

test("a subagent's compaction leaves Clawd alone", { options: OPTIONS }, async ($, on) => {
  on('session.compact', () => ({ messages: [SUMMARY] }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.session.compact({ trigger: 'auto', agentId: 'a1', messages: [SUMMARY] })

  expect(await ui.find({ type: 'Text', text: /squish/ })).toBeFalsy()
  await ui.unmount()
})

test('a compaction computed ahead of time leaves Clawd alone', { options: OPTIONS }, async ($, on) => {
  on('session.compact', () => ({ messages: [SUMMARY] }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.session.compact({ trigger: 'precompute', messages: [SUMMARY] })

  expect(await ui.find({ type: 'Text', text: /squish/ })).toBeFalsy()
  await ui.unmount()
})

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

test('a tiny cousin marches by while a subagent is out, and the crew is welcomed back', { options: OPTIONS }, async ($, on) => {
  let release = () => {}
  on('tool.call', { tool: 'Agent' }, async () => {
    await new Promise<void>(resolve => {
      release = resolve
    })

    return { result: {} }
  })
  const clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const call = $.tool.call({ tool: 'Agent', description: 'look around', prompt: 'look around' })
  await clock.advance(800)
  expect(await ui.find({ type: 'Text', text: /^(▞▚|▚▞)$/ })).toBeTruthy()

  release()
  await call
  expect(await ui.find({ type: 'Text', text: /^the crew is back\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('a subagent sent off in the background is not waited back', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call(anyTool({ tool: 'Agent', description: 'look around', prompt: 'look around', run_in_background: true }))

  expect(await ui.find({ type: 'Text', text: /the crew is back/ })).toBeFalsy()
  await ui.unmount()
})

test('a cooking word puts the chef hat on for every chef line, and a crumb by every snack one', { options: OPTIONS }, async ($, on) => {
  const { clock, spinner, ui } = await thinkAbout($, on, 'Sautéing')
  const said = new Set<string>()

  for (let step = 0; step < CHEF_LINES.length + SNACK_LINES.length; step++) {
    const texts = (await ui.findAll({ type: 'Text' })).map(one => one.text)
    const line = [...CHEF_LINES, ...SNACK_LINES].find(one => texts.includes(one))
    expect(line).toBeDefined()
    said.add(line!)
    expect(await shows(ui, /▀/, TOQUE)).toBe(CHEF_LINES.includes(line!))
    expect(await shows(ui, /^·$/, GOLD)).toBe(SNACK_LINES.includes(line!))
    await clock.advance(12_000)
  }
  // Every act came round once.
  expect(said.size).toBe(CHEF_LINES.length + SNACK_LINES.length)
  await ui.unmount()
  await spinner.unmount()
})

test('Onioning makes Clawd cry', { options: OPTIONS }, async ($, on) => {
  const { spinner, ui } = await thinkAbout($, on, 'Onioning')

  expect(await ui.find({ type: 'Text', text: /^(\*cries in crab\*|who is cutting onions\?)$/ })).toBeTruthy()
  expect(await shows(ui, /^[‚¸]$/, WATER)).toBe(true)
  await ui.unmount()
  await spinner.unmount()
})

test('fetching with curl has Clawd holding a snack', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'curl -s https://example.com' })

  expect(await ui.find({ type: 'Text', text: /^fetching snacks\?$/ })).toBeTruthy()
  expect(await shows(ui, /^·$/, GOLD)).toBe(true)
  await ui.unmount()
})

test('/simplify sits Clawd down to meditate', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: '/simplify', command: { name: 'simplify', args: '' } })

  expect(await ui.find({ type: 'Text', text: /^less is more\.$/ })).toBeTruthy()
  expect(await auraShown(ui)).toBe(true)
  await ui.unmount()
})

test('more dependencies get a sigh with claws hanging, not pumping', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'npm install left-pad' })

  expect(await ui.find({ type: 'Text', text: /^more dependencies\? sigh\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▀$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: LOWERED })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: RAISED })).toBeFalsy()
  await ui.unmount()
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

test('a prompt that names Clawd makes it perk up, and a kind word makes it glow', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'what does clawd think?' })
  expect(await ui.find({ type: 'Text', text: /^you called\?$/ })).toBeTruthy()

  await $.prompt.submit({ ...SUBMITTED, text: 'thanks Clawd, good job' })
  expect(await ui.find({ type: 'Text', text: /^aw, thanks!$/ })).toBeTruthy()
  await ui.unmount()
})

test('Clawd rotates through its sayings, so it never says the same one twice running', () => {
  for (const name of Object.keys(SAYINGS) as Saying[]) {
    const lines = Array.from({ length: SAYINGS[name].length + 1 }, (_, n) => sayingOf(name, n))
    expect(new Set(lines.slice(0, -1)).size).toBe(SAYINGS[name].length)
    for (let n = 1; n < lines.length; n++) expect(lines[n]).not.toBe(lines[n - 1])
  }
})

// Commands with a guest: what Claude runs, the saying it gets, and a prop that shows it came.
const GUESTS: readonly [string, Saying, RegExp][] = [
  ['git push --force origin main', 'jedi', /▪/],
  ['git blame src/app.py', 'sherlock', /▗▆▆▆▖/],
  ['git log -S parseOffset', 'sherlock', /▗▆▆▆▖/],
  ['git revert HEAD', 'delorean', /88/],
  ['git checkout 4f2a91c', 'delorean', /88/],
  ['git stash', 'ninja', /▗▄▄▄▄▄▖/],
  ['git stash pop', 'ninjaBack', /▗▄▄▄▄▄▖/],
  ['kill -9 4242', 'terminator', /●/],
  ['docker compose up', 'whale', /▟██▙/],
]

test('some commands bring a guest: a Jedi, Sherlock, a DeLorean, a ninja, the Terminator, a whale', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  for (const [command, name, prop] of GUESTS) {
    await $.tool.call({ tool: 'Bash', command })
    // Past the crouch from the last guest to this one.
    await clock.advance(800)
    expect(await ui.find({ type: 'Text', text: saying(name) })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: prop })).toBeTruthy()
  }
  // Still a warning first for the ones that can lose work, once the whale has gone.
  await clock.advance(10_000)
  await $.tool.call({ tool: 'Bash', command: 'git reset --hard HEAD~1' })
  expect(await ui.find({ type: 'Text', text: /^reset --hard\. no take-backs\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('a guest has its gravitas: it stays ten seconds, nothing trivial cuts in, and what came up waits its turn', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' })
  // A file read mid-visit would have Clawd say what it reads: the Jedi stays.
  await clock.advance(4_000)
  await $.tool.call({ tool: 'Read', file_path: '/repo/app.py' })
  await clock.advance(4_000)
  expect(await ui.find({ type: 'Text', text: saying('jedi') })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /▪/ })).toBeTruthy()

  // The visit over, the read gets its turn.
  await clock.advance(2_800)
  expect(await ui.find({ type: 'Text', text: saying('jedi') })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /reading app\.py/ })).toBeTruthy()
  await ui.unmount()
})

test('a pet is the person, and sends a guest off at once', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' })
  await $.command.run({ ...TYPED, command: 'pet', args: '' })

  expect(await ui.find({ type: 'Text', text: saying('jedi') })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /^Clawd ♥$/ })).toBeTruthy()
  await ui.unmount()
})

test('a third search in a row puts the deerstalker on', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  for (const pattern of ['TODO', 'FIXME', 'XXX']) await $.tool.call(anyTool({ tool: 'Grep', pattern }))

  expect(await ui.find({ type: 'Text', text: /^search #3\. lost, are we\?$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /▗▆▆▆▖/ })).toBeTruthy()
  await ui.unmount()
})

test('tests going green after going red in a turn earn a 1-UP; green on the first try only a squint', { options: OPTIONS }, async ($, on) => {
  let fails = true
  on('tool.call', { tool: 'Bash' }, () => (fails ? { result: '1 failed', isError: true } : { result: 'all passed' }))
  const clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  fails = false
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect(await ui.find({ type: 'Text', text: saying('oneup') })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /1UP/ })).toBeTruthy()

  await clock.advance(10_000)
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect(await ui.find({ type: 'Text', text: saying('passed') })).toBeTruthy()
  await ui.unmount()
})

test("the day's first prompt in the morning comes with coffee, once a day", { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  // 08:30 in India.
  const clock = await start($, on, {}, istOn(28, 8, 30))
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'morning! where were we' })
  expect(await ui.find({ type: 'Text', text: saying('coffee') })).toBeTruthy()

  await clock.advance(10_000)
  await $.prompt.submit({ ...SUBMITTED, text: 'next thing' })
  expect(await ui.find({ type: 'Text', text: saying('coffee') })).toBeFalsy()
  await ui.unmount()
})

test('a long prompt working through a bug gets a rubber duck to listen; a long plain one does not', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)
  const story = 'So the login form submits, the request goes out, the server answers 200, and then the page just sits there. '

  await $.prompt.submit({ ...SUBMITTED, text: `${story.repeat(3)}I have no idea why it doesn't work.` })
  expect(await ui.find({ type: 'Text', text: saying('duck') })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /▜██▛/ })).toBeTruthy()

  await clock.advance(10_000)
  await $.prompt.submit({ ...SUBMITTED, text: 'Add a settings page with a dark mode toggle, a font size slider and a language picker. '.repeat(4) })
  expect(await ui.find({ type: 'Text', text: saying('duck') })).toBeFalsy()
  await ui.unmount()
})

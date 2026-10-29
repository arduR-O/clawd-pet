import { expect, test } from 'claude-code/testing'

import { petSuggestions, spinnerTake, GUESTS, SAYINGS, pickGuest } from '../hooks/clawd'
import {
  BAND,
  auraShown,
  OPTIONS,
  NOON_IST,
  TYPED,
  start,
  typeIn,
  GOLD,
  TOQUE,
  WATER,
  shows,
  TALK,
} from './helpers'

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
  await $.command.run({ ...TYPED, command: 'pet', args: '' })
  await $.command.run({ ...TYPED, command: 'pet', args: '' })

  const ui = await $.ui.mount(BAND)
  expect((await ui.find({ type: 'Text', text: /purr/ }))?.text).toBe('purr (pet #2)')
  expect(await ui.find({ type: 'Text', text: /♥ ♥/ })).toBeTruthy()
  await ui.unmount()
})

test('Clawd is the default', { options: OPTIONS }, async ($, on) => {
  await start($, on)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^Clawd$/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet off hides the pet, and Clawd turns down pets and Claude', { options: OPTIONS }, async ($, on) => {
  // The engine's own band, drawn when the pet steps aside.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
  await start($, on, { species: 'clawd' })
  const ui = await $.ui.mount(BAND)

  const off = await $.command.run({ ...TYPED, command: 'pet', args: 'off' })
  expect(off.text).toBe('Pet hidden until /pet on.')
  expect(await ui.find({ type: 'Text', text: /^Clawd$/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeTruthy()
  expect((await $.command.run({ ...TYPED, command: 'pet', args: '' })).text).toBe('The pet is hidden; /pet on brings it back.')
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
  await $.command.run({ ...TYPED, command: 'pet', args: 'on' })
  expect(await later.find({ type: 'Text', text: /^Clawd$/ })).toBeTruthy()
  await later.unmount()
})

test('typing /pet offers the commands, and a few letters in, the emotes', () => {
  const names = (draft: string) => petSuggestions(draft).map(one => one.text)

  expect(names('/pet ')).toEqual(['treat', 'trick', 'guest', 'refresh-songs', 'off', 'on', 'garden', 'clawd', 'moss'])
  expect(names('/pet gu')).toEqual(['guest'])
  expect(names('/pet tr')).toEqual(['treat', 'trick'])
  expect(names('/pet me')).toEqual(['meditate'])
  expect(names('/pet re')).toEqual(['refresh-songs'])
  expect(petSuggestions('/pet o')).toEqual([
    { text: 'off', description: 'hide the pet until /pet on' },
    { text: 'on', description: 'bring the pet back' },
    { text: 'oneup' },
  ])
  expect(names('/pet off')).toEqual([])
  expect(names('/pet treat')).toEqual([])
  expect(names('hello /pet ')).toEqual([])
  expect(names('/other ')).toEqual([])
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

  await $.command.run({ ...TYPED, command: 'pet', args: '' })
  expect(await ui.find({ type: 'Text', text: /in full bloom/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /watered \(#1\)/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet glasses puts the reading glasses on', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'glasses' })
  // Runs of one style are joined, so count the rims within the colored runs.
  const runs = (await ui.findAll({ type: 'Text' })).filter(one => one.props.color !== undefined).map(one => one.text).join('')
  expect([...runs].filter(ch => ch === '(')).toHaveLength(2)
  expect([...runs].filter(ch => ch === ')')).toHaveLength(2)
  expect(await ui.find({ type: 'Text', text: /\(glasses\)/ })).toBeTruthy()
  await ui.unmount()
})

test('a pet gets a reaction, and only a long spree gets told off', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: '' })
  expect(await ui.find({ type: 'Text', text: /^Clawd ♥$/ })).toBeTruthy()

  for (let pet = 2; pet <= 5; pet++) {
    await $.command.run({ ...TYPED, command: 'pet', args: '' })
  }
  expect(await ui.find({ type: 'Text', text: /ok ok, I get it\./ })).toBeFalsy()

  await $.command.run({ ...TYPED, command: 'pet', args: '' })
  expect(await ui.find({ type: 'Text', text: /ok ok, I get it\./ })).toBeTruthy()
  // Heavy lids rather than eyes that vanish.
  expect(await ui.find({ type: 'Text', text: /^▀$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^…$/ })).toBeTruthy()
  await ui.unmount()
})

test('a click on Clawd pets it, and a spree of clicks gets told off', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await ui.press({ key: 'clawd' })
  expect(await ui.find({ type: 'Text', text: /^Clawd ♥$/ })).toBeTruthy()

  for (let pet = 2; pet <= 6; pet++) await ui.press({ key: 'clawd' })
  expect(await ui.find({ type: 'Text', text: /ok ok, I get it\./ })).toBeTruthy()
  await ui.unmount()
})

test('where Clawd is drawn as a picture, a click on its name pets it', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await ui.press({ key: 'name' })

  expect(await ui.find({ type: 'Text', text: /^Clawd ♥$/ })).toBeTruthy()
  await ui.unmount()
})

test('a click on the garden waters it, and one on Moss pets it', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'garden' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await ui.press({ key: 'name' })
  expect(await ui.find({ type: 'Text', text: /^watered \(#1\)$/ })).toBeTruthy()

  await $.command.run({ ...TYPED, command: 'pet', args: 'moss' })
  await ui.press({ key: 'name' })
  expect(await ui.find({ type: 'Text', text: /^purr \(pet #2\)$/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet treat feeds Clawd, and every 10th treat is noted', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd', treats: 9 }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const fed = await $.command.run({ ...TYPED, command: 'pet', args: 'treat' })
  expect(fed.text).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /treat #10\. spoiled crab\./ })).toBeTruthy()
  await ui.unmount()
})

test('/pet trick does a trick, and only Clawd does them', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'trick' })
  const tricks = /ta-da|six… seven|boing|waves both claws|sideways shuffle|wiggle wiggle|takes a bow|UwU|spins/
  expect(await ui.find({ type: 'Text', text: tricks })).toBeTruthy()
  await ui.unmount()

  await $.command.run({ ...TYPED, command: 'pet', args: 'moss' })
  const refused = await $.command.run({ ...TYPED, command: 'pet', args: 'trick' })
  expect(refused.text).toContain('/pet clawd')
})

test('/pet moss switches, and an unknown name is refused', { options: OPTIONS }, async ($, on) => {
  await start($, on)
  const refused = await $.command.run({ ...TYPED, command: 'pet', args: 'dragon' })
  expect(refused.text).toContain('/pet garden')

  await $.command.run({ ...TYPED, command: 'pet', args: 'moss' })
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^Moss$/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet <emote> shows that emote on demand', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const shown = await $.command.run({ ...TYPED, command: 'pet', args: 'uwu' })
  expect(shown.text).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^w$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /\(uwu\)/ })).toBeTruthy()

  await $.command.run({ ...TYPED, command: 'pet', args: 'meditate' })
  expect(await auraShown(ui)).toBe(true)
  await ui.unmount()
})

test('Clawd perks up when it sees /pet being typed', { options: OPTIONS }, async ($, on) => {
  on('prompt.edit', (_, e) => ({ text: e.inputText, cursor: e.inputText.length }))
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  await clock.advance(5 * 800)

  await typeIn($, '/pet')
  await clock.advance(800)

  expect(await ui.findAll({ type: 'Text', text: /^\^$/ })).toHaveLength(2)
  await ui.unmount()
})

test('/pet hiccup makes Clawd hic', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'hiccup' })

  expect(await ui.find({ type: 'Text', text: /^hic!$/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet rain has Clawd hold up an umbrella', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'rain' })

  expect(await ui.find({ type: 'Text', text: /▗▟█▙▖/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /─╯/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /'/ })).toBeTruthy()
  await ui.unmount()
})

test('/pet spin and the spinner word Spinning make Clawd spin', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'spin' })
  expect(await ui.find({ type: 'Text', text: /^\(spin\)$/ })).toBeTruthy()
  await ui.unmount()

  for (const word of ['Spinning', 'Whirlpooling']) {
    for (let step = 0; step < 2; step++) expect(spinnerTake(word, 0, step).pose).toBe('spin')
  }
})

test('/pet chef, /pet hardhat and /pet cry show those emotes', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'chef' })
  expect(await ui.find({ type: 'Text', text: /^\(chef\)$/ })).toBeTruthy()
  expect(await shows(ui, /▀/, TOQUE)).toBe(true)

  await $.command.run({ ...TYPED, command: 'pet', args: 'hardhat' })
  expect(await ui.find({ type: 'Text', text: /^\(hardhat\)$/ })).toBeTruthy()
  expect(await shows(ui, /▗/, GOLD)).toBe(true)
  expect(await shows(ui, /▀/, TOQUE)).toBe(false)

  await $.command.run({ ...TYPED, command: 'pet', args: 'cry' })
  expect(await ui.find({ type: 'Text', text: /^\(cry\)$/ })).toBeTruthy()
  // Eyes shut, tears streaming from under the lids, and one dropping beside it.
  expect(await ui.findAll({ type: 'Text', text: /^╥$/ })).toHaveLength(2)
  expect(await shows(ui, /^[‚¸]$/, WATER)).toBe(true)
  await ui.unmount()
})

test('a random guest is never the one that came last, and every guest can come', () => {
  const seen = new Set<string>()
  let last: (typeof GUESTS)[number][0] | undefined
  for (let i = 0; i < 200; i++) {
    const [guest] = pickGuest((i * 0.618) % 1, last)
    expect(guest).not.toBe(last)
    seen.add(guest)
    last = guest
  }
  expect(seen.size).toBe(GUESTS.length)
})

test('/pet guest brings a random guest with something to say, and only Clawd has guests', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  const anyGuest = new RegExp(`^(${GUESTS.flatMap(([, name]) => SAYINGS[name]).map(line => line.replace('{skill}', 'kung fu').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`)

  for (let i = 0; i < 3; i++) {
    await $.command.run({ ...TYPED, command: 'pet', args: 'guest' })
    expect(await ui.find({ type: 'Text', text: anyGuest })).toBeTruthy()
  }

  await $.command.run({ ...TYPED, command: 'pet', args: 'moss' })
  expect(await $.command.run({ ...TYPED, command: 'pet', args: 'guest' })).toEqual({ text: 'Only Clawd has guests: /pet clawd' })
  await ui.unmount()
})

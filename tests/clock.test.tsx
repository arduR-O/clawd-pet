import { expect, test } from 'claude-code/testing'

import { breakLine, parseMinutes, satAt } from '../hooks/clawd'
import {
  BAND,
  MUSIC,
  OPTIONS,
  NOON_IST,
  TYPED,
  SUBMITTED,
  start,
  istOn,
  workFor,
  saying,
} from './helpers'

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

  await $.prompt.submit({ ...SUBMITTED, text: 'fix the flaky test' })

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

test('after the set minutes of work, a finished turn has Clawd stretch and suggest a break', { options: { ...OPTIONS, break_every: '2' } }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)
  const done = () => $.turn.complete({ answer: 'ok.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })

  await workFor($, clock, 1)
  await done()
  expect(await ui.find({ type: 'Text', text: /stretch/ })).toBeFalsy()

  await workFor($, clock, 2)
  await done()
  expect(await ui.find({ type: 'Text', text: /^3 min in\. stretch break\?$/ })).toBeTruthy()
  await ui.unmount()
})

test('with no break time set, Clawd never suggests one', { options: { ...OPTIONS, break_every: '' } }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await workFor($, clock, 3)
  await $.turn.complete({ answer: 'fixed.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })

  expect(await ui.find({ type: 'Text', text: /stretch/ })).toBeFalsy()
  await ui.unmount()
})

test('a break nudge waits out its snooze before asking again, and a real break starts the count over', () => {
  const min = 60_000
  let sitting = satAt({ since: 0, lastSeen: -Infinity, nudgedAt: 0 }, 0)
  for (let at = 5; at <= 50; at += 5) sitting = satAt(sitting, at * min)
  expect(breakLine(sitting, 50 * min, 50)).toBe('50 min in. stretch break?')
  expect(breakLine(sitting, 50 * min, undefined)).toBeUndefined()
  sitting = { ...sitting, nudgedAt: 50 * min }

  for (let at = 55; at <= 95; at += 5) sitting = satAt(sitting, at * min)
  // Snoozed for twenty minutes, then asked again; past an hour and a half, in hours.
  expect(breakLine(sitting, 65 * min, 50)).toBeUndefined()
  expect(breakLine(sitting, 95 * min, 50)).toBe('1h35 now. stretch with me?')

  // Ten minutes and more away is a break: the count starts over from the return.
  sitting = satAt(sitting, 110 * min)
  expect(sitting).toEqual({ since: 110 * min, lastSeen: 110 * min, nudgedAt: 0 })
  expect(breakLine(sitting, 125 * min, 50)).toBeUndefined()
})

test('break minutes are read from the setting, and empty, 0 or nonsense turns them off', () => {
  expect(parseMinutes('50')).toBe(50)
  expect(parseMinutes(' 45 ')).toBe(45)
  for (const off of ['', '0', 'off', '-5']) expect(parseMinutes(off)).toBeUndefined()
})

test('a long turn ends with confetti, and its done stays up a minute for whoever looks back', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.turn.complete({ answer: 'fixed.', durationMs: 4 * 60_000, isAborted: false, turnId: 't1', reason: 'answer' })
  expect(await ui.find({ type: 'Text', text: /^done! that took 4 min\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /✦|✧|\*/ })).toBeTruthy()

  await clock.advance(30_000)
  expect(await ui.find({ type: 'Text', text: /^done! that took 4 min\.$/ })).toBeTruthy()
  await clock.advance(31_000)
  expect(await ui.find({ type: 'Text', text: /that took/ })).toBeFalsy()
  await ui.unmount()
})

test('a turn stopped short is not cheered', { options: OPTIONS }, async ($, on) => {
  await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.turn.complete({ answer: '', durationMs: 5 * 60_000, isAborted: true, turnId: 't1', reason: 'aborted' })
  expect(await ui.find({ type: 'Text', text: /^ok, stopping\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /done/ })).toBeFalsy()

  // Lost to an API error: Clawd puts its helmet on and radios Houston.
  await $.turn.complete({ answer: '', durationMs: 1000, isAborted: false, turnId: 't2', reason: 'error' })
  expect(await ui.find({ type: 'Text', text: saying('houston') })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /╭───────╮/ })).toBeTruthy()
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

test('a turn past two minutes makes Clawd sweat', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, { species: 'clawd' }, NOON_IST)
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true } })
  await $.prompt.submit({ ...SUBMITTED, text: 'refactor everything' })
  expect(await ui.find({ type: 'Text', text: /^[’,]$/ })).toBeFalsy()

  await clock.advance(121_000)

  expect((await ui.find({ type: 'Text', text: /^[’,]$/ }))?.props.color).toBe('#8ab6d6')
  await ui.unmount()
})

test('/pet vibe puts on headphones, then Clawd breaks into song with them on', { options: OPTIONS }, async ($, on) => {
  const songbook = { day: '10-27', source: `music:${MUSIC}`, style: 7, lines: ['ooh, the tests are green ♪'] }
  const clock = await start($, on, { species: 'clawd', songbook }, NOON_IST)
  await clock.advance(1_500)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'vibe' })
  expect(await ui.find({ type: 'Text', text: /^♪ \*vibing\* ♪$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /╭/ })).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /^█$/ }))?.props.color).toBe('#8a8fbf')

  await clock.advance(5_000 + 6_000)
  expect(await ui.find({ type: 'Text', text: /^ooh, the tests are green ♪$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /╭/ })).toBeTruthy()

  // The headphones come off once the song is over.
  await clock.advance(2_000)
  expect(await ui.find({ type: 'Text', text: /╭/ })).toBeFalsy()
  await ui.unmount()
})

test('a prompt in the night gets a yawn', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, { species: 'clawd' }, istOn(27, 2, 0))
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'one more thing' })

  expect(await ui.find({ type: 'Text', text: /^at this hour\?$/ })).toBeTruthy()
  // Eyes shut mid-yawn.
  expect(await ui.find({ type: 'Text', text: /^─$/ })).toBeTruthy()
  await ui.unmount()
})

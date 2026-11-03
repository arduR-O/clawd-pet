import { expect, test } from 'claude-code/testing'

import { AMBIENT, breakLine, leaveLine, parseMinutes, satAt } from '../hooks/clawd'
import {
  BAND,
  OPTIONS,
  LASTFM,
  LASTFM_SONGBOOK,
  NOON_IST,
  TYPED,
  SUBMITTED,
  start,
  istOn,
  workFor,
  saying,
} from './helpers'

test('an hour before leave time, idle Clawd counts down to it', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, istOn(27, 17, 10))

  const ui = await $.ui.mount(BAND)

  // 17:30 - 17:10
  expect(await ui.find({ type: 'Text', text: /^20 min till 5:30\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('in the last 15 minutes before leave time, Clawd nudges for a commit', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, istOn(27, 17, 20))

  const ui = await $.ui.mount(BAND)

  expect(await ui.find({ type: 'Text', text: /^10 min to 5:30\. commit something\?$/ })).toBeTruthy()
  await ui.unmount()
})

test('at leave time, Clawd says go home', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, istOn(27, 17, 30))

  const ui = await $.ui.mount(BAND)

  expect(await ui.find({ type: 'Text', text: /^5:30! shoo, go home\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('a prompt after leave time gets asked if it is the last one', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, {}, istOn(27, 18, 0))
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'fix the flaky test' })

  expect(await ui.find({ type: 'Text', text: /^past 5:30\? one more, then home\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('leave-time reminders are spaced out: one at a prompt, then none for ten minutes', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  // 17:40 in India, ten minutes past 5:30.
  const clock = await start($, on, {}, istOn(27, 17, 40))
  const reminder = /^past 5:30\? one more, then home\.$/
  // The band mounted only to look, so the minutes between aren't drawn.
  const shows = async () => {
    const ui = await $.ui.mount(BAND)
    const found = Boolean(await ui.find({ type: 'Text', text: reminder }))
    await ui.unmount()
    return found
  }

  // Each turn ends at once, so no song or emote of a turn's comes up in the minutes between.
  const turn = (n: number) => $.turn.complete({ answer: 'ok.', durationMs: 1000, isAborted: false, turnId: `t${n}`, reason: 'answer' })

  await $.prompt.submit({ ...SUBMITTED, text: 'fix the flaky test' })
  expect(await shows()).toBe(true)
  await turn(1)

  // Prompts a few minutes apart (never long enough to count as away): no reminder until ten
  // minutes have gone by.
  for (const minutes of [4, 4]) {
    await clock.advance(minutes * 60_000)
    await $.prompt.submit({ ...SUBMITTED, text: 'and this one' })
    expect(await shows()).toBe(false)
    await turn(minutes)
  }

  await clock.advance(3 * 60_000)
  await $.prompt.submit({ ...SUBMITTED, text: 'last one, promise' })
  expect(await shows()).toBe(true)
})

test('idle, Clawd mentions leave time only around each ten-minute mark', () => {
  const at = (hour: number, minute: number) => leaveLine({ hour: hour + minute / 60, weekday: 2, month: 10, day: 27 }, 17 * 60 + 30, 'idle')
  expect(at(17, 10)).toBe('20 min till 5:30.')
  expect(at(17, 11)).toBe('19 min till 5:30.')
  expect(at(17, 14)).toBeUndefined()
  expect(at(17, 30)).toBe('5:30! shoo, go home.')
  expect(at(17, 35)).toBeUndefined()
})

test('half an hour past leave time, Clawd stops telling you to go home', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  // 18:01 in India, 31 minutes past 5:30.
  await start($, on, {}, istOn(27, 18, 1))
  const ui = await $.ui.mount(BAND)
  const nagging = /5:30|go home|then home/

  expect(await ui.find({ type: 'Text', text: nagging })).toBeFalsy()
  await $.prompt.submit({ ...SUBMITTED, text: 'one more thing' })
  expect(await ui.find({ type: 'Text', text: nagging })).toBeFalsy()
  await $.turn.complete({ answer: 'done.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })
  expect(await ui.find({ type: 'Text', text: nagging })).toBeFalsy()
  await ui.unmount()
})

test('a turn that finishes after leave time ends with go home', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, istOn(27, 18, 0))
  const ui = await $.ui.mount(BAND)

  await $.turn.complete({ answer: 'fixed.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })

  expect(await ui.find({ type: 'Text', text: /^done\. now go home\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('after the set minutes of work, a finished turn has Clawd stretch and suggest a break', { options: { ...OPTIONS, break_every: '2' } }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, {}, NOON_IST)
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
  const clock = await start($, on, {}, NOON_IST)
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
  const clock = await start($, on, {}, NOON_IST)
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
  await start($, on, {}, NOON_IST)
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
  await start($, on, {}, istOn(32, 17, 10))

  const ui = await $.ui.mount(BAND)

  expect(await ui.find({ type: 'Text', text: /5:30/ })).toBeFalsy()
  expect((await ui.findAll({ type: 'Text' })).some(one => AMBIENT.dusk!.includes(one.text))).toBe(true)
  await ui.unmount()
})

test('/pet vibe puts on headphones, then Clawd breaks into song with them on', LASTFM, async ($, on) => {
  const songbook = { ...LASTFM_SONGBOOK, lines: ['ooh, the tests are green ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
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
  await start($, on, {}, istOn(27, 2, 0))
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'one more thing' })

  expect(await ui.find({ type: 'Text', text: /^at this hour\?$/ })).toBeTruthy()
  // Eyes shut mid-yawn.
  expect(await ui.find({ type: 'Text', text: /^─$/ })).toBeTruthy()
  await ui.unmount()
})

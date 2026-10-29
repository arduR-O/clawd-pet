import { expect, test } from 'claude-code/testing'
import type { Mounted } from 'claude-code/testing'

import {
  BAND,
  MUSIC,
  OPTIONS,
  LASTFM,
  NOON_IST,
  SUBMITTED,
  start,
  istOn,
  LEFT_TO_FISH,
  LEFT_TO_JUGGLE,
  LEFT_TO_BUILD,
  AWAY_MS,
  typeIn,
  lastfmStub,
  modelStub,
  shows,
  TALK,
} from './helpers'

test('at night, Clawd falls asleep after a quiet while', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, {}, istOn(27, 23, 30))
  await clock.advance(6 * 60 * 1000)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /z z z/ })).toBeTruthy()
  await ui.unmount()
})

test('Clawd keeps still while Claude is idle, for reading', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /too bright\./ })).toBeTruthy()

  // Past where the first idle emote used to come, 22-90s in.
  for (let wait = 0; wait < 3; wait++) {
    await clock.advance(30_000)
    expect(await ui.find({ type: 'Text', text: /too bright\./ })).toBeTruthy()
  }
  await ui.unmount()
})

test('back at night after a doze, Clawd stretches awake', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, {}, istOn(27, 2, 0))
  await clock.advance(AWAY_MS)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^\*stretch\* oh, you're back!$/ })).toBeTruthy()
  await ui.unmount()
})

test('back by day, Clawd looks up from its pastime', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, {}, LEFT_TO_FISH)
  await clock.advance(AWAY_MS)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^oh hi! the fish weren't biting\.$/ })).toBeTruthy()
  await ui.unmount()
})

test('away more than 25 minutes by day, Clawd has given up its pastime for a nap', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, {}, LEFT_TO_FISH)
  // Mounted after the wait: drawing every frame of 26 minutes runs past the test's time limit.
  await clock.advance(26 * 60 * 1000)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^\*stretch\* oh, you're back!$/ })).toBeTruthy()
  await ui.unmount()
})

test('a prompt within 5 minutes gets no welcome back', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, {}, LEFT_TO_FISH)
  await clock.advance(4 * 60 * 1000)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^ooh, what are we making\?$/ })).toBeTruthy()
  await ui.unmount()
})

test('away by day, Clawd goes fishing', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, {}, LEFT_TO_FISH)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^fishing… shh\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^╱$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^~~[◦•]~$/ })).toBeTruthy()
  await ui.unmount()
})

test('away by day, Clawd juggles two pearls at a time', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, {}, LEFT_TO_JUGGLE)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^juggling\. don't distract me\.$/ })).toBeTruthy()
  expect(await ui.findAll({ type: 'Text', text: /^●$/ })).toHaveLength(2)
  await ui.unmount()
})

test('away by day with no turns done today, Clawd starts a sandcastle', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, {}, LEFT_TO_BUILD)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^building a sandcastle\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▗▖$/ })).toBeTruthy()
  await ui.unmount()
})

test("the sandcastle stands as tall as today's turns, with a flag from 10", { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { castle: { day: '10-27', turns: 12 } }, LEFT_TO_BUILD)

  await clock.advance(AWAY_MS)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /^sandcastle: 12 turns tall\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▟██▙$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▐▌▐▌$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^⚑$/ })).toBeTruthy()
  await ui.unmount()
})

test("yesterday's sandcastle is gone", { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, { castle: { day: '10-26', turns: 12 } }, LEFT_TO_BUILD)

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
  await start($, on, { castle: { day: '10-27', turns: 2 } }, NOON_IST)

  await $.turn.complete({ answer: 'fixed.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })

  expect(kept).toEqual({ day: '10-27', turns: 3 })
})

test("a subagent's finished turn adds nothing to the sandcastle", { options: OPTIONS }, async ($, on) => {
  let kept: unknown
  on('store.set', { key: 'castle' }, (_, e, next) => {
    kept = e.value

    return next(e)
  })
  await start($, on, { castle: { day: '10-27', turns: 2 } }, NOON_IST)

  await $.turn.complete({ answer: 'found it.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer', agentId: 'a1' })

  expect(kept).toBeUndefined()
})

test("the first turn of a new day starts a new sandcastle", { options: OPTIONS }, async ($, on) => {
  let kept: unknown
  on('store.set', { key: 'castle' }, (_, e, next) => {
    kept = e.value

    return next(e)
  })
  await start($, on, { castle: { day: '10-26', turns: 9 } }, NOON_IST)

  await $.turn.complete({ answer: 'fixed.', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })

  expect(kept).toEqual({ day: '10-27', turns: 1 })
})

test('Clawd watches the person type, eyes on the caret, and looks back up once they stop', { options: OPTIONS }, async ($, on) => {
  on('prompt.edit', (_, e) => ({ text: e.inputText, cursor: e.inputText.length }))
  const clock = await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)
  // Past the settling after the session's start, and off a blink.
  await clock.advance(5 * 800)

  await typeIn($, 'fix the login bug please')
  await clock.advance(800)
  expect(await ui.find({ type: 'Text', text: /▐▛███▛▌/ })).toBeTruthy()

  await clock.advance(1600)
  expect(await ui.find({ type: 'Text', text: /▐▛███▛▌/ })).toBeFalsy()
  await ui.unmount()
})

test('away by day, Clawd may listen to music with its headphones on', { options: OPTIONS }, async ($, on) => {
  const clock = await start($, on, {}, NOON_IST + 4000)
  await clock.advance(AWAY_MS)
  const ui = await $.ui.mount(BAND)

  expect(await ui.find({ type: 'Text', text: /^♪ \*vibing\* ♪$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /╭/ })).toBeTruthy()
  await ui.unmount()
})

test('with no plays this week, the songbook falls back to the music setting', LASTFM, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls, false)
  modelStub(on, prompts)
  const clock = await start($, on, {}, NOON_IST)
  await clock.advance(1_500)

  expect(prompts[0]).toContain(MUSIC)
})

test('back by day from the sandcastle, Clawd shows it off', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const clock = await start($, on, {}, LEFT_TO_BUILD)
  await clock.advance(AWAY_MS)
  const ui = await $.ui.mount(BAND)

  await $.prompt.submit({ ...SUBMITTED, text: 'where were we' })

  expect(await ui.find({ type: 'Text', text: /^oh hi! look, a castle\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▗▖$/ })).toBeTruthy()
  await ui.unmount()
})

test('asking Clawd how it is doing tells Claude its pets, treats, sandcastle and songbook', { options: OPTIONS }, async ($, on) => {
  const songbook = { day: '10-27', source: `music:${MUSIC}`, style: 7, taste: MUSIC, lines: ['la ♪'] }
  const castle = { day: '10-27', turns: 4 }
  await start($, on, { pets: 12, treats: 1, castle, songbook }, NOON_IST)

  const status = await $.tool.call({ tool: TALK, action: 'ask' })
  expect(status.result).toBe(
    "Clawd is happily watching you work. It's 12:00 (midday) where the user is." +
      ' It has been petted 12 times and fed 1 treat so far.' +
      " Today's sandcastle is 4 turns tall." +
      ` Its songbook follows: ${MUSIC}.`,
  )
})

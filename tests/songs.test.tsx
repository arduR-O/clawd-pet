import { expect, test } from 'claude-code/testing'

import { STARTER_SONGS, songbookLines, songbookPrompt, tasteFrom, withStarters } from '../hooks/clawd'
import {
  BAND,
  OPTIONS,
  LASTFM,
  NOON_IST,
  TYPED,
  SUBMITTED,
  NO_USAGE,
  registered,
  start,
  lastfmStub,
  modelStub,
  RAISED,
  LOWERED,
  LASTFM_SONGBOOK,
  TALK,
  saying,
} from './helpers'

test('/pet refresh-songs forgets the songbook and writes a new one', LASTFM, async ($, on) => {
  const prompts: string[] = []
  const asked: unknown[] = []
  on('model.complete', (_, e) => {
    prompts.push(e.prompt)
    asked.push({ maxTokens: e.maxTokens, effort: e.effort })
    const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

    return { value: { isAnswered: true, text: 'where do i begiiin\nwe will, we will\nsomebody to looove', usage } }
  })
  lastfmStub(on, [])
  const songbook = { ...LASTFM_SONGBOOK, lines: ['old song ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
  await clock.advance(1_500)
  expect(prompts.length).toBe(0)

  const ran = await $.command.run({ ...TYPED, command: 'pet', args: 'refresh-songs' })

  expect(ran.text).toBe("New songbook: 3 lines from listener's Last.fm, such as \"where do i begiiin ♪\"")
  // Medium effort by default, with room for Haiku to think and still write the lines.
  expect(asked).toEqual([{ maxTokens: 8192, effort: 'medium' }])
  expect(prompts.length).toBe(1)
})

test('the songbook effort setting picks how hard Haiku thinks, and the room it gets', { options: { ...LASTFM.options, songbook_effort: 'high' } }, async ($, on) => {
  const asked: unknown[] = []
  on('model.complete', (_, e) => {
    asked.push({ maxTokens: e.maxTokens, effort: e.effort })

    return { value: { isAnswered: true, text: 'one ♪\ntwo two ♪\nthree three ♪', usage: NO_USAGE } }
  })
  lastfmStub(on, [])
  await start($, on, {}, NOON_IST)

  await $.command.run({ ...TYPED, command: 'pet', args: 'refresh-songs' })

  expect(asked).toEqual([{ maxTokens: 16000, effort: 'high' }])
})

test('/pet refresh-songs says what Last.fm said when it refuses, such as a bad key', LASTFM, async ($, on) => {
  on('http.fetch', () => ({ value: { ok: false, status: 403, headers: {}, text: '{"error":10,"message":"Invalid API key - You must be granted a valid key by last.fm"}' } }))
  await start($, on, {}, NOON_IST)

  const ran = await $.command.run({ ...TYPED, command: 'pet', args: 'refresh-songs' })

  expect(ran.text).toBe('Last.fm said: Invalid API key - You must be granted a valid key by last.fm. Clawd keeps the songs it has.')
})

test('/pet refresh-songs names the Last.fm setting that is empty', { options: { ...OPTIONS, lastfm_user: 'listener' } }, async ($, on) => {
  await start($, on, {}, NOON_IST)

  const ran = await $.command.run({ ...TYPED, command: 'pet', args: 'refresh-songs' })

  expect(ran.text).toBe('The Last.fm API key is empty, so Clawd only sings its built-in songs. Set it again with /plugin configure.')
})

test('/pet refresh-songs says when Last.fm has no plays, or Claude writes no songbook', LASTFM, async ($, on) => {
  let played = false
  on('http.fetch', (_, e) => {
    const body = played ? { toptracks: { track: [{ name: 'From the Start', artist: { name: 'Laufey' } }] } } : {}

    return { value: { ok: true, status: 200, headers: {}, text: JSON.stringify(e.url.includes('gettoptracks') ? body : {}) } }
  })
  on('model.complete', () => ({ value: { isAnswered: false, reason: 'empty-reply', usage: NO_USAGE } }))
  await start($, on, {}, NOON_IST)

  const none = await $.command.run({ ...TYPED, command: 'pet', args: 'refresh-songs' })
  expect(none.text).toBe('Last.fm has no plays for listener yet. Clawd keeps the songs it has.')

  played = true
  const silent = await $.command.run({ ...TYPED, command: 'pet', args: 'refresh-songs' })
  expect(silent.text).toBe('Last.fm worked, but Claude Haiku wrote no songbook: it did not answer (empty-reply). Clawd keeps the songs it has.')
})

test('/pet refresh-songs without Last.fm says Clawd keeps its built-in songs', { options: { utc_offset: '+05:30' } }, async ($, on) => {
  await start($, on, {}, NOON_IST)

  const ran = await $.command.run({ ...TYPED, command: 'pet', args: 'refresh-songs' })

  expect(ran.text).toContain('built-in songs')
})

test("the taste puts the newest plays and the repeats first, then the week, and a few all-time favourites", () => {
  const play = (name: string, by: string) => ({ name, artist: { '#text': by } })
  const taste = tasteFrom(
    { topartists: { artist: [{ name: 'Laufey' }] } },
    { toptracks: { track: [{ name: 'Wildfire', artist: { name: 'Wasia Project' } }, { name: 'Valentine', artist: { name: 'Laufey' } }] } },
    // Newest first: Valentine, Wildfire twice, Cannonball, Before You Go.
    { recenttracks: { track: [play('Valentine', 'Laufey'), play('Wildfire', 'Wasia Project'), play('Cannonball', 'Damien Rice'), play('Wildfire', 'Wasia Project'), play('Before You Go', 'Lewis Capaldi')] } },
    { toptracks: { track: [{ name: 'Bohemian Rhapsody', artist: { name: 'Queen' } }, { name: 'Wildfire', artist: { name: 'Wasia Project' } }] } },
  )

  expect(taste).toBe(
    'newest plays, most repeated first: Wildfire by Wasia Project, Valentine by Laufey, Cannonball by Damien Rice, Before You Go by Lewis Capaldi' +
      '. artists lately: Laufey' +
      '. all-time favourites: Bohemian Rhapsody by Queen',
  )
  expect(tasteFrom(undefined, undefined)).toBe('')
})

test('the starter songs turn up one in ten among a songbook, and not at all in a short one', () => {
  const book = Array.from({ length: 18 }, (_, i) => `book ${i} ♪`)
  const mixed = withStarters(book)
  const starters = mixed.filter(line => STARTER_SONGS.includes(line))

  expect(mixed).toHaveLength(20)
  // Two different starters, and the book's own lines keep their order.
  expect(new Set(starters).size).toBe(2)
  expect(mixed.filter(line => !STARTER_SONGS.includes(line))).toEqual(book)
  expect(withStarters(['one ♪', 'two ♪', 'three ♪'])).toEqual(['one ♪', 'two ♪', 'three ♪'])
})

test('/pet sing sings a line from the songbook, a few letters at a time', LASTFM, async ($, on) => {
  const songbook = { ...LASTFM_SONGBOOK, lines: ['mama, oooooooo, the build is green ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
  // The songbook loads a moment after the session starts.
  await clock.advance(1_500)
  const ui = await $.ui.mount(BAND)

  const sung = await $.command.run({ ...TYPED, command: 'pet', args: 'sing' })
  expect(sung.text).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^mama, oooo$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^[♪♫]$/ })).toBeTruthy()

  await clock.advance(6_000)
  expect(await ui.find({ type: 'Text', text: /^mama, oooooooo, the build is green ♪$/ })).toBeTruthy()
  await ui.unmount()
})

test('a song plays to its end over whatever comes up, which then gets its turn', LASTFM, async ($, on) => {
  const songbook = { ...LASTFM_SONGBOOK, lines: ['mama, oooooooo, the build is green ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
  await clock.advance(1_500)
  const ui = await $.ui.mount(BAND)
  await $.command.run({ ...TYPED, command: 'pet', args: 'sing' })

  // A force push mid-song: the Jedi waits.
  await clock.advance(2_400)
  await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' })
  await clock.advance(800)
  expect(await ui.find({ type: 'Text', text: /^mama/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: saying('jedi') })).toBeFalsy()

  // The song done and a crouch later, the Jedi gets its turn.
  await clock.advance(5_600)
  expect(await ui.find({ type: 'Text', text: saying('jedi') })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /▪/ })).toBeTruthy()
  await ui.unmount()
})

test('a pet is the person asking, and cuts a song short', LASTFM, async ($, on) => {
  const songbook = { ...LASTFM_SONGBOOK, lines: ['mama, oooooooo, the build is green ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
  await clock.advance(1_500)
  const ui = await $.ui.mount(BAND)
  await $.command.run({ ...TYPED, command: 'pet', args: 'sing' })

  await $.command.run({ ...TYPED, command: 'pet', args: '' })

  expect(await ui.find({ type: 'Text', text: /^Clawd ♥$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^mama/ })).toBeFalsy()
  await ui.unmount()
})

test("a stale songbook is rewritten once by Claude, in the vibe of this week's plays", LASTFM, async ($, on) => {
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
  lastfmStub(on, [])
  const songbook = { ...LASTFM_SONGBOOK, day: '10-26', lines: ['yesterday ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
  await clock.advance(1_500)

  expect(prompts.length).toBe(1)
  expect(prompts[0]).toContain('From the Start by Laufey')
  expect(writes).toEqual([
    {
      day: '10-27',
      source: 'lastfm:listener',
      style: 8,
      taste: LASTFM_SONGBOOK.taste,
      lines: ['ooh, the tests are green ♪', 'another one bites the bug ♪', 'we will, we will lint you ♪'],
    },
  ])
})

test('without Last.fm, Clawd sings its built-in songs and calls no model', async ($, on) => {
  let asked = 0
  on('model.complete', () => {
    asked += 1

    return { value: { isAnswered: false, reason: 'empty-reply', usage: NO_USAGE } }
  })
  const clock = await start($, on, {}, NOON_IST)
  await clock.advance(1_500)
  const ui = await $.ui.mount(BAND)

  await $.command.run({ ...TYPED, command: 'pet', args: 'sing' })

  expect(asked).toBe(0)
  expect(await ui.find({ type: 'Text', text: /^(mama|is th|we wi|don't|anoth|under|we met|and we|remem|and so|I can|stones|I beca|I am w|Amie|nothing|I'll f|they wi|those|please|near|every|welcome|you can|there's|in sleep|that voice|sing once)/ })).toBeTruthy()
  await ui.unmount()
})

test("with a Last.fm key, the songbook follows this week's plays", LASTFM, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls)
  modelStub(on, prompts)
  // Today's book came from another Last.fm user; the new one writes a new book now.
  const songbook = { ...LASTFM_SONGBOOK, source: 'lastfm:someone-else', lines: ['old ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
  await clock.advance(1_500)

  // This week's artists and songs, the last plays, and the all-time songs.
  expect(urls.length).toBe(4)
  expect(urls.every(url => url.includes('user=listener'))).toBe(true)
  expect(urls.some(url => url.includes('getrecenttracks') && url.includes('limit=30'))).toBe(true)
  expect(urls.some(url => url.includes('gettoptracks') && url.includes('period=overall'))).toBe(true)
  expect(prompts[0]).toContain("this week's repeats: From the Start by Laufey")
  expect(prompts[0]).toContain('artists lately: Laufey, Queen')
})

test('without a Last.fm key, Last.fm and Claude are never asked', { options: { ...OPTIONS, lastfm_user: 'listener' } }, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls)
  modelStub(on, prompts)
  const clock = await start($, on, {}, NOON_IST)
  await clock.advance(1_500)

  expect(urls).toEqual([])
  expect(prompts).toEqual([])
})

test('passing tests get a suspicious squint, not a cheer', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  await $.tool.call({ tool: 'Bash', command: 'pytest -x' })

  expect(await ui.find({ type: 'Text', text: /^tests passed\. suspicious\.$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /^▀$/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: LOWERED })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: RAISED })).toBeFalsy()
  await ui.unmount()
})

test("the songbook prompt sings only the songs named, never an artist's best-known hit in their place", () => {
  const prompt = songbookPrompt('newest plays: Kesariya by Arijit Singh. artists lately: Queen')

  expect(prompt).toContain('Here is what they have been playing: newest plays: Kesariya by Arijit Singh. artists lately: Queen.')
  expect(prompt).toContain('Sing lines only from the songs named there')
  expect(prompt).toContain("not even an artist's")
})

test('a songbook drops repeated lines', () => {
  expect(songbookLines('ooh, the build ♪\nooh, the build ♪\n- under pressure… to ship')).toEqual([
    'ooh, the build ♪',
    'under pressure… to ship ♪',
  ])
})

test('a songbook written by an older prompt is written again', LASTFM, async ($, on) => {
  const prompts: string[] = []
  lastfmStub(on, [])
  modelStub(on, prompts)
  const songbook = { ...LASTFM_SONGBOOK, style: 7, lines: ['old style ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
  await clock.advance(1_500)

  expect(prompts.length).toBe(1)
  expect(prompts[0]).toContain('actually sings')
})

test("today's Last.fm songbook is not asked for again", LASTFM, async ($, on) => {
  const urls: string[] = []
  const prompts: string[] = []
  lastfmStub(on, urls)
  modelStub(on, prompts)
  const clock = await start($, on, { songbook: LASTFM_SONGBOOK }, NOON_IST)
  await clock.advance(1_500)

  expect(urls).toEqual([])
  expect(prompts).toEqual([])
})

test('with talk on, Claude gets a clawd tool, listed from the start and allowed without asking', { options: { ...OPTIONS, talk: 'on' } }, async ($, on) => {
  await start($, on, {}, NOON_IST)

  expect(registered.map(one => [one.name, one.isDeferred])).toEqual([['clawd', false]])
  const verdict = await $.tool.check({ tool: TALK, input: { action: 'ask' } })
  expect(verdict.decision).toBe('allow')
})

test('by default Claude gets no clawd tool, so no request carries it', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)

  expect(registered).toEqual([])
})

test('Claude can have Clawd act something out, and Clawd says its line', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  const done = await $.tool.call({ tool: TALK, action: 'act', emote: 'party', line: 'green tests, claude!' })
  expect(done.result).toBe('Clawd did "party" and said "green tests, claude!".')
  expect(await ui.find({ type: 'Text', text: /^green tests, claude!$/ })).toBeTruthy()
  // The tool call itself gets no reaction of its own over Clawd's line.
  expect(await ui.find({ type: 'Text', text: /mcp__clawd__clawd/ })).toBeFalsy()
  await ui.unmount()
})

test('Clawd refuses an emote it does not know, naming the ones it does', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)

  const refused = await $.tool.call({ tool: TALK, action: 'act', emote: 'backflip', line: 'hi' })
  expect(refused.deny).toContain('emote must be one of: wave, dance')
})

test("a long line is cut to fit beside Clawd", { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)

  const done = await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'x'.repeat(60) })
  expect(done.result).toBe(`Clawd did "wave" and said "${'x'.repeat(39)}…".`)
})

test('Claude may talk to Clawd twice a turn, and a new prompt starts the count over', { options: OPTIONS }, async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await start($, on, {}, NOON_IST)

  await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'hi' })
  await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'hi again' })
  const third = await $.tool.call({ tool: TALK, action: 'act', emote: 'wave', line: 'and again' })
  expect(third.result).toContain('still busy')

  await $.prompt.submit({ ...SUBMITTED, text: 'next thing' })
  const fresh = await $.tool.call({ tool: TALK, action: 'ask' })
  expect(fresh.result).toContain('watching you work')
})

test('Claude can ask Clawd to sing, and hears the line', LASTFM, async ($, on) => {
  const songbook = { ...LASTFM_SONGBOOK, lines: ['under pressure… to ship it ♪'] }
  const clock = await start($, on, { songbook }, NOON_IST)
  await clock.advance(1_500)

  const sung = await $.tool.call({ tool: TALK, action: 'sing' })
  expect(sung.result).toBe('Clawd sang: "under pressure… to ship it ♪"')
})


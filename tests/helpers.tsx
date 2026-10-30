// What the test files share: the band they mount, the session they start, stubs and constants.

import { mock, test } from 'claude-code/testing'
import type { Mounted, TestBody } from 'claude-code/testing'
import type { PromptEditInput, SessionMessage } from 'claude-code'

import { AURA, CALM, SAYINGS, type Saying } from '../hooks/clawd'

export const BAND = {
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

export type Args = Parameters<TestBody>

export type Shown = { findAll: (query: { type: string }) => Promise<readonly { props: { backgroundColor?: string } }[]> }

// Whether the aura round a meditating Clawd shows.
export async function auraShown(ui: Shown) {
  return (await ui.findAll({ type: 'Text' })).some(one => AURA.includes(one.props.backgroundColor ?? ''))
}

// The settings the tests run with: India's time and a 17:30 leave time.
export const OPTIONS = { utc_offset: '+05:30', leave_at: '17:30' }
// With Last.fm on as well.
export const LASTFM = { options: { ...OPTIONS, lastfm_user: 'listener', lastfm_api_key: 'k3y' } }

// 06:30 UTC is noon in India, the offset Clawd's sky follows by default.
export const NOON_IST = Date.UTC(2026, 9, 27, 6, 30)
export const LATE_EVENING_IST = Date.UTC(2026, 9, 27, 17, 0)

// How a command typed at the prompt arrives, beyond its name and arguments.
export const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as const
// How a prompt typed and sent with Enter arrives, beyond its text.
export const SUBMITTED = { origin: { kind: 'composer' }, wait: false } as const

// A tool call as another build of Claude Code makes it: the tools, and their arguments, differ
// from build to build, and the types know only this one's.
export const anyTool = (input: { tool: string } & Record<string, unknown>) => input as unknown as Parameters<Args[0]['tool']['call']>[0]

// What a model call that answered nothing used.
export const NO_USAGE = { input_tokens: 1, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

// The tools the plugin registered in the last test's session.
export const registered: { name: string; isDeferred?: unknown }[] = []

export async function start($: Args[0], on: Args[1], stored: Record<string, unknown> = {}, now = 1_000_000) {
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

// Tuesday 27 Oct 2026, in IST (UTC+5:30): leave time is 17:30 IST, 12:00 UTC.
export const istOn = (day: number, hour: number, minute: number) => Date.UTC(2026, 9, day, hour, minute) - 330 * 60_000

// Works through `minutes`, a prompt every one of them, so no gap is long enough to be a break.
export async function workFor($: Args[0], clock: Awaited<ReturnType<typeof start>>, minutes: number) {
  for (let at = 0; at < minutes; at++) {
    await $.prompt.submit({ ...SUBMITTED, text: 'next thing' })
    await clock.advance(60_000)
  }
}

// NOON_IST is a whole number of seconds divisible by 4, so leaving at it, or 1-3s after,
// picks pastime 0-3: sleep, fish, juggle, castle.
export const LEFT_TO_FISH = NOON_IST + 1000
export const LEFT_TO_JUGGLE = NOON_IST + 2000
export const LEFT_TO_BUILD = NOON_IST + 3000
// Past the 5 min doze; 460 frames, mid-way through a fishing cycle of 30.
export const AWAY_MS = 6 * 60 * 1000 + 8000

// A Bash call whose permission prompt waits five seconds on the person, who then allows it or not.
export function promptFirst($: Args[0], on: Args[1], clock: () => Awaited<ReturnType<typeof start>>, answer: 'allow' | 'deny') {
  on('classic.PermissionRequest', () => ({}))
  on('tool.call', { tool: 'Bash' }, async () => {
    await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'rm -r build' } })
    await clock().sleep(5000)

    return answer === 'allow' ? { result: 'removed' } : { deny: 'The person said no.' }
  })
}

// The person types `text` into an empty prompt, in one go.
export async function typeIn($: Args[0], text: string) {
  // The test's $ raises prompt.edit as the composer does, though its types leave the call out.
  const prompt = $.prompt as unknown as { edit: (e: PromptEditInput) => Promise<unknown> }
  await prompt.edit({ origin: { kind: 'composer' }, text: '', cursor: 0, start: 0, end: 0, inputText: text })
}

export const SUMMARY: SessionMessage = { role: 'user', text: 'summary so far', toolUses: [] }

// The thinking family's acts, in order; the first and fourth are meditations, saying any of CALM.
export const PONDERING = ['calm', 'shh. big brain at work.', 'blub… deep thoughts…', 'calm', 'thinking about shells…', 'blub… inner peace…']

// Shows the band working with `word` on a thinking spinner. No prompt starts the turn, so
// Clawd's emotes, which come only in a turn, stay off the spinner's acts.
export async function thinkAbout($: Args[0], on: Args[1], word: string) {
  // Stands for the engine's own spinner beneath the plugin.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>spinner</Text>
  })
  const clock = await start($, on, {}, NOON_IST)
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

export type Band = { findAll: (query: { type: string }) => Promise<readonly { text: string }[]> }

// Which of PONDERING Clawd is acting out ('calm' for any meditation), or undefined for none.
export async function actShown(ui: Band) {
  const texts = (await ui.findAll({ type: 'Text' })).map(one => one.text)

  return texts.some(text => CALM.includes(text)) ? 'calm' : PONDERING.find(line => texts.includes(line))
}

// The meditation line Clawd is saying, if any.
export async function calmShown(ui: Band) {
  return (await ui.findAll({ type: 'Text' })).map(one => one.text).find(text => CALM.includes(text))
}

// Whether `seen` runs on, in order, from somewhere in PONDERING, going round.
export const followsPondering = (seen: readonly (string | undefined)[]) =>
  PONDERING.some((_, start) => seen.every((act, i) => act === PONDERING[(start + i) % PONDERING.length]))

// A row as one cell per column, each with its character and color.
export const cellsOf = (row: { text: string; color?: string }[]) => row.flatMap(part => [...part.text].map(text => ({ text, color: part.color })))

// Answers Last.fm's two lookups; `played` false answers as a user with no plays this week.
export function lastfmStub(on: Parameters<TestBody>[1], urls: string[], played = true) {
  on('http.fetch', (_, e) => {
    urls.push(e.url)
    const body = e.url.includes('gettopartists')
      ? { topartists: { artist: played ? [{ name: 'Laufey' }, { name: 'Queen' }] : [] } }
      : e.url.includes('getrecenttracks')
        ? { recenttracks: { track: [] } }
        : { toptracks: { track: played ? [{ name: 'From the Start', artist: { name: 'Laufey' } }] : [] } }

    return { value: { status: 200, ok: true, headers: {}, text: JSON.stringify(body) } }
  })
}

export function modelStub(on: Parameters<TestBody>[1], prompts: string[]) {
  on('model.complete', (_, e) => {
    prompts.push(e.prompt)
    const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

    return { value: { isAnswered: true, text: 'one ♪\ntwo two ♪\nthree three ♪', usage } }
  })
}

export const GOLD = '#ffcb6b'
export const TOQUE = '#f4f1de'
export const WATER = '#8ab6d6'

// Whether some part of the band reads `text` in `color`.
export async function shows(ui: Mounted<'terminal', 'AbovePrompt'>, text: RegExp, color: string) {
  return (await ui.findAll({ type: 'Text', text })).some(one => one.props.color === color)
}

export const CHEF_LINES = ['chef claude in the kitchen.', 'needs more salt.', 'yes, chef!']
export const SNACK_LINES = ['smells good. save me some.', 'is that for me?', '*sniff sniff*', 'I brought a fork.']

export const RAISED = /^▗▟█████▙▖$/
export const LOWERED = /^▝▜█████▛▘$/

export const LASTFM_SONGBOOK = {
  day: '10-27',
  source: 'lastfm:listener',
  style: 9,
  taste: "this week's repeats: From the Start by Laufey. artists lately: Laufey, Queen",
  lines: ['from the start… of the build ♪'],
}

export const TALK = 'mcp__clawd__clawd'

// Any line of one of Clawd's sayings, whole.
export const saying = (name: Saying) => new RegExp(`^(${SAYINGS[name].map(line => line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`)

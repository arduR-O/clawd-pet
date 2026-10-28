import type { EmoteName } from '../types'

import { EMOTE_NAMES } from './clawd'

// The tool Claude talks to Clawd through, as Claude calls it.
export const TALK_TOOL = 'mcp__clawd__clawd'
// Lines Clawd says for Claude are cut to this many characters, to fit beside it.
const LINE_MAX = 40
// Claude may talk to Clawd this often in one turn; more would get in the way of the work.
export const TALKS_PER_TURN = 2

export const TALK_SPEC = {
  name: 'clawd',
  description: [
    "Talk to Clawd, the user's pet crab, who lives in the band above their prompt in this terminal",
    'and watches you work. Use it rarely and only when a moment earns it: celebrate a hard-won fix or',
    'green tests, commiserate after a failure, share a small joke, say hi or good night. Never let it',
    'get in the way of the task, and mention it in your reply only if it adds to it.',
    "act: Clawd acts out `emote` and says `line` (short, lowercase, in Clawd's voice).",
    'ask: hear how Clawd is doing (pets, treats, its sandcastle, the time where the user is).',
    'sing: Clawd sings a line from its songbook, which follows what the user has been listening to.',
  ].join(' '),
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['act', 'ask', 'sing'] },
      emote: { type: 'string', enum: [...EMOTE_NAMES], description: 'For act: what Clawd does.' },
      line: { type: 'string', description: `For act: what Clawd says, ${LINE_MAX} characters at most.` },
    },
    required: ['action'],
  },
  // Listed from the start: a tool behind ToolSearch would never occur to Claude.
  isDeferred: false,
} as const

export type TalkRequest = { action: 'act'; emote: EmoteName; line: string } | { action: 'ask' } | { action: 'sing' }

// What Claude asked for, checked; a reason Claude can act on when it can't be done.
export function talkRequest(input: Record<string, unknown>): TalkRequest | { error: string } {
  const { action, emote, line } = input
  if (action === 'ask' || action === 'sing') {
    return { action }
  }
  if (action !== 'act') {
    return { error: 'action must be act, ask or sing.' }
  }
  const pose = EMOTE_NAMES.find(one => one === emote)
  if (pose === undefined) {
    return { error: `emote must be one of: ${EMOTE_NAMES.join(', ')}.` }
  }
  const said = typeof line === 'string' ? line.replace(/\s+/g, ' ').trim() : ''

  return { action, emote: pose, line: [...said].length > LINE_MAX ? `${[...said].slice(0, LINE_MAX - 1).join('')}…` : said }
}

// How Clawd is doing, for Claude to read.
export function clawdStatus(status: {
  phase: string
  time: string
  pets: number
  treats: number
  castle: number
  taste: string | undefined
}): string {
  const { phase, time, pets, treats, castle, taste } = status
  return [
    `Clawd is happily watching you work. It's ${time} (${phase}) where the user is.`,
    `It has been petted ${pets} ${pets === 1 ? 'time' : 'times'} and fed ${treats} ${treats === 1 ? 'treat' : 'treats'} so far.`,
    castle === 0 ? 'No sandcastle yet today.' : `Today's sandcastle is ${castle} ${castle === 1 ? 'turn' : 'turns'} tall.`,
    taste === undefined ? '' : `Its songbook follows: ${taste}.`,
  ]
    .filter(part => part !== '')
    .join(' ')
}

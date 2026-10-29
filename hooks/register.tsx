import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Emote, EmoteName, Kind, Mood } from '../types'

import {
  CLAWD,
  EMOTE_NAMES,
  ambient,
  clawdScene,
  sayingOf,
  isSaying,
  type Saying,
  joinRuns,
  withStarters,
  petSuggestions,
  sceneFilm,
  pastimeLine,
  isVibeSinging,
  STARTER_SONGS,
  songbookLines,
  songbookPrompt,
  SONGBOOK_STYLE,
  tasteFrom,
  sungSoFar,
  pastimeOf,
  leaveLine,
  breakLine,
  parseMinutes,
  satAt,
  localTime,
  parseClock,
  parseOffset,
  phaseOf,
  pickIdle,
  pickPetted,
  pickTrick,
  pickGuest,
  spinnerTake,
  welcomeOf,
  treatLine,
} from './clawd'
import { TALK_SPEC, TALK_TOOL, TALKS_PER_TURN, clawdStatus, talkRequest } from './talk'

const REACTION_MS = 3000
const SLEEP_AFTER_MS = 5 * 60 * 1000
// While a spinner word stays up, Clawd moves on to its next act for it this often.
const SPINNER_CYCLE_MS = 12_000
// A turn longer than this ends in confetti.
const LONG_TURN_MS = 120_000
// After a long turn the person has likely looked away: its "done" stays up this long to greet them.
const LONG_DONE_MS = 60_000
// How long Clawd keeps asking at most while a permission prompt waits; its answer ends it sooner.
const WAIT_MS = 10 * 60_000
// Clawd watches the prompt this long after the last key.
const TYPING_MS = 1_500
// Where the prompt's text starts, past its `> `.
const PROMPT_INDENT = 2
// After this much thinking a thought bubble starts to grow, a step every BUBBLE_STEP_MS.
const BUBBLE_AFTER_MS = 6_000
const BUBBLE_STEP_MS = 3_000
const TICK_MS = 800
// The frames one picture plays for the apps, a tick each, before the next picture takes over.
const FILM_FRAMES = 12
const EMOTE_MS = 4000
// Clawd's idle emotes come one to two of these apart.
const EMOTE_GAP_MS = 45_000
// The share of those emotes that are songs.
const SING_SHARE = 1 / 3
const PET_SPREE_MS = 10_000
// A song lasts longer than other emotes, so the whole line gets sung.
const SING_MS = 7000
// How often Clawd looks at Last.fm again, rewriting the songbook only when your plays changed it.
// Vibing with headphones on lasts this long before Clawd breaks into song.
const VIBE_MS = 5000

const mood = atom(
  { plugin: 'clawd', key: 'mood' } as const,
  { kind: 'idle', line: '', until: 0, lastActiveAt: 0 },
  { shape: 'mood-1' },
)
const tick = atom({ plugin: 'clawd', key: 'tick' } as const, 0)
// Hidden with /pet off until /pet on; kept in the store so it holds across chats.
const isOff = atom({ plugin: 'clawd', key: 'isOff' } as const, false)
const emote = atom(
  { plugin: 'clawd', key: 'emote' } as const,
  { name: null, line: '', until: 0 },
  { shape: 'emote-1' },
)

// What the module keeps between events; a reload starts it over.
const life = {
  // The picture the apps were last sent, and the frame it starts on.
  film: { from: 0, source: '' },
  isBusy: false,
  nextEmoteAt: 0,
  spinnerWord: '',
  // Drawn afresh each time the word changes, so Clawd's pick holds while the word shows.
  spinnerSeed: 0,
  // When the spinner's word last changed, and when its thinking began (0 while not thinking).
  spinnerSince: 0,
  thinkingSince: 0,
  // Failed tools in a row.
  failStreak: 0,
  // Subagents out on a task.
  agentsOut: 0,
  // The sandcastle: turns finished on `castleDay` (month-day, local).
  castleTurns: 0,
  castleDay: '',
  // The day's songbook: short parodies Clawd sings.
  songs: STARTER_SONGS as readonly string[],
  // Clawd keeps its headphones on until then, through the song it breaks into.
  headphonesUntil: 0,
  // Times Claude has talked to Clawd this turn.
  talks: 0,
  petTimes: [] as number[],
  prompts: 0,
  // The pose Clawd was last drawn in, and since when, so a pose's own moves start at its start.
  pose: undefined as EmoteName | undefined,
  poseSince: 0,
  // What the person last typed in the prompt and when, for Clawd to watch.
  typed: { at: -Infinity, draft: '', caret: 0 },
  // The tool whose permission prompt is waiting on the person, while one is.
  waitingOn: undefined as string | undefined,
  // The guest `/pet guest` last brought, so the next is someone else.
  lastGuest: undefined as EmoteName | undefined,
  // How many times Clawd has said each of its sayings, to rotate through them.
  said: {} as Partial<Record<Saying, number>>,
  // The person's current stretch of work, for break nudges.
  sitting: { since: 0, lastSeen: -Infinity, nudgedAt: 0 },
}

// A git commit or push, with which one in group 1.
const SHIPS = /\bgit\s+(commit|push)\b/
const FORCE_PUSH = /git\s+push\b.*(--force|\s-f\b)/
const TESTS = /\b(pytest|jest|vitest|go test|cargo test|npm (run )?test)\b/
// A command that destroys something: refusing one gets a wizard.
const DESTRUCTIVE = /\brm\s|git\s+reset\s+--hard|git\s+push\b.*(--force|\s-f\b)|git\s+clean\s+-[a-z]*f|\bdrop\s+(table|database)\b|\bmkfs\b|\bdd\s+if=/i
// A prompt that is debugging out loud: a rubber duck turns up to listen.
const DEBUGGING = /\b(why|bug|broken|error|fails?|failing|doesn'?t work|weird|stuck)\b/i
const DUCK_PROMPT = 280

// Clawd's opinions on commands, with the emote it acts out when it has one; the first match speaks.
// A line that names one of Clawd's sayings rotates through it.
const ON_COMMANDS: readonly [RegExp, Kind, string, EmoteName?][] = [
  [/\brm\s+-[a-z]*(rf|fr)/, 'oops', 'rm -rf?! not my shells!'],
  [/git\s+reset\s+--hard/, 'oops', 'reset --hard. no take-backs.'],
  [FORCE_PUSH, 'run', 'jedi', 'jedi'],
  [/\bsudo\b/, 'run', 'ooh, sudo. fancy.', 'golden'],
  // Digging through who wrote what, and when it broke.
  [/git\s+(blame|bisect)\b|git\s+log\b.*\s-[SG]/, 'read', 'sherlock', 'sherlock'],
  // Going back in time: a revert, the reflog, a reset, an old commit checked out.
  [/git\s+(revert|reflog)\b|git\s+reset\b|git\s+(checkout|switch)\s+(--detach\s+)?[0-9a-f]{7,40}\b/, 'run', 'delorean', 'delorean'],
  [/git\s+stash\s+(pop|apply)\b/, 'run', 'ninjaBack', 'ninja'],
  [/git\s+stash\b/, 'run', 'ninja', 'ninja'],
  [/\b(kill|pkill|killall)\b/, 'run', 'terminator', 'terminator'],
  [/\b(docker|podman)\b/, 'run', 'whale', 'whale'],
  [/git\s+commit/, 'happy', 'commit it. claws crossed.'],
  [/git\s+(status|diff|log)/, 'read', "let's see the damage.", 'peek'],
  [TESTS, 'run', "tests! I'll watch."],
  [/\b(pip|npm|pnpm|yarn|uv) (install|add)\b/, 'run', 'more dependencies? sigh.', 'enough'],
  [/\b(curl|wget)\b/, 'run', 'fetching snacks?', 'snack'],
]

// Clawd's opinions on files, by path.
const ON_FILES: readonly [RegExp, string, EmoteName?][] = [
  [/(^|\/)\.env/, 'secrets? I saw nothing.', 'shy'],
  [/(-lock\.json|\.lock|lockfile)$/, 'the lockfile. brave.'],
  [/readme/i, 'reading the manual? unheard of.'],
  [/test/i, 'poking the tests, huh.'],
]

// Clawd's take on a slash command or skill, by name without its plugin prefix.
const ON_SKILLS: Readonly<Record<string, string>> = {
  'code-review': 'red pen time.',
  'security-review': 'checking the locks.',
  simplify: 'less is more.',
  clear: 'fresh start. who are you again?',
  compact: 'squishing memories.',
  resume: 'welcome back.',
  theme: 'ooh, new colors?',
}

// What Clawd acts out for a slash command or skill, where its line calls for it.
const SKILL_POSES: Readonly<Record<string, EmoteName>> = {
  'security-review': 'peek',
  simplify: 'meditate',
  clear: 'peek',
  compact: 'squish',
  resume: 'wave',
  theme: 'golden',
}

const skillPose = (name: string): EmoteName | undefined => SKILL_POSES[name.split(':').pop() ?? name]

// What Clawd says to a prompt that is neither the session's first nor a command.
const ROUTINE = ['go on…', 'listening.', 'mhm, mhm.', 'another one!', 'on it.', 'ok, next.']

// A prompt that names Clawd, and one that also thanks or praises it.
const NAMES_CLAWD = /\bclawd\b/i
const PRAISES = /\b(thanks?|thank you|ty|good|great|nice|love|best|cute)\b/i

// Clawd's line for a slash command or skill; `fallback` for names it has no view on.
const onSkill = (name: string, fallback: string) => ON_SKILLS[name.split(':').pop() ?? name] ?? fallback

// What Clawd remembers of the current turn, to hold opinions about it.
type Seen = {
  reads: Set<string>
  edits: Map<string, number>
  searches: number
  tools: number
  // Whether a test run has failed this turn, for the comeback when one passes.
  testsFailed: boolean
}

const fresh = (): Seen => ({ reads: new Set(), edits: new Map(), searches: 0, tools: 0, testsFailed: false })

const short = (text: string, max = 40) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

const basename = (path: string) => path.split('/').pop() ?? path

type ToolUse = { tool: string } & Record<string, unknown>

// A string argument of a tool call, or '' when it has none.
const field = (e: ToolUse, key: string) => (typeof e[key] === 'string' ? (e[key] as string) : '')

// What Clawd says while a permission prompt for `tool` waits on the person.
function askLine(tool: string): string {
  if (tool === 'AskUserQuestion') return 'Claude has a question for you.'
  if (tool === 'ExitPlanMode') return 'a plan for you to look at.'
  const name = tool.startsWith('mcp__') ? (tool.split('__').pop() ?? tool) : tool

  return `psst. ${short(name, 24)} needs your ok.`
}

// What Clawd does and says when Claude reaches for a tool and has no opinion of its own on it.
function reaction(e: ToolUse): [Kind, string] {
  const text = (key: string) => field(e, key)

  switch (e.tool) {
    case 'Read':
      return ['read', `reading ${basename(text('file_path'))}`]
    case 'Grep':
    case 'Glob':
      return ['read', `looking for ${short(text('pattern'), 30)}`]
    case 'WebFetch':
    case 'WebSearch':
      return ['read', 'peeking at the internet']
    case 'Bash':
      return ['run', `$ ${short(text('command'), 36)}`]
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return ['write', `scribbling on ${basename(text('file_path'))}`]
    case 'Agent':
      return ['think', 'sending a friend']
    default:
      return ['think', `using ${short(e.tool, 30)}`]
  }
}

// What Clawd thinks of a tool call, if anything; notes the call in `seen`.
function opinion(e: ToolUse, seen: Seen): [Kind, string, EmoteName?] | undefined {
  seen.tools += 1
  const isSearch = e.tool === 'Grep' || e.tool === 'Glob'
  seen.searches = isSearch ? seen.searches + 1 : 0
  if (isSearch) {
    // A search spree: Clawd puts on its deerstalker.
    return seen.searches >= 3 ? ['read', `search #${seen.searches}. lost, are we?`, 'sherlock'] : undefined
  }

  if (e.tool === 'Skill') {
    const name = field(e, 'skill')

    // A skill Clawd has no view on is downloaded straight into Claude's head.
    const known = ON_SKILLS[name.split(':').pop() ?? name]
    if (known === undefined) return ['think', say('neo').replace('{skill}', short(name.split(':').pop() ?? name, 20)), 'neo']

    return ['think', known, skillPose(name)]
  }

  if (e.tool === 'Bash') {
    const command = field(e, 'command')
    const hit = ON_COMMANDS.find(([pattern]) => pattern.test(command))

    return hit === undefined ? undefined : [hit[1], isSaying(hit[2]) ? say(hit[2]) : hit[2], hit[3]]
  }

  const path = field(e, 'file_path')
  if (path === '') {
    return undefined
  }
  const name = basename(path)
  if (e.tool === 'Read') {
    if (seen.reads.has(path)) {
      return ['read', `${name} again?`]
    }
    seen.reads.add(path)
  }
  if (e.tool === 'Edit' || e.tool === 'Write') {
    const edits = (seen.edits.get(path) ?? 0) + 1
    seen.edits.set(path, edits)
    if (edits >= 3) {
      return ['write', `edit #${edits} on ${name}. fiddly.`]
    }
  }
  const hit = ON_FILES.find(([pattern]) => pattern.test(path))

  return hit === undefined ? undefined : ['read', hit[1], hit[2]]
}

// The next line of one of Clawd's sayings, so it doesn't say the same thing every time.
function say(saying: Saying): string {
  const n = life.said[saying] ?? 0
  life.said[saying] = n + 1

  return sayingOf(saying, n)
}

// Shows a reaction for a few seconds, then Clawd settles back.
async function react($: EngineInterface, kind: Kind, line: string, ms = REACTION_MS) {
  const now = await $.clock.now()
  await update($, mood, (): Mood => ({
    kind,
    line,
    until: now + ms,
    lastActiveAt: now,
  }))
}

// Done waiting on a permission prompt that went unanswered as far as Clawd heard: it stops tapping.
async function stopWaiting($: EngineInterface) {
  if (life.waitingOn === undefined) return
  life.waitingOn = undefined
  if ((await read($, emote)).name === 'tap') {
    await update($, emote, (): Emote => ({ name: null, line: '', until: 0 }))
  }
}

// One pet, from /pet or a click on Clawd. Too many in a row and it has had enough.
async function petOnce($: EngineInterface) {
  const now = await $.clock.now()
  life.sitting = satAt(life.sitting, now)
  const pets = Number((await $.store.get('pets')) ?? 0) + 1
  await $.store.set('pets', pets)
  life.petTimes = [...life.petTimes.filter(at => now - at < PET_SPREE_MS), now]
  const [name, line] = pickPetted(pets, life.petTimes.length, Math.random())
  await update($, emote, (): Emote => ({ name, line, until: now + EMOTE_MS }))
  await react($, 'love', line)
}

// A local date as month-day, the sandcastle's day.
const dayOf = (local: { month: number; day: number }) => `${local.month}-${local.day}`

// Clawd starts singing a line from the songbook, and answers with it.
async function sing($: EngineInterface): Promise<string> {
  const now = await $.clock.now()
  const line = life.songs[Math.floor(Math.random() * life.songs.length)] ?? STARTER_SONGS[0]!
  await update($, emote, (): Emote => ({ name: 'sing', line, until: now + SING_MS }))

  return line
}

// Clawd puts on headphones and nods along, then breaks into song.
async function vibe($: EngineInterface) {
  const now = await $.clock.now()
  life.headphonesUntil = now + VIBE_MS + SING_MS
  await update($, emote, (): Emote => ({ name: 'vibe', line: '♪ *vibing* ♪', until: now + VIBE_MS }))
  $.clock.after(VIBE_MS, () => {
    void sing($)
  })
}

// What to sing like: your last week on Last.fm, or '' when Last.fm has no plays or can't be reached.
async function tasteOf($: EngineInterface, lastfm: { user: string; key: string }): Promise<string> {
  const ask = (method: string, extra: string) =>
    $.http
      .fetch(
        `https://ws.audioscrobbler.com/2.0/?method=${method}&user=${encodeURIComponent(lastfm.user)}` +
          `&${extra}&api_key=${encodeURIComponent(lastfm.key)}&format=json`,
      )
      .then(reply => (reply.ok ? (JSON.parse(reply.text) as unknown) : undefined))
      .catch(() => undefined)
  // This week's top artists and songs, the last 30 plays (the newest, and what is on repeat), and
  // a few all-time favourites.
  const [artists, week, recent, allTime] = await Promise.all([
    ask('user.gettopartists', 'period=7day&limit=5'),
    ask('user.gettoptracks', 'period=7day&limit=8'),
    ask('user.getrecenttracks', 'limit=30'),
    ask('user.gettoptracks', 'period=overall&limit=5'),
  ])

  return tasteFrom(artists, week, recent, allTime)
}

// Loads the songbook, or has Claude write one in the vibe of what you've been playing (tasteOf):
// once a day, and again when the source or the prompt's style changes (or `/pet refresh-songs`
// forgets it). Until it is written, and whenever writing fails, the last songbook or the starter
// songs are sung.
async function refreshSongbook($: EngineInterface, lastfm: { user: string; key: string }, today: string) {
  // Without Last.fm, Clawd sings its built-in songs and calls no model.
  if (lastfm.user === '' || lastfm.key === '') {
    return
  }
  const source = `lastfm:${lastfm.user}`
  type Songbook = { day?: string; source?: string; style?: number; taste?: string; lines?: string[] }
  const kept = (await $.store.get('songbook')) as Songbook | undefined
  if (kept?.lines !== undefined && kept.lines.length > 0) {
    life.songs = withStarters(kept.lines)
  }
  const isCurrent = kept?.day === today && kept.source === source && kept.style === SONGBOOK_STYLE
  if (isCurrent) {
    return
  }
  const taste = await tasteOf($, lastfm)
  if (taste === '') {
    return
  }
  // A call the engine refuses to send (a blocked model) rejects; Clawd keeps the songs it has.
  const reply = await $.model
    .complete({ model: 'haiku', maxTokens: 400, prompt: songbookPrompt(taste) })
    .catch(() => undefined)
  const lines = reply?.isAnswered === true ? songbookLines(reply.text) : []
  if (lines.length >= 3) {
    life.songs = withStarters(lines)
    await $.store.set('songbook', { day: today, source, style: SONGBOOK_STYLE, taste, lines })
  }
}

// Now and then while Claude works, Clawd does a little something: then the person is waiting,
// not reading Claude's answer.
async function maybeEmote($: EngineInterface, offsetMinutes: number) {
  // Runs every tick: the cheap checks first.
  if (!life.isBusy || life.waitingOn !== undefined) {
    return
  }
  const now = await $.clock.now()
  if (now < life.nextEmoteAt) {
    return
  }
  const m = await read($, mood)
  if (now < m.until) {
    return
  }
  const picked = pickIdle(phaseOf(localTime(now, offsetMinutes).hour), Math.random())
  if (picked.name === 'sing' || Math.random() < SING_SHARE) {
    await sing($)
  } else if (picked.name === 'vibe') {
    await vibe($)
  } else {
    await update($, emote, (): Emote => ({ name: picked.name, line: picked.line, until: now + EMOTE_MS }))
  }
  life.nextEmoteAt = now + EMOTE_GAP_MS + Math.random() * EMOTE_GAP_MS
}

// The mood to draw now: a reaction until it runs out, else a resting one.
function current(m: Mood, now: number, isWorking: boolean): [Kind, string] {
  if (now < m.until) {
    return [m.kind, m.line]
  }
  if (isWorking) {
    return ['think', 'hmm…']
  }
  if (now - m.lastActiveAt > SLEEP_AFTER_MS) {
    return ['sleep', 'z z z']
  }

  return ['idle', '']
}

export const register: Register = (on, options) => {
  const offsetMinutes = parseOffset(String(options.utc_offset ?? '+05:30'))
  const leaveAt = parseClock(String(options.leave_at ?? ''))
  const breakEvery = parseMinutes(String(options.break_every ?? '50'))
  // The clawd tool goes into every request Claude makes, so it is there only when asked for.
  const canTalk = String(options.talk ?? 'off') === 'on'
  const lastfm = { user: String(options.lastfm_user ?? '').trim(), key: String(options.lastfm_api_key ?? '').trim() }

  on('session.start', async ($, e, next) => {
    life.prompts = 0
    await $.command.register({
      name: 'pet',
      description: 'Pet Clawd, the crab above the prompt; /pet guest for a guest; /pet off to hide it; /pet refresh-songs for a new songbook',
      // A pet only touches Clawd's own state, so it need not wait for Claude's turn.
      argumentHint: '[treat|trick|guest|off|on|<emote>…]',
      immediate: true,
    })
    if (canTalk) {
      await $.tool.register(TALK_SPEC)
    }
    const now = await $.clock.now()
    await update($, mood, m => ({ ...m, lastActiveAt: now }))
    life.nextEmoteAt = now + EMOTE_GAP_MS / 2
    const wasOff = (await $.store.get('off')) === true
    await update($, isOff, () => wasOff)
    const castle = (await $.store.get('castle')) as { day?: string; turns?: number } | undefined
    life.castleDay = castle?.day ?? ''
    life.castleTurns = Number(castle?.turns ?? 0)
    // Off the session's start, which waits for nothing: the songbook may need a model call.
    const refresh = async () => refreshSongbook($, lastfm, dayOf(localTime(await $.clock.now(), offsetMinutes)))
    $.clock.after(1000, () => {
      void refresh()
    })
    $.clock.every(TICK_MS, () => {
      void (async () => {
        // Hidden, nothing moves: no redraws until /pet on.
        if (await read($, isOff)) return
        await update($, tick, n => n + 1)
        await maybeEmote($, offsetMinutes)
      })()
    })

    return next(e)
  })

  let seen = fresh()

  on('prompt.submit', async ($, e, next) => {
    // /pet already reacted; this would talk over it.
    if (e.command?.name === 'pet') {
      return next(e)
    }
    seen = fresh()
    await stopWaiting($)
    life.isBusy = true
    life.sitting = satAt(life.sitting, await $.clock.now())
    life.failStreak = 0
    life.talks = 0
    life.prompts += 1
    const now = await $.clock.now()
    const local = localTime(now, offsetMinutes)
    const isLate = phaseOf(local.hour) === 'night'
    life.nextEmoteAt = now + EMOTE_GAP_MS / 2
    const m = await read($, mood)
    const wasAway = now - m.lastActiveAt > SLEEP_AFTER_MS && now >= m.until
    let line: string
    if (e.command !== undefined) {
      line = onSkill(e.command.name, `/${short(e.command.name, 30)}? sure.`)
      const pose = skillPose(e.command.name)
      if (pose !== undefined) {
        await update($, emote, (): Emote => ({ name: pose, line, until: now + EMOTE_MS }))
      }
    } else {
      line = isLate
        ? 'at this hour?'
        : (leaveLine(local, leaveAt, 'prompt') ??
          (life.prompts === 1
            ? 'ooh, what are we making?'
            : (ROUTINE[Math.floor(Math.random() * ROUTINE.length)] ?? 'on it.')))
      if (isLate) {
        await update($, emote, (): Emote => ({ name: 'yawn', line, until: now + EMOTE_MS }))
      }
      const phase = phaseOf(local.hour)
      const today = dayOf(local)
      if ((phase === 'dawn' || phase === 'morning') && (await $.store.get('coffee')) !== today) {
        // The day's first prompt, in the morning, in any chat: coffee first.
        await $.store.set('coffee', today)
        line = say('coffee')
        await update($, emote, (): Emote => ({ name: 'coffee', line, until: now + EMOTE_MS }))
      } else if (e.text.length >= DUCK_PROMPT && DEBUGGING.test(e.text)) {
        // A long prompt working through a bug: a rubber duck turns up to listen.
        line = say('duck')
        await update($, emote, (): Emote => ({ name: 'duck', line, until: now + EMOTE_MS }))
      }
    }
    if (e.command === undefined && NAMES_CLAWD.test(e.text)) {
      // Named in the prompt: Clawd perks up, or glows at a kind word.
      const [name, said]: [EmoteName, string] = PRAISES.test(e.text) ? ['hearts', 'aw, thanks!'] : ['peek', 'you called?']
      line = said
      await update($, emote, (): Emote => ({ name, line, until: now + EMOTE_MS }))
    }
    if (wasAway) {
      // Back from a while away: Clawd wakes with a stretch, or looks up from its pastime.
      const [name, welcome] = welcomeOf(pastimeOf(m.lastActiveAt, now, local))
      await update($, emote, (): Emote => ({ name, line: welcome, until: now + EMOTE_MS }))
      line = welcome
    }
    await react($, wasAway ? 'happy' : 'think', line)

    return next(e)
  }).catch(($, e, next) => next(e))

  // Every key the person types: kept cheap, as it runs per keystroke. Clawd only notes the draft
  // and the time; the next tick's drawing has it watch.
  on('prompt.edit', async ($, e, next) => {
    const now = await $.clock.now()
    life.typed = { at: now, draft: e.text.slice(0, e.start) + e.inputText + e.text.slice(e.end), caret: e.start + e.inputText.length }
    life.sitting = satAt(life.sitting, now)

    return next(e)
  }).catch(($, e, next) => next(e))

  // A pet must never stand between Claude and a tool: next replays, never reruns.
  on('tool.call', async ($, e, next) => {
    // Claude talking to Clawd is answered by its own hook, with no reaction to the call itself.
    if (e.tool === TALK_TOOL) {
      return next(e)
    }
    const [kind, line, pose] = opinion(e, seen) ?? reaction(e)
    if (pose !== undefined) {
      const now = await $.clock.now()
      await update($, emote, (): Emote => ({ name: pose, line, until: now + EMOTE_MS }))
    }
    await react($, kind, line)
    // A background agent's call returns as soon as it starts, so only a waited-for one is out.
    // Not every build's Agent tool takes run_in_background, so it is looked for, not assumed.
    const isAgent = e.tool === 'Agent' && !('run_in_background' in e && e.run_in_background === true)
    if (isAgent) {
      life.agentsOut += 1
    }
    let ran: Awaited<ReturnType<typeof next>>
    try {
      ran = await next(e)
    } finally {
      if (isAgent) {
        life.agentsOut = Math.max(0, life.agentsOut - 1)
      }
    }
    const isDenied = ran.deny !== undefined
    const isFailed = !isDenied && ran.isError === true
    if (life.waitingOn === e.tool) {
      // The person answered the prompt Clawd was waiting on; turning down something destructive
      // brings out the wizard.
      life.waitingOn = undefined
      const now = await $.clock.now()
      const isWizard = isDenied && e.tool === 'Bash' && DESTRUCTIVE.test(field(e, 'command'))
      const line = isWizard ? say('gandalf') : isDenied ? say('refused') : say('thanks')
      const pose: EmoteName = isWizard ? 'gandalf' : isDenied ? 'enough' : 'hop'
      await update($, emote, (): Emote => ({ name: pose, line, until: now + (isWizard ? EMOTE_MS : REACTION_MS) }))
      await react($, isDenied ? 'idle' : 'happy', line)
    }
    // Only the main conversation's tools count towards a streak, and a refused call is neither.
    if (e.agentId === undefined && !isDenied) {
      life.failStreak = isFailed ? life.failStreak + 1 : 0
    }
    const command = e.tool === 'Bash' ? field(e, 'command') : ''
    const isTests = !isDenied && TESTS.test(command)
    // A force push keeps its Jedi rather than getting confetti.
    const shipped = !isDenied && !isFailed && !FORCE_PUSH.test(command) ? SHIPS.exec(command)?.[1] : undefined
    if (shipped !== undefined) {
      // A commit or push that went through gets confetti.
      const line = say(shipped === 'push' ? 'pushed' : 'committed')
      const now = await $.clock.now()
      await update($, emote, (): Emote => ({ name: 'party', line, until: now + EMOTE_MS }))
      await react($, 'happy', line)
    } else if (isTests && !isFailed && seen.testsFailed) {
      // Green after red, in the same turn: an extra life.
      seen.testsFailed = false
      const line = say('oneup')
      const now = await $.clock.now()
      await update($, emote, (): Emote => ({ name: 'oneup', line, until: now + EMOTE_MS }))
      await react($, 'happy', line)
    } else if (isTests) {
      seen.testsFailed ||= isFailed
      const line = say(isFailed ? 'failed' : 'passed')
      if (!isFailed) {
        // Squinting at the green, not cheering it.
        const now = await $.clock.now()
        await update($, emote, (): Emote => ({ name: 'enough', line, until: now + EMOTE_MS }))
      }
      await react($, isFailed ? 'oops' : 'happy', line)
    } else if (isFailed && life.failStreak >= 3) {
      const now = await $.clock.now()
      const line = say('dizzy')
      await update($, emote, (): Emote => ({ name: 'dizzy', line, until: now + EMOTE_MS }))
      await react($, 'oops', line)
    } else if (isFailed && life.failStreak >= 2) {
      const now = await $.clock.now()
      const line = say('again')
      await update($, emote, (): Emote => ({ name: 'facepalm', line, until: now + EMOTE_MS }))
      await react($, 'oops', line)
    } else if (isFailed) {
      await react($, 'oops', say('broke'))
    } else if (isAgent && !isDenied && life.agentsOut === 0) {
      const now = await $.clock.now()
      const line = say('crew')
      await update($, emote, (): Emote => ({ name: 'cousin', line, until: now + EMOTE_MS }))
      await react($, 'happy', line)
    }

    return ran
  }).catch(($, e, next) => next(e))

  // A permission prompt is about to wait on the person: Clawd taps its foot until they answer,
  // which the tool's own call hears when it goes on or is refused.
  on('classic.PermissionRequest', async ($, e, next) => {
    const now = await $.clock.now()
    const line = askLine(e.tool_name)
    life.waitingOn = e.tool_name
    await update($, emote, (): Emote => ({ name: 'tap', line, until: now + WAIT_MS }))
    await react($, 'think', line, WAIT_MS)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    // A subagent's end raises this too; only the main conversation's turn counts.
    if (e.agentId !== undefined) {
      return next(e)
    }
    await stopWaiting($)
    life.isBusy = false
    life.spinnerWord = ''
    life.thinkingSince = 0
    // Each finished turn adds to today's sandcastle; a new day starts a new one.
    // Read fresh, so sessions open side by side add to one castle.
    const today = dayOf(localTime(await $.clock.now(), offsetMinutes))
    const kept = (await $.store.get('castle')) as { day?: string; turns?: number } | undefined
    life.castleTurns = kept?.day === today ? Number(kept.turns ?? 0) + 1 : 1
    life.castleDay = today
    await $.store.set('castle', { day: today, turns: life.castleTurns })
    const now = await $.clock.now()
    const local = localTime(now, offsetMinutes)
    const leaving = leaveLine(local, leaveAt, 'done')
    const stretch = leaving === undefined ? breakLine(life.sitting, now, breakEvery) : undefined
    if (stretch !== undefined) {
      // A long stretch of work: Clawd stretches, and suggests the person does too.
      life.sitting = { ...life.sitting, nudgedAt: now }
      await update($, emote, (): Emote => ({ name: 'stretch', line: stretch, until: now + EMOTE_MS }))
    }
    if (e.reason === 'aborted' || e.reason === 'error' || e.reason === 'refusal') {
      // Stopped short: nothing to cheer. Lost to an API error, Clawd radios Houston.
      const isLost = e.reason === 'error'
      const said = e.reason === 'aborted' ? 'ok, stopping.' : isLost ? say('houston') : 'that ended badly.'
      if (isLost) {
        await update($, emote, (): Emote => ({ name: 'astronaut', line: said, until: now + EMOTE_MS }))
      }
      await react($, e.reason === 'aborted' ? 'idle' : 'oops', said)

      return next(e)
    }
    const minutes = Math.round(e.durationMs / 60_000)
    const isLong = e.durationMs >= LONG_TURN_MS
    const line =
      leaving ??
      stretch ??
      (isLong
        ? `done! that took ${minutes} min.`
        : seen.tools >= 15
          ? `finally. ${seen.tools} tools, that was a lot.`
          : seen.tools === 0
            ? 'just talking? fine.'
            : say('done'))
    if (isLong && stretch === undefined) {
      // A long turn's end: a burst of confetti, and the line stays up a while so the person sees it when they look back.
      await update($, emote, (): Emote => ({ name: 'party', line, until: now + EMOTE_MS }))
    }
    await react($, 'happy', line, isLong ? LONG_DONE_MS : REACTION_MS)

    return next(e)
  })

  on('command.run', { command: 'pet' }, async ($, e) => {
    const asked = e.args.trim().toLowerCase()
    life.sitting = satAt(life.sitting, await $.clock.now())
    if (asked === 'off' || asked === 'on') {
      await $.store.set('off', asked === 'off')
      await update($, isOff, () => asked === 'off')

      return { text: asked === 'off' ? 'Pet hidden until /pet on.' : 'Pet back.' }
    }
    if (await read($, isOff)) {
      return { text: 'The pet is hidden; /pet on brings it back.' }
    }
    if (asked === 'refresh-songs') {
      // Forget the songbook and write a new one now, from Last.fm.
      if (lastfm.user === '' || lastfm.key === '') {
        return { text: 'Last.fm is not set, so Clawd only sings its built-in songs. Set it with /plugin configure.' }
      }
      await $.store.set('songbook', null)
      life.songs = STARTER_SONGS
      void refreshSongbook($, lastfm, dayOf(localTime(await $.clock.now(), offsetMinutes)))
      await react($, 'happy', 'new songs coming…')

      return {}
    }
    if (asked === 'guest') {
      // Someone drops by, not whoever came last, with something to say.
      const [name, saying] = pickGuest(Math.random(), life.lastGuest)
      life.lastGuest = name
      const line = say(saying).replace('{skill}', 'kung fu')
      const now = await $.clock.now()
      await update($, emote, (): Emote => ({ name, line, until: now + EMOTE_MS }))
      await react($, 'happy', line)

      return {}
    }
    if (asked === 'treat' || asked === 'trick') {
      const now = await $.clock.now()
      let act: [EmoteName, string]
      if (asked === 'treat') {
        const treats = Number((await $.store.get('treats')) ?? 0) + 1
        await $.store.set('treats', treats)
        act = ['treat', treatLine(treats, Math.random())]
      } else {
        act = pickTrick(Math.random())
      }
      const [name, line] = act
      await update($, emote, (): Emote => ({ name, line, until: now + EMOTE_MS }))
      await react($, 'love', line)

      return {}
    }
    const shown = EMOTE_NAMES.find(one => one === asked)
    if (shown === 'sing' || shown === 'vibe') {
      await (shown === 'sing' ? sing($) : vibe($))

      return {}
    }
    if (shown !== undefined) {
      // After treat and trick, which are commands first: a preview, the emote as it plays, with its name for a line.
      const now = await $.clock.now()
      await update($, emote, (): Emote => ({ name: shown, line: `(${shown})`, until: now + EMOTE_MS }))

      return {}
    }
    if (asked !== '') {
      return { text: 'Try /pet, /pet treat, /pet trick, /pet guest, or /pet and an emote, such as /pet meditate.' }
    }

    await petOnce($)

    return {}
  })

  // Typing /pet and a space or a few letters offers the commands and emotes it takes.
  on('prompt.autocomplete', async ($, e, next) => ({
    suggestions: [...(await next(e)).suggestions, ...petSuggestions(e.text.slice(0, e.cursor))],
  }))

  // Talking to Clawd only changes the pet above the prompt, so it needs no permission.
  on('tool.check', { tool: 'mcp__clawd__clawd' }, () => ({
    decision: 'allow' as const,
    reason: "Clawd's own tool: it only changes the pet above the prompt.",
  }))

  // Claude talking to Clawd: Clawd acts out what Claude asks, sings, or says how it's doing.
  on('tool.call', { tool: 'mcp__clawd__clawd' }, async ($, e) => {
    const request = talkRequest(e)
    if ('error' in request) {
      return { deny: request.error }
    }
    if (await read($, isOff)) {
      return { result: 'The user has hidden Clawd with /pet off; it is away until they type /pet on.' }
    }
    if (life.talks >= TALKS_PER_TURN) {
      return { result: 'Clawd is still busy with the last one; leave it be for this turn.' }
    }
    life.talks += 1
    const now = await $.clock.now()
    if (request.action === 'act') {
      await update($, emote, (): Emote => ({ name: request.emote, line: request.line, until: now + EMOTE_MS }))
      await react($, 'idle', request.line)

      return { result: `Clawd did "${request.emote}"${request.line === '' ? '' : ` and said "${request.line}"`}.` }
    }
    if (request.action === 'sing') {
      return { result: `Clawd sang: "${await sing($)}"` }
    }
    const local = localTime(now, offsetMinutes)
    const minutes = Math.floor((local.hour % 1) * 60)
    const songbook = (await $.store.get('songbook')) as { taste?: string } | undefined

    return {
      result: clawdStatus({
        phase: phaseOf(local.hour),
        time: `${Math.floor(local.hour)}:${String(minutes).padStart(2, '0')}`,
        pets: Number((await $.store.get('pets')) ?? 0),
        treats: Number((await $.store.get('treats')) ?? 0),
        castle: life.castleDay === dayOf(local) ? life.castleTurns : 0,
        taste: songbook?.taste,
      }),
    }
  })

  // Compacting the conversation squishes Clawd flat for a moment.
  on('session.compact', async ($, e, next) => {
    const isCompacting = e.agentId === undefined && e.trigger !== 'precompute'
    if (isCompacting) {
      const now = await $.clock.now()
      const line = say('squish')
      await update($, emote, (): Emote => ({ name: 'squish', line, until: now + EMOTE_MS }))
      await react($, 'idle', line)
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  // Clawd reacts to the spinner's word; the spinner itself is left as the engine draws it.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const now = await $.clock.now()
    if (e.props.word !== life.spinnerWord) {
      life.spinnerSeed = Math.random()
      life.spinnerSince = now
    }
    if (e.props.mode !== 'thinking') {
      life.thinkingSince = 0
    } else if (life.thinkingSince === 0) {
      life.thinkingSince = now
    }
    life.spinnerWord = e.props.word

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isOff))) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    // In the terminal, a click on Clawd, or on its name, pets it.
    const pet = () => void petOnce($)
    const m = await read($, mood)
    const frame = await read($, tick)
    const now = await $.clock.now()
    const [kind, line] = current(m, now, e.props.isWorking)
    const local = localTime(now, offsetMinutes)
    const act = await read($, emote)
    let pose = act.name !== null && now < act.until ? act.name : undefined
    let said = pose !== undefined && now >= m.until ? act.line : line
    if (e.props.isWorking && now >= m.until && pose === undefined) {
      const step = Math.floor((now - life.spinnerSince) / SPINNER_CYCLE_MS)
      const take = spinnerTake(life.spinnerWord, life.spinnerSeed, step)
      pose = take.pose
      said = take.line
    }
    const castle = life.castleDay === dayOf(local) ? life.castleTurns : 0
    let mode = kind
    let isListening = now < life.headphonesUntil
    if (kind === 'sleep') {
      // Away a while: by day Clawd may take up a pastime instead of sleeping.
      const pastime = pastimeOf(m.lastActiveAt, now, local)
      if (pastime !== 'sleep') {
        mode = 'idle'
        pose = pastime === 'vibe' && isVibeSinging(frame) ? 'sing' : pastime
        said = pastimeLine(pastime, frame, castle, life.songs)
        isListening = pastime === 'vibe'
      }
    }
    if (pose === 'sing' && said === act.line) {
      said = sungSoFar(act.line, now - (act.until - SING_MS), TICK_MS)
    }
    if (said === '') {
      said = ambient(local, now, leaveAt)
    }
    if (pose !== life.pose) {
      life.pose = pose
      life.poseSince = now
    }
    const thinking = e.props.isWorking && life.thinkingSince > 0 ? now - life.thinkingSince - BUBBLE_AFTER_MS : -1
    const poseFrame = Math.floor((now - life.poseSince) / TICK_MS)
    const sceneAt = (at: number) =>
      clawdScene({
        kind: mode,
        emote: pose,
        frame: at,
        poseFrame: Math.max(0, poseFrame + at - frame),
        nowMs: now,
        local,
        crew: life.agentsOut,
        bubble: thinking < 0 ? 0 : Math.min(3, Math.floor(thinking / BUBBLE_STEP_MS) + 1),
        castle,
        hasHeadphones: isListening,
        ...(now - life.typed.at < TYPING_MS && {
          typing: {
            caret: (PROMPT_INDENT + life.typed.caret) % Math.max(1, e.props.bodyColumns),
            isPet: /^\/pet\b/.test(life.typed.draft),
          },
        }),
      })

    // A terminal draws the rows as characters; the apps that draw pictures get them as a drawing,
    // since their fonts and line spacing pull block characters apart.
    let drawing
    if (e.surface === 'terminal') {
      // One plain button round the whole drawing, its rows joined by line breaks, so a click
      // anywhere on Clawd lands on it and the pointer lights all of it up at once.
      const lines = joinRuns(sceneAt(frame))
      drawing = (
        <Button key="clawd" label="pet Clawd" plain onPress={pet}>
          {lines.flatMap((row, i) => [
            ...row.map(part => (
              <Text color={part.color} backgroundColor={part.backgroundColor}>
                {part.text}
              </Text>
            )),
            ...(i < lines.length - 1 ? ['\n'] : []),
          ])}
        </Button>
      )
    } else {
      // The apps get FILM_FRAMES frames at once, as one picture that plays them, and a new one only
      // when those run out or what Clawd does changes: a picture swapped every tick can fail to
      // load in a window left in the background (VS Code on a remote host), leaving its alt text.
      const filmFrom = (from: number) =>
        sceneFilm(
          Array.from({ length: FILM_FRAMES }, (_, i) => sceneAt(from + i)),
          TICK_MS,
        )
      const { from, source } = life.film
      if (frame < from || frame >= from + FILM_FRAMES || filmFrom(from) !== source) {
        life.film = { from: frame, source: filmFrom(frame) }
      }
      const { Svg } = $.ui.resolve(e)
      drawing = <Svg source={life.film.source} alt={pose === undefined ? 'Clawd' : `Clawd: ${pose}`} isInteractive />
    }

    const name = (
      <Text color={CLAWD} bold>
        Clawd{mode === 'love' ? ' ♥' : ''}
      </Text>
    )

    return (
      <Box flexDirection="row">
        {drawing}
        <Box flexDirection="column" marginLeft={2}>
          {/* The apps draw every Button as a native one, a filled box, so there the name is text. */}
          {e.surface === 'terminal' ? (
            <Button key="name" plain onPress={pet}>
              {name}
            </Button>
          ) : (
            name
          )}
          {said !== '' &&
            (e.surface === 'terminal' ? (
              // Cut to the columns beside the drawing.
              <Text dimColor>{short(said, Math.max(10, e.props.bodyColumns - 16))}</Text>
            ) : (
              // The apps' columns are not the terminal's: they wrap the line to the room they have.
              <Text dimColor wrap="wrap">
                {said}
              </Text>
            ))}
        </Box>
      </Box>
    )
  })
}

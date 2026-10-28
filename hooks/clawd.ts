import type { EmoteName, Kind } from '../types'

// NarutoDark's orange as a raw color: the theme's own `claude` key is blue in some themes.
export const CLAWD = '#ff8800'
const SLEEPY_CLAWD = '#a65800'
const SHADES = '#1a1a1a'
const SUN = '#ffcb6b'
const LOW_SUN = '#f6b38e'
const MOON = '#c9c9e0'
const FULL_MOON = '#f4f1de'
const HEART = '#ff91de'
const GOLD = '#ffcb6b'
const GULL = '#e6e6e6'
const WATER = '#8ab6d6'
const SHELL = '#7a4a2a'
const COUSIN = '#ffb366'
const PEARL = '#f4f1de'
const SAND = '#e0c58f'
const PHONES = '#8a8fbf'
const TOQUE = '#f4f1de'
const ROD = '#c9a36b'
// The reading glasses' frames, either side of each eye.
const FRAMES = ['(', ')'] as const
// The reading glasses' outer rims, past the face's edges: a mid tone that shows on dark and light terminals.
const GLASSES = '#7a7f9a'
// Heart eyes: a deep red, so they show on the orange face.
const HEART_EYES = '#c0143c'
const CONFETTI: readonly [string, string][] = [
  ['*', HEART],
  ['·', GOLD],
  ['✦', '#9fd3c7'],
  ['°', '#b4a7e6'],
]

// The sky is this wide; Clawd stands under it, BASE cells in.
const SKY = 17
const BASE = 3

const SYNODIC_DAYS = 29.530588
const NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14)

// This many pets within a few seconds is too many.
const PET_SPREE = 6
// Idle Clawd blinks once in this many frames (800ms each); rarely, as you are reading then.
const BLINK_EVERY = 20
const BUSY: readonly Kind[] = ['think', 'read', 'run', 'write']
const SIDESTEP = [0, 1, 2, 1, 0, -1, -2, -1]
const WIGGLE = [0, 1, 0, -1]
// How far down a meditating Clawd floats, in half rows, frame by frame from when it starts.
const FLOAT = [0, 1, 2, 1]
// Its hum stretching out over the same frames, as long as fits beside it.
const HUM = ['ᵒᵐ', 'ᵒᵐᵐ', 'ᵒᵐᵐᵐ', 'ᵒᵐᵐᵐ']
// A meditating Clawd as pixels, two across and two down a cell, from its left claw's column:
// small claws at its sides, tips turned up.
const MEDITATING = [
  '                  ',
  '                  ',
  '   ############   ',
  ' # ############ # ',
  ' ################ ',
  '   ############   ',
]
// Its shut eyes: the cells they're in, from the left claw's, and the pixel row they run along the top of.
const MEDITATING_EYES = { cells: [2, 6], top: 3 }
// The aura round a meditating Clawd, pulsing between two shades.
export const AURA = ['#241e33', '#2d2540']
// Block glyphs by the quadrants they fill: top-left 8, top-right 4, bottom-left 2, bottom-right 1.
const QUADRANTS = ' ▗▖▄▝▐▞▟▘▚▌▙▀▜▛█'

const EYES = '▐▛███▜▌'
const EYES_UP = '▐▙███▟▌'
const EYES_HAPPY = '▐▀███▀▌'
const CLAWS_DOWN = '▝▜█████▛▘'
const CLAWS_UP = '▗▟█████▙▖'
const CLAWS_REST = '▗▄█████▄▖'
const WAVE_LEFT = '▗▟█████▛▘'
const WAVE_RIGHT = '▝▜█████▙▖'
const LEGS = '  ▘▘ ▝▝ '
const LEGS_STEP = '  ▝▝ ▘▘ '

export type Segment = { text: string; color?: string; backgroundColor?: string }
export type Row = Segment[]

export type Phase = 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening'

// The person's wall clock: the hour with minutes as a fraction, and the date there.
export type Local = { hour: number; weekday: number; month: number; day: number }

// Things Clawd does now and then while nobody needs it, and when it may.
const IDLE: readonly { name: EmoteName; line: string; when?: readonly Phase[] }[] = [
  { name: 'wave', line: 'o/' },
  { name: 'dance', line: '♪ tiny crab rave ♪' },
  { name: 'bubbles', line: 'blub.' },
  { name: 'sidestep', line: '*scuttle scuttle*' },
  { name: 'peek', line: '…did you hear that?' },
  { name: 'snack', line: '*munch* found a crumb.', when: ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'evening'] },
  { name: 'sunbathe', line: 'soaking it in.', when: ['midday', 'afternoon'] },
  { name: 'shades', line: 'too bright. *shades on*', when: ['midday', 'afternoon'] },
  { name: 'stargaze', line: 'counting stars… 7, 8…', when: ['evening', 'night'] },
  { name: 'wish', line: 'shooting star! make a wish.', when: ['evening', 'night'] },
  { name: 'yawn', line: '*yaaawn*', when: ['night', 'dawn'] },
  { name: 'sixseven', line: 'six… seven…' },
  { name: 'uwu', line: 'UwU' },
  { name: 'hiccup', line: '*hic*' },
  // Its line comes from the songbook.
  { name: 'sing', line: '' },
  // Headphones on, nodding along, and then a song.
  { name: 'vibe', line: '♪ *vibing* ♪' },
  { name: 'spin', line: 'wheee!' },
]

// Rarer surprises, one idle emote in RARE_CHANCE.
const RARE_CHANCE = 0.15
const RARE: readonly { name: EmoteName; line: string; when?: readonly Phase[] }[] = [
  { name: 'seagull', line: 'SEAGULL! hide!', when: ['dawn', 'morning', 'midday', 'afternoon', 'dusk'] },
  { name: 'molt', line: '*molts* new shell, who dis?' },
  { name: 'cousin', line: 'oh hi, tiny cousin.' },
  { name: 'pearl', line: 'ooh, a pearl. mine.' },
  { name: 'tide', line: "whoa, tide's in!" },
  { name: 'rain', line: 'oh, rain. good thing I brought this.', when: ['morning', 'midday', 'afternoon'] },
]

// What `/pet trick` can get.
const TRICKS: readonly [EmoteName, string][] = [
  ['dance', 'ta-da! ♪'],
  ['sixseven', 'six… seven…'],
  ['hop', 'boing! boing!'],
  ['wave', '*waves both claws*'],
  ['sidestep', 'the sideways shuffle.'],
  ['wiggle', '*wiggle wiggle*'],
  ['bow', '*takes a bow*'],
  ['uwu', 'UwU'],
  ['spin', '*spins* wheee!'],
]

const TREATED = ['*crunch* my favourite.', 'a treat? for me?', '*nom nom nom*', 'shrimp-flavoured. nice.']

const PETTED: readonly [EmoteName, string][] = [
  ['hop', 'ooh! ooh!'],
  ['hop', 'again! again!'],
  ['wiggle', '*happy wiggle*'],
  ['blush', 'aw, stop it.'],
  ['shy', 'eep!'],
  ['bow', 'you may continue.'],
  ['dance', 'pet-induced crab rave.'],
  ['uwu', 'UwU'],
]

const HAPPY_EYED: readonly EmoteName[] = ['hearts', 'hop', 'blush', 'golden', 'milestone', 'bow', 'molt', 'pearl', 'party', 'treat', 'sing', 'spin']
const CLAWS_RAISED: readonly EmoteName[] = ['sunbathe', 'golden', 'milestone', 'hearts', 'pearl', 'meditate', 'stretch']

// Every emote, so `/pet <name>` can show one on demand.
export const EMOTE_NAMES: readonly EmoteName[] = [
  'wave', 'dance', 'bubbles', 'sidestep', 'peek', 'snack', 'sunbathe', 'shades', 'glasses', 'stargaze', 'wish', 'yawn',
  'hearts', 'hop', 'wiggle', 'blush', 'shy', 'bow', 'golden', 'enough', 'milestone', 'sixseven',
  'seagull', 'molt', 'cousin', 'pearl', 'tide', 'party', 'treat', 'meditate', 'uwu',
  'stretch', 'facepalm', 'squish', 'rain', 'hiccup', 'fish', 'juggle', 'castle',
  'sing', 'vibe', 'chef', 'hardhat', 'cry', 'spin', 'dizzy',
]

// Sung until the day's songbook is written, or when it can't be: original parodies.
export const STARTER_SONGS = [
  'mama, oooooo… I broke the build ♪',
  'is this the real life? is this just fantasy? ♪',
  'we will, we will rock you ♪',
  "don't stop me now, I'm having such a good time ♪",
  'another one bites the dust ♪',
  'under pressuuure, pushing down on me ♪',
  'we met as soulmates on Parris Island ♪',
  'and we would all go down together ♪',
  'remember Charlie, remember Baker ♪',
  'and so it iiis, just like you said ♪',
  "I can't take my eyes off of you ♪",
  'stones taught me to fly ♪',
  'I became a connoisseur of great excuse ♪',
  'I am waking up ♪',
  'Amie, come sit on my wall and read me the story of O ♪',
  'nothing unusual, nothing strange ♪',
  "I'll follow you into the dark ♪",
  'they will see us waving from such great heights ♪',
  'those were the best days of my life ♪',
  "please forgive me, I can't stop loving you ♪",
  "nothing's gonna change my love for you ♪",
  'near, far, wherever you are ♪',
  'every night in my dreams ♪',
  'welcome to the Hotel California ♪',
  'you can check out any time you like ♪',
  "there's a lady who's sure all that glitters is gold ♪",
  'nothing lasts forever, even cold November rain ♪',
  'in sleep he sang to me, in dreams he came ♪',
  'that voice which calls to me and speaks my name ♪',
  'sing once again with me our strange duet ♪',
]

// A songbook with one starter song woven in after every nine of its lines, so the built-in songs
// turn up now and then (one in ten) without crowding out the book's own. The starters are taken
// spread out through their list, not in order.
export function withStarters(book: readonly string[]): string[] {
  const mixed: string[] = []
  book.forEach((line, at) => {
    mixed.push(line)
    if ((at + 1) % 9 === 0) {
      mixed.push(STARTER_SONGS[(((at + 1) / 9) * 7) % STARTER_SONGS.length]!)
    }
  })

  return mixed
}

// What you've been playing, from Last.fm's replies (parsed JSON), as a grouped list for the songbook
// prompt: the latest plays first, then this week's repeats, artists, a few all-time favourites; ''
// when they hold nothing.
export function tasteFrom(artists: unknown, weekTracks: unknown, recentPlays: unknown = undefined, allTimeTracks: unknown = undefined): string {
  const list = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value) ? value.filter((one): one is Record<string, unknown> => typeof one === 'object' && one !== null) : []
  const text = (value: unknown) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined)
  const song = (title: unknown, by: unknown) => {
    const name = text(title)
    const singer = text(by)
    return name !== undefined && singer !== undefined ? `${name} by ${singer}` : name
  }
  const singers = list((artists as { topartists?: { artist?: unknown } } | undefined)?.topartists?.artist)
    .map(one => text(one.name))
    .slice(0, 5)
  const topSongs = (tracks: unknown) =>
    list((tracks as { toptracks?: { track?: unknown } } | undefined)?.toptracks?.track).map(one => song(one.name, (one.artist as { name?: unknown } | undefined)?.name))
  // The latest plays, what was played more than once first, then the newest of the rest.
  const plays = list((recentPlays as { recenttracks?: { track?: unknown } } | undefined)?.recenttracks?.track).map(one =>
    song(one.name, (one.artist as { '#text'?: unknown; name?: unknown } | undefined)?.['#text'] ?? (one.artist as { name?: unknown } | undefined)?.name),
  )
  const counts = new Map<string, number>()
  for (const one of plays) if (one !== undefined) counts.set(one, (counts.get(one) ?? 0) + 1)
  const newest = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || plays.indexOf(a) - plays.indexOf(b)).slice(0, 6)
  const seen = new Set<string>(newest)
  const fresh = (songs: (string | undefined)[], most: number) => {
    const kept = songs.filter((one): one is string => one !== undefined && !seen.has(one)).slice(0, most)
    for (const one of kept) seen.add(one)
    return kept
  }
  const week = fresh(topSongs(weekTracks), 6)
  const allTime = fresh(topSongs(allTimeTracks), 3)
  const groups = [
    ['newest plays, most repeated first', newest],
    ["this week's repeats", week],
    ['artists lately', singers.filter((one): one is string => one !== undefined)],
    ['all-time favourites', allTime],
  ] as const

  return groups
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => `${label}: ${items.join(', ')}`)
    .join('. ')
}

// The songbook prompt's version: a songbook written by an older prompt is written again.
export const SONGBOOK_STYLE = 7

// What Claude is asked for the songbook: lines actually sung in the songs of `music`, each from
// the line's start, most sung as is and about one in four carried on into code.
export function songbookPrompt(music: string): string {
  return [
    "Write 12 short lines for Clawd, a tiny crab who lives in a programmer's terminal, to sing.",
    `Use songs by these artists, or these songs: ${music}. A different song for each line where you can.`,
    'Each line is a line of a song, taken from its start, never from the middle: the whole line, never',
    "cut off where it loses its sense, only words the singer actually sings and never a title the song",
    "doesn't sing. Most lines are only that, sung as the song sings it, e.g. \"where do i",
    'begiiin" or "and so it iiis". About one line in four carries the sung words on into code (bugs,',
    'builds, tests, git) or crab life, keeping its rhythm, e.g. "before you go… run the linter"; vary',
    'the jokes, never the same one twice. Never make up words and pass them off as the song\'s: if',
    "unsure of a song's opening, sing another of its lines you know word for word, from its start.",
    'If the list is grouped, lean on the newest plays and this week\'s repeats, and use an all-time',
    'favourite now and then.',
    'Never join two lines of a song; at most 12 words a line; lowercase;',
    'stretch a vowel in some ("ooooh"). One line each, no numbering, no quotes, no commentary.',
  ].join('\n')
}

// The sung lines in Claude's reply: numbering, bullets and quotes stripped, odd lengths and
// repeats dropped.
export function songbookLines(reply: string): string[] {
  const lines = reply
    .split('\n')
    .map(line => line.trim().replace(/^(\d+[.)]|[-*•])\s*/, '').replace(/^["“']|["”']$/g, '').trim())
    .filter(line => line.length >= 6 && line.length <= 72)
    .map(line => (line.includes('♪') ? line : `${line} ♪`))

  return [...new Set(lines)].slice(0, 20)
}

// Karaoke: how much of a sung `line` shows `elapsed` ms into the song, a few letters a frame.
export function sungSoFar(line: string, elapsed: number, frameMs: number): string {
  const letters = [...line]
  return letters.slice(0, Math.min(letters.length, 10 + Math.floor(elapsed / frameMs) * 8)).join('')
}

// What Clawd does once you've been away long enough to doze: sleep, or a pastime.
export type Pastime = 'sleep' | 'fish' | 'juggle' | 'castle' | 'vibe'
const PASTIMES: readonly Pastime[] = ['sleep', 'fish', 'juggle', 'castle', 'vibe']
// A pastime lasts this long from when you left; then Clawd falls asleep anyway.
const PASTIME_MS = 25 * 60 * 1000
// How Clawd greets you back from each.
const WELCOME: Readonly<Record<Pastime, [EmoteName, string]>> = {
  sleep: ['stretch', "*stretch* oh, you're back!"],
  fish: ['wave', "oh hi! the fish weren't biting."],
  juggle: ['wave', 'oh hi! *drops everything*'],
  castle: ['castle', 'oh hi! look, a castle.'],
  vibe: ['wave', 'oh hi! *takes off headphones*'],
}
// Fishing: a catch comes in the last FISH_BITE frames of every FISH_CYCLE.
const FISH_CYCLE = 30
const FISH_BITE = 5
const CATCHES: readonly { text: string; color: string; line: string }[] = [
  { text: '><>', color: GOLD, line: 'caught a fish!' },
  { text: '▙', color: SHELL, line: 'a boot. again.' },
  { text: '●', color: PEARL, line: 'ooh, a pearl!' },
  { text: '§', color: '#7fb77e', line: 'seaweed. yum.' },
]

// Listening to music while you're away: a VIBE_CYCLE of nodding along, singing from VIBE_SINGS_AT.
const VIBE_CYCLE = 40
const VIBE_SINGS_AT = 25

// Whether a frame of the music pastime is one where Clawd sings along.
export const isVibeSinging = (frame: number) => frame % VIBE_CYCLE >= VIBE_SINGS_AT

// What Clawd does after you left at `leftAt`: it sleeps at night; by day it picks a pastime for
// the whole stretch (fixed by when you left), and sleeps once PASTIME_MS has gone by.
export function pastimeOf(leftAt: number, now: number, local: Local): Pastime {
  if (phaseOf(local.hour) === 'night' || now - leftAt > PASTIME_MS) return 'sleep'

  return PASTIMES[Math.floor(leftAt / 1000) % PASTIMES.length]!
}

// What Clawd says while at a pastime; `castle` counts today's finished turns.
export function pastimeLine(pastime: Pastime, frame: number, castle: number, songs: readonly string[] = []): string {
  switch (pastime) {
    case 'vibe': {
      const song = songs[Math.floor(frame / VIBE_CYCLE) % Math.max(1, songs.length)]
      return isVibeSinging(frame) && song !== undefined
        ? sungSoFar(song, (frame % VIBE_CYCLE) - VIBE_SINGS_AT, 1)
        : '♪ *vibing* ♪'
    }
    case 'fish':
      return frame % FISH_CYCLE >= FISH_CYCLE - FISH_BITE
        ? (CATCHES[Math.floor(frame / FISH_CYCLE) % CATCHES.length]?.line ?? 'a bite!')
        : 'fishing… shh.'
    case 'juggle':
      return "juggling. don't distract me."
    case 'castle':
      return castle === 0 ? 'building a sandcastle.' : `sandcastle: ${castle} ${castle === 1 ? 'turn' : 'turns'} tall.`
    default:
      return 'z z z'
  }
}

// The emote and line that greet you back from a pastime.
export const welcomeOf = (pastime: Pastime): [EmoteName, string] => WELCOME[pastime]

// Minutes east of UTC from text like "+05:30" or "-8"; 0 when unreadable.
export function parseOffset(text: string): number {
  const match = /^([+-])?(\d{1,2})(?::?(\d{2}))?$/.exec(text.trim())
  if (match === null) {
    return 0
  }
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0)

  return match[1] === '-' ? -minutes : minutes
}

export function localTime(nowMs: number, offsetMinutes: number): Local {
  const at = new Date(nowMs + offsetMinutes * 60_000)

  return {
    hour: at.getUTCHours() + at.getUTCMinutes() / 60,
    weekday: at.getUTCDay(),
    month: at.getUTCMonth() + 1,
    day: at.getUTCDate(),
  }
}

export function phaseOf(hour: number): Phase {
  if (hour < 5) return 'night'
  if (hour < 7) return 'dawn'
  if (hour < 11) return 'morning'
  if (hour < 14) return 'midday'
  if (hour < 17) return 'afternoon'
  if (hour < 19) return 'dusk'
  if (hour < 23) return 'evening'

  return 'night'
}

// Tonight's moon, from its age in the synodic month.
export function moonOf(nowMs: number): { glyph: string; isFull: boolean } {
  const days = (nowMs - NEW_MOON_MS) / 86_400_000
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS
  if (age < 1.85 || age >= 27.68) return { glyph: '○', isFull: false }
  if (age < 13.77) return { glyph: '☽', isFull: false }
  if (age < 15.76) return { glyph: '●', isFull: true }

  return { glyph: '☾', isFull: false }
}

// An idle emote that suits the time of day, picked by `rand` in [0, 1): now and then a rare one.
export function pickIdle(phase: Phase, rand: number): { name: EmoteName; line: string } {
  const suits = (one: { when?: readonly Phase[] }) => one.when === undefined || one.when.includes(phase)
  if (rand < RARE_CHANCE) {
    const rare = RARE.filter(suits)

    return rare[Math.floor((rand / RARE_CHANCE) * rare.length)] ?? RARE[1]!
  }
  const fits = IDLE.filter(suits)

  return fits[Math.floor(((rand - RARE_CHANCE) / (1 - RARE_CHANCE)) * fits.length)] ?? IDLE[0]!
}

// A trick for `/pet trick`, picked by `rand` in [0, 1).
export function pickTrick(rand: number): [EmoteName, string] {
  return TRICKS[Math.floor(rand * TRICKS.length)] ?? TRICKS[0]!
}

// What Clawd says to its `treats`th treat.
export function treatLine(treats: number, rand: number): string {
  if (treats % 10 === 0) return `treat #${treats}. spoiled crab.`

  return TREATED[Math.floor(rand * TREATED.length)] ?? TREATED[0]!
}

// How Clawd takes a pet: `recent` counts pets in the last few seconds.
export function pickPetted(pets: number, recent: number, rand: number): [EmoteName, string] {
  if (recent >= PET_SPREE) return ['enough', 'ok ok, I get it.']
  if (pets % 25 === 0) return ['milestone', `pet #${pets}! a milestone.`]
  if (rand < 0.05) return ['golden', 'a golden pet! lucky you.']

  return PETTED[Math.floor(((rand - 0.05) / 0.95) * PETTED.length)] ?? PETTED[0]!
}

// Minutes past midnight from a wall-clock time like "17:30"; undefined when unreadable.
export function parseClock(text: string): number | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim())
  const minutes = match === null ? NaN : Number(match[1]) * 60 + Number(match[2])

  return minutes < 24 * 60 ? minutes : undefined
}

// What Clawd says about leave time on a workday, from an hour before it to two hours after;
// `moment` is idle muttering, a new prompt, or a finished turn.
export function leaveLine(local: Local, leaveAt: number | undefined, moment: 'idle' | 'prompt' | 'done'): string | undefined {
  if (leaveAt === undefined || local.weekday === 0 || local.weekday === 6) return undefined
  const left = leaveAt - Math.round(local.hour * 60)
  if (left > 60 || left <= -120) return undefined
  const at = `${Math.floor(leaveAt / 60) % 12 || 12}:${String(leaveAt % 60).padStart(2, '0')}`
  if (moment === 'prompt') return left <= 0 ? `past ${at}? one more, then home.` : undefined
  if (moment === 'done') return left <= 0 ? 'done. now go home.' : left <= 15 ? `done, with ${left} min to spare.` : undefined
  if (left > 15) return `${left} min till ${at}.`
  if (left > 0) return `${left} min to ${at}. commit something?`
  if (left > -15) return `${at}! shoo, go home.`

  return `weren't you leaving at ${at}?`
}

// Away this long, the person has had a break: the next stretch of work starts over.
export const BREAK_RESET_MS = 10 * 60_000
// After suggesting a break that was not taken, Clawd asks again this much later.
export const BREAK_SNOOZE_MS = 20 * 60_000

// A stretch of work: when it began, when the person was last seen, and when Clawd last suggested a break.
export type Sitting = { since: number; lastSeen: number; nudgedAt: number }

// Minutes from a setting like `50`; undefined for empty, `0`, `off` or nonsense.
export function parseMinutes(text: string): number | undefined {
  const minutes = Number(text.trim())

  return text.trim() !== '' && Number.isFinite(minutes) && minutes > 0 ? minutes : undefined
}

// The stretch of work after the person shows up at `now`: a fresh one if they had been away a while.
export function satAt(sitting: Sitting, now: number): Sitting {
  return now - sitting.lastSeen >= BREAK_RESET_MS ? { since: now, lastSeen: now, nudgedAt: 0 } : { ...sitting, lastSeen: now }
}

// What Clawd says to suggest a break, once `every` minutes of work are in and not again until the snooze is up.
export function breakLine(sitting: Sitting, now: number, every: number | undefined): string | undefined {
  if (every === undefined || now - sitting.lastSeen >= BREAK_RESET_MS) return undefined
  const minutes = Math.floor((now - sitting.since) / 60_000)
  if (minutes < every || (sitting.nudgedAt !== 0 && now - sitting.nudgedAt < BREAK_SNOOZE_MS)) return undefined
  const time = minutes >= 90 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`

  return sitting.nudgedAt === 0 ? `${time} in. stretch break?` : `${time} now. stretch with me?`
}

// What Clawd mutters when nothing else is going on.
export function ambient(local: Local, nowMs: number, leaveAt: number | undefined): string {
  const { month, day, weekday, hour } = local
  const phase = phaseOf(hour)
  if (month === 10 && day === 31) return 'boo. spooky shell.'
  if (month === 12 && day === 25) return 'merry crabmas.'
  if (month === 1 && day === 1) return 'new year, new shell.'
  const leaving = leaveLine(local, leaveAt, 'idle')
  if (leaving !== undefined) return leaving
  if ((phase === 'night' || phase === 'evening') && moonOf(nowMs).isFull) return 'full moon. crab rave?'
  if (weekday === 1 && phase === 'morning') return 'monday. ugh.'
  if (weekday === 5 && (phase === 'afternoon' || phase === 'dusk')) return "it's friday. no deploys."

  switch (phase) {
    case 'night':
      return "it's late, you know."
    case 'dawn':
      return 'early bird.'
    case 'morning':
      return 'gm.'
    case 'midday':
      return 'too bright.'
    case 'dusk':
      return 'nice sunset.'
    default:
      return ''
  }
}

// Clawd's faces: its eyes along the face row, and anything either side of it past its edges.
export type Face =
  | 'open'
  | 'up'
  | 'happy'
  | 'shut'
  | 'heavy'
  | 'smug'
  | 'wince'
  | 'surprised'
  | 'love'
  | 'dizzy'
  | 'uwu'
  | 'facepalm'
  | 'glasses'
  | 'shades'

type Look = { eyes: Segment[]; rims?: [Segment, Segment] }

// Eyes drawn as dark marks on the face, `between` the two, so any shape stays visible.
const marks = (body: string, left: string, right: string, color = SHADES, between: Segment[] = [{ text: '███', color: body }]): Look => ({
  eyes: [
    { text: '▐', color: body },
    { text: left, color, backgroundColor: body },
    ...between,
    { text: right, color, backgroundColor: body },
    { text: '▌', color: body },
  ],
})

const FACES: Readonly<Record<Face, (body: string) => Look>> = {
  open: body => ({ eyes: [{ text: EYES, color: body }] }),
  up: body => ({ eyes: [{ text: EYES_UP, color: body }] }),
  happy: body => ({ eyes: [{ text: EYES_HAPPY, color: body }] }),
  shut: body => marks(body, '─', '─'),
  // Unimpressed: heavy lids.
  heavy: body => marks(body, '▀', '▀'),
  // Lids half down, looking off to the side.
  smug: body => marks(body, '¬', '¬'),
  // Squeezed shut: > <.
  wince: body => marks(body, '>', '<'),
  surprised: body => marks(body, 'O', 'O'),
  love: body => marks(body, '♥', '♥', HEART_EYES),
  // Seeing stars.
  dizzy: body => marks(body, '×', '×'),
  uwu: body =>
    marks(body, 'U', 'U', SHADES, [
      { text: '█', color: body },
      { text: 'w', color: SHADES, backgroundColor: body },
      { text: '█', color: body },
    ]),
  // One claw over the right eye.
  facepalm: body => ({
    eyes: [
      { text: '▐', color: body },
      { text: '─', color: SHADES, backgroundColor: body },
      { text: '██', color: body },
      { text: '▟█', color: COUSIN },
      { text: '▌', color: body },
    ],
  }),
  // Big reading glasses: a frame round each of its own eyes, joined by a bridge. The face keeps
  // its own edges, so the head is no bigger; the outer rims stick out past them, wider than the face.
  glasses: body => {
    const rim = (text: string): Segment => ({ text, color: SHADES, backgroundColor: body })
    return {
      eyes: [{ text: '▐▛', color: body }, rim(FRAMES[1]), rim('─'), rim(FRAMES[0]), { text: '▜▌', color: body }],
      rims: [
        { text: FRAMES[0], color: GLASSES },
        { text: FRAMES[1], color: GLASSES },
      ],
    }
  },
  // Sunglasses: two dark lenses joined by a bridge along the top.
  shades: body => ({
    eyes: [
      { text: '▐', color: body },
      { text: '██▀██', color: SHADES, backgroundColor: body },
      { text: '▌', color: body },
    ],
  }),
}

// Emotes that wear a face of their own; anything not here falls to Clawd's mood.
const EMOTE_FACES: Partial<Readonly<Record<EmoteName, Face>>> = {
  enough: 'heavy',
  uwu: 'uwu',
  cry: 'shut',
  facepalm: 'facepalm',
  glasses: 'glasses',
  sunbathe: 'shades',
  shades: 'shades',
  hearts: 'love',
  bow: 'smug',
  golden: 'smug',
  seagull: 'surprised',
  tide: 'surprised',
  dizzy: 'dizzy',
  stargaze: 'up',
  wish: 'up',
  juggle: 'up',
  rain: 'up',
}

// Which face Clawd wears for its mood and what it is acting out; `isShut` when its pose shuts its eyes.
export function faceOf(kind: Kind, emote: EmoteName | undefined, frame: number, isShut = false): Face {
  if (isShut) return 'shut'
  const own = emote === undefined ? undefined : EMOTE_FACES[emote]
  if (own !== undefined) return own
  if (emote === 'peek') return frame % 2 === 0 ? 'up' : 'open'
  // Each hic gives it a start.
  if (emote === 'hiccup' && frame % 3 === 0) return 'surprised'
  if (emote !== undefined && HAPPY_EYED.includes(emote)) return 'happy'
  if (kind === 'oops') return 'wince'
  if (kind === 'love') return 'love'
  if (kind === 'happy') return 'happy'
  if (kind === 'read') return 'glasses'
  if (kind === 'think') return 'up'
  // A blink now and then while nothing is going on.
  if (kind === 'idle' && emote === undefined && frame % BLINK_EVERY === 0) return 'shut'
  return 'open'
}

// The sky over Clawd and Clawd under it: four rows of colored segments.
export function clawdScene(input: {
  kind: Kind
  emote: EmoteName | undefined
  frame: number
  nowMs: number
  local: Local
  // Subagents out on a task: tiny cousins march by for them.
  crew?: number
  // A long turn: Clawd sweats.
  isSweating?: boolean
  // Wearing headphones, as while vibing and singing along after.
  hasHeadphones?: boolean
  // How far a thought bubble has grown during long thinking, 0 to 3.
  bubble?: number
  // Today's finished turns, the height of the sandcastle.
  castle?: number
  // Frames since the current pose began, so a pose with moves of its own starts from the top.
  poseFrame?: number
}): Row[] {
  const { kind, emote, frame, nowMs, local, crew = 0, isSweating = false, bubble = 0, castle = 0, hasHeadphones = false } = input
  const poseFrame = input.poseFrame ?? frame
  const phase = phaseOf(local.hour)
  const isBusy = BUSY.includes(kind)
  const isAsleep = kind === 'sleep'
  const body = isAsleep ? SLEEPY_CLAWD : CLAWD

  let dx = 0
  if (emote === 'sidestep') dx = SIDESTEP[frame % SIDESTEP.length] ?? 0
  else if (emote === 'wiggle') dx = WIGGLE[frame % WIGGLE.length] ?? 0
  else if (emote === 'dance' || emote === 'party' || emote === 'dizzy' || kind === 'oops') dx = frame % 2
  // Nodding along, a beat every two frames.
  else if (emote === 'vibe') dx = Math.floor(frame / 2) % 2
  const x = BASE + dx

  const sky: Segment[] = Array.from({ length: SKY }, () => ({ text: ' ' }))
  const put = (at: number, text: string, color: string) => {
    if (at >= 0 && at < SKY) {
      sky[at] = { text, color }
    }
  }

  // The sun crosses from 6:00 to 18:00, the moon from 18:00 to 6:00.
  const hour = local.hour
  if (hour >= 6 && hour < 18) {
    const isLow = hour < 7.5 || hour >= 16.5
    put(Math.round(((hour - 6) / 12) * (SKY - 1)), '☀', isLow ? LOW_SUN : SUN)
  } else {
    for (const [i, at] of [1, 4, 8, 11, 15].entries()) {
      put(at, (frame + i * 3) % 11 === 0 ? '✧' : '·', MOON)
    }
    const moon = moonOf(nowMs)
    put(Math.round((((hour - 18 + 24) % 24) / 12) * (SKY - 1)), moon.glyph, moon.isFull ? FULL_MOON : MOON)
  }

  if (emote === 'hearts' || emote === 'blush' || emote === 'treat') {
    put(frame % 2 === 0 ? x + 2 : x + 6, '♥', HEART)
  } else if (emote === 'golden' || emote === 'milestone') {
    for (const [i, at] of [x, x + 4, x + 8].entries()) {
      put(at, (frame + i) % 2 === 0 ? '✦' : '·', GOLD)
    }
  } else if (emote === 'wish') {
    const at = SKY - 1 - ((frame * 3) % (SKY + 3))
    put(at, '✦', GOLD)
    put(at + 1, '─', MOON)
    put(at + 2, '·', MOON)
  } else if (emote === 'bubbles') {
    put(x + 9, frame % 2 === 0 ? '°' : 'o', MOON)
  } else if (emote === 'seagull') {
    put(((frame * 2) % (SKY + 4)) - 2, frame % 2 === 0 ? 'v' : '‿', GULL)
  } else if (emote === 'pearl') {
    put(x + 10, frame % 2 === 0 ? '✧' : '·', GOLD)
  } else if (emote === 'party') {
    for (let at = 0; at < SKY; at++) {
      if ((at * 7 + frame * 3) % 4 === 0) {
        const [text, color] = CONFETTI[(at + frame) % CONFETTI.length]!
        put(at, text, color)
      }
    }
  } else if (emote === 'sixseven') {
    // 6 over the raised left claw, 7 over the raised right one.
    put(frame % 2 === 0 ? x : x + 8, frame % 2 === 0 ? '6' : '7', GOLD)
  } else if (emote === 'rain') {
    // A shower everywhere but on the umbrella Clawd holds up off to its right.
    for (let at = 0; at < SKY; at++) {
      if ((at + frame) % 2 === 0) put(at, "'", WATER)
    }
    for (const [i, text] of [...'▗▟█▙▖'].entries()) put(x + 8 + i, text, HEART)
  } else if (emote === 'sing') {
    // Notes drift off to the right as Clawd sings.
    put(x + 9 + (frame % 3), frame % 2 === 0 ? '♪' : '♫', GOLD)
    put(x + 12 + ((frame + 1) % 3), frame % 2 === 0 ? '♫' : '♪', HEART)
  } else if (emote === 'chef') {
    // A white chef's hat over Clawd's head: a wide puff on top of a thin band.
    for (const [i, text] of [...'▀▀███▀▀'].entries()) put(x + 1 + i, text, TOQUE)
  } else if (emote === 'hardhat') {
    // A yellow hard hat over Clawd's head.
    for (const [i, text] of [...'▗▄▄▄▖'].entries()) put(x + 2 + i, text, GOLD)
  } else if (emote === 'dizzy') {
    // Stars going round over its head, a big one and a small one across from it.
    const orbit = [x + 1, x + 3, x + 5, x + 7, x + 5, x + 3]
    put(orbit[frame % orbit.length]!, '✦', GOLD)
    put(orbit[(frame + 3) % orbit.length]!, '·', GOLD)
  } else if (emote === 'juggle') {
    // Two of three pearls in the air, going round.
    const spots = [x + 1, x + 4, x + 7]
    put(spots[frame % 3]!, '●', PEARL)
    put(spots[(frame + 1) % 3]!, '●', PEARL)
  }
  if (isSweating) put(x + 8, frame % 3 === 2 ? ',' : '’', WATER)
  for (const [i, text] of ['·', '∘', '○'].slice(0, bubble).entries()) put(x + 9 + i, text, MOON)

  const isShut =
    isAsleep || emote === 'meditate' || emote === 'vibe' || ((emote === 'yawn' || emote === 'stretch') && frame % 4 < 2)
  const { eyes, rims } = FACES[faceOf(kind, emote, frame, isShut)](body)

  let claws = CLAWS_DOWN
  if (emote === 'wave' || emote === 'sixseven' || emote === 'cousin') claws = frame % 2 === 0 ? WAVE_LEFT : WAVE_RIGHT
  else if (emote === 'facepalm') claws = WAVE_RIGHT
  // Unimpressed claws hang still; bowing ones fold low.
  else if (emote === 'enough') claws = CLAWS_DOWN
  else if (emote === 'bow') claws = CLAWS_REST
  // Stirring the pot, or hammering away.
  else if (emote === 'chef') claws = frame % 2 === 0 ? WAVE_LEFT : CLAWS_DOWN
  else if (emote === 'hardhat') claws = frame % 2 === 0 ? WAVE_RIGHT : CLAWS_DOWN
  else if (emote === 'juggle' || emote === 'sing') claws = frame % 2 === 0 ? WAVE_LEFT : WAVE_RIGHT
  else if (emote === 'castle') claws = frame % 2 === 0 ? WAVE_RIGHT : CLAWS_DOWN
  else if (emote === 'dance' || emote === 'hop' || emote === 'party' || isBusy) claws = frame % 2 === 0 ? CLAWS_UP : CLAWS_DOWN
  else if (kind === 'happy' || kind === 'love' || (emote !== undefined && CLAWS_RAISED.includes(emote))) claws = CLAWS_UP

  const isStepping = isBusy || emote === 'dance' || emote === 'party' || emote === 'sidestep' || emote === 'wiggle'
  const legs = isStepping && frame % 2 === 1 ? LEGS_STEP : LEGS

  // A mark beside the face: snoring, music, surprise.
  let mark: Segment | undefined
  if (emote === 'fish' || emote === 'castle') mark = undefined
  else if (isAsleep) mark = { text: frame % 2 === 0 ? 'z' : 'Z', color: MOON }
  else if (emote === 'dance') mark = { text: frame % 2 === 0 ? '♪' : '♫', color: HEART }
  else if (emote === 'shy' || emote === 'seagull' || (emote === 'hop' && frame % 2 === 0)) mark = { text: '!', color: GOLD }
  else if (emote === 'peek') mark = { text: '?', color: GOLD }
  else if (emote === 'enough') mark = { text: '…', color: MOON }
  else if (emote === 'uwu') mark = { text: '♡', color: HEART }
  else if (emote === 'bubbles') mark = { text: frame % 2 === 0 ? 'o' : '°', color: MOON }
  else if (emote === 'hiccup' && frame % 3 === 0) mark = { text: 'hic!', color: GOLD }
  else if (emote === 'sing') mark = { text: frame % 2 === 0 ? '♪' : '♫', color: HEART }
  else if (emote === 'cry') mark = { text: frame % 2 === 0 ? '‚' : '¸', color: WATER }

  const pad = (n: number): Segment => ({ text: ' '.repeat(Math.max(0, n)) })
  // Adds `part` to the end of `row` after up to `gap` spaces, closing the gap so the row stays
  // within the sky's width; leaves the row as it is when even no gap would not fit.
  const append = (row: Row, gap: number, part: Segment): Row => {
    const used = row.reduce((cells, one) => cells + [...one.text].length, 0)
    const room = SKY - used - [...part.text].length
    return room < 0 ? row : [...row, pad(Math.min(gap, room)), part]
  }
  let face: Row =
    rims === undefined
      ? [pad(x + 1), ...eyes, ...(mark === undefined ? [] : [pad(1), mark])]
      : [pad(x), rims[0], ...eyes, rims[1], ...(mark === undefined ? [] : [mark])]
  if (hasHeadphones || emote === 'vibe') {
    // The cups sit where the glasses' outer rims would.
    // The band over Clawd's head in the sky row, a cup at each side of its face.
    for (const [i, text] of [...'╭─────╮'].entries()) put(x + 1 + i, text, PHONES)
    face = [pad(x), { text: '█', color: PHONES }, ...eyes, { text: '█', color: PHONES }, ...(mark === undefined ? [] : [mark])]
  }
  // Beside the claws: a crumb, the shell it just left, a pearl.
  let held: Segment[] = []
  if (emote === 'snack' || emote === 'treat') held = [{ text: '·', color: GOLD }]
  else if (emote === 'molt') held = [pad(1), { text: '▟▀▙', color: SHELL }]
  else if (emote === 'pearl') held = [pad(1), { text: '●', color: PEARL }]
  let arms: Row = [pad(x), { text: claws, color: body }, ...held]

  let feet: Row = [pad(x), { text: legs, color: body }]
  if (emote === 'tide') {
    // The water washes over Clawd's feet, rolling one cell a frame.
    feet = [{ text: Array.from({ length: SKY }, (_, at) => ((at + frame) % 3 === 0 ? '≈' : '~')).join(''), color: WATER }]
  } else if (emote === 'molt') {
    feet = [...feet, pad(1), { text: '▘ ▝', color: SHELL }]
  } else if (emote === 'cousin') {
    // A tiny cousin scuttles in from the right.
    feet = append(feet, 6 - (frame % 7), { text: frame % 2 === 0 ? '▞▚' : '▚▞', color: COUSIN })
  } else if (emote === 'fish') {
    // A rod from the right claw up to its tip, the line dropping into the water to a bobber;
    // near the end of each cycle something comes up on the line.
    const bite = frame % FISH_CYCLE >= FISH_CYCLE - FISH_BITE
    const caught = CATCHES[Math.floor(frame / FISH_CYCLE) % CATCHES.length]!
    const hanging = [...caught.text].length === 1 ? ` ${caught.text}` : caught.text
    face = [...face, pad(2), { text: '╱', color: ROD }, bite ? { text: hanging, color: caught.color } : { text: '─╮', color: MOON }]
    arms = [...arms, { text: '╱', color: ROD }, pad(2), { text: '│', color: MOON }]
    feet = [...feet, pad(2), { text: bite ? '~~*~' : frame % 2 === 0 ? '~~◦~' : '~~•~', color: WATER }]
  } else if (emote === 'castle') {
    // The sandcastle grows with the day's turns: a mound, a wall, a tower, then towers and a flag.
    const wall = castle >= 3 ? [pad(2), { text: '▟██▙', color: SAND }] : [pad(3), { text: castle >= 1 ? '▟▙' : '▗▖', color: SAND }]
    feet = [...feet, ...wall]
    if (castle >= 10) arms = [...arms, pad(1), { text: '▐▌▐▌', color: SAND }]
    else if (castle >= 6) arms = [...arms, pad(2), { text: '▟▙', color: SAND }]
    if (castle >= 10) face = [...face, pad(3), { text: '⚑', color: HEART }]
  } else if (emote === 'rain') {
    // The umbrella's shaft comes down from the middle of its canopy and hooks into the right claw.
    face = [...face, pad(2), { text: '│', color: ROD }]
    arms = [...arms, { text: '─╯', color: ROD }]
  } else if (emote === 'spin') {
    // A quarter turn a frame: front, right side, back, left side. Side on, Clawd is narrower,
    // shows one eye and one claw, and trails a swoosh; from the back it has no eyes.
    const view = frame % 4
    if (view === 1) {
      face = [pad(x + 2), { text: '▐██▜▌', color: body }]
      arms = [pad(x + 1), { text: '≈', color: MOON }, { text: '▐████▙▖', color: body }]
      feet = [pad(x + 3), { text: '▘▝▘', color: body }]
    } else if (view === 2) {
      face = [pad(x + 1), { text: '▐█████▌', color: body }]
    } else if (view === 3) {
      face = [pad(x + 2), { text: '▐▛██▌', color: body }]
      arms = [pad(x), { text: '▗▟████▌', color: body }, { text: '≈', color: MOON }]
      feet = [pad(x + 3), { text: '▝▘▝', color: body }]
    }
  }
  if (crew > 0 && emote !== 'fish' && emote !== 'castle') {
    // A tiny cousin marches for each subagent out, two at most.
    feet = append(feet, 1 + (frame % 2), { text: (frame % 2 === 0 ? '▞▚' : '▚▞').repeat(Math.min(crew, 2)), color: COUSIN })
  }

  // Clawd ducks from shy moments and seagulls: only its face and claws show; a hopping or bowing one crouches every other frame.
  const isDucking = emote === 'shy' || emote === 'seagull' || ((emote === 'hop' || emote === 'bow') && frame % 2 === 1)

  if (emote === 'meditate') {
    // Floating down half a row a frame and back, from where Clawd's face and body stand.
    const down = FLOAT[poseFrame % FLOAT.length]!
    const isFilled = (px: number, py: number) => MEDITATING[py - down]?.[px - 2 * x] === '#'
    // The aura reaches a pixel out all round, two across as a pixel is half as wide as it is tall,
    // with its corners rounded off.
    const isAura = (px: number, py: number) =>
      !isFilled(px, py) &&
      [-1, 0, 1].some(dy => [-2, -1, 0, 1, 2].some(dx => (dy === 0 || Math.abs(dx) < 2) && isFilled(px + dx, py + dy)))
    const aura = AURA[Math.floor(poseFrame / 2) % AURA.length]!
    const eyes = MEDITATING_EYES.top + down
    // An odd pixel row's top edge runs through the middle of a cell; an even one's along a cell's top.
    const eyeRow = Math.floor(eyes / 2)
    const lid = eyes % 2 === 1 ? '─' : '▔'
    const cellAt = (r: number, c: number): Segment | undefined => {
      if (r === eyeRow && MEDITATING_EYES.cells.includes(c - x)) return { text: lid, color: SHADES, backgroundColor: body }
      const glyphOf = (has: (px: number, py: number) => boolean) => {
        const at = (dx: number, dy: number) => (has(2 * c + dx, 2 * r + dy) ? 1 : 0)
        return QUADRANTS[at(0, 0) * 8 + at(1, 0) * 4 + at(0, 1) * 2 + at(1, 1)]!
      }
      const glyph = glyphOf(isFilled)
      const glow = glyphOf(isAura)
      if (glyph !== ' ') return { text: glyph, color: body, ...(glow === ' ' ? {} : { backgroundColor: aura }) }
      return glow === ' ' ? undefined : { text: glow, color: aura }
    }
    // In the sky row the sun, moon and stars show through the aura; below it, runs of cells join up.
    const top = sky.map((cell, c) => {
      const glowing = cellAt(0, c)
      if (cell.text === ' ') return glowing ?? cell
      return glowing === undefined ? cell : { ...cell, backgroundColor: aura }
    })
    const below = [1, 2, 3].map(r => {
      const row: Row = []
      let gap = 0
      for (let c = 0; c < SKY; c++) {
        const cell = cellAt(r, c)
        const last = row[row.length - 1]
        if (cell === undefined) gap += 1
        else if (gap === 0 && last !== undefined && last.color === cell.color && last.backgroundColor === cell.backgroundColor) last.text += cell.text
        else {
          if (gap > 0) row.push(pad(gap))
          row.push(cell)
          gap = 0
        }
      }
      return row.length === 0 ? [pad(0)] : row
    })
    // Humming beside its face, right after the aura.
    below[eyeRow - 1]?.push({ text: HUM[poseFrame % HUM.length]!, color: MOON })

    return [top, ...below]
  }
  if (emote === 'squish') {
    // Flattened: face pressed down into a pancake.
    return [sky, [pad(0)], [pad(x), { text: '▟▛▀███▀▜▙', color: body }], [pad(x - 1), { text: '▀'.repeat(11), color: body }]]
  }
  if (emote === 'hiccup' && frame % 3 === 0) {
    // Each hic jumps Clawd up a row.
    return [face, arms, feet, [pad(0)]]
  }

  return isDucking ? [sky, [pad(0)], face, arms] : [sky, face, arms, feet]
}

// What a meditating Clawd says, `{calm}` in a spinner act.
export const CALM = [
  'ommm…',
  'one with the code…',
  'inhale… exhale…',
  'breathe in tabs, out spaces.',
  'finding inner peace…',
  'be the bug.',
  'clearing my cache…',
  'the build will pass. ommm.',
]

// The commands /pet takes, with what each does, for the typeahead.
const PET_COMMANDS: readonly [string, string][] = [
  ['treat', 'feed Clawd a treat'],
  ['trick', 'Clawd does a trick'],
  ['refresh-songs', 'forget the songbook and write a new one'],
  ['off', 'hide the pet until /pet on'],
  ['on', 'bring the pet back'],
  ['garden', 'switch to the garden'],
  ['clawd', 'switch to Clawd'],
  ['moss', 'switch to Moss'],
]

// Rows for the typeahead while an argument of /pet is being typed: the commands, and once a few
// letters are in, the emotes that start the same way. `draft` is the prompt up to the caret.
export function petSuggestions(draft: string): { text: string; description?: string }[] {
  const match = /^\/pet +(\S*)$/.exec(draft)
  if (match === null) return []
  const typed = match[1]!.toLowerCase()
  const commands = PET_COMMANDS.filter(([name]) => name.startsWith(typed)).map(([text, description]) => ({ text, description }))
  const emotes = typed === '' ? [] : EMOTE_NAMES.filter(name => name.startsWith(typed) && !PET_COMMANDS.some(([one]) => one === name)).map(text => ({ text }))

  return [...commands, ...emotes].filter(one => one.text !== typed)
}

// Clawd's scene as an SVG drawing, for the apps that draw pictures rather than a terminal's grid
// of characters: block glyphs as pixel rectangles, merged along each half row, and other glyphs as
// text, each placed in its own cell so no font can push them out of line.
export function sceneSvg(rows: readonly Row[], cell = { width: 8, height: 16 }): string {
  const { width: w, height: h } = cell
  const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const rect = (x: number, y: number, width: number, height: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`
  const parts: string[] = []
  let columns = 0
  rows.forEach((row, r) => {
    const cells = row.flatMap(part => [...part.text].map(ch => ({ ch, color: part.color ?? MOON, background: part.backgroundColor })))
    columns = Math.max(columns, cells.length)
    const y = r * h
    cells.forEach((one, c) => {
      if (one.background !== undefined) parts.push(rect(c * w, y, w, h, one.background))
    })
    // Each half row as pixels, two to a cell, then runs of one color as one rectangle.
    for (const half of [0, 1]) {
      const [left, right] = half === 0 ? [8, 4] : [2, 1]
      const pixels = cells.flatMap(one => {
        const bits = Math.max(0, QUADRANTS.indexOf(one.ch))
        return [bits & left ? one.color : undefined, bits & right ? one.color : undefined]
      })
      let start = 0
      pixels.forEach((color, at) => {
        if (color !== pixels[at + 1]) {
          if (color !== undefined) parts.push(rect((start * w) / 2, y + (half * h) / 2, ((at + 1 - start) * w) / 2, h / 2, color))
          start = at + 1
        }
      })
    }
    cells.forEach((one, c) => {
      const x = c * w
      if (one.ch === ' ' || QUADRANTS.includes(one.ch)) return
      if (one.ch === '▁') parts.push(rect(x, y + h - 2, w, 2, one.color))
      else if (one.ch === '▔') parts.push(rect(x, y, w, 2, one.color))
      else if (one.ch === '─') parts.push(rect(x, y + h / 2 - 1, w, 2, one.color))
      else if (one.ch === '│') parts.push(rect(x + w / 2 - 1, y, 2, h, one.color))
      else parts.push(`<text x="${x + w / 2}" y="${y + h * 0.75}" text-anchor="middle" fill="${one.color}">${escape(one.ch)}</text>`)
    })
  })
  const [width, height] = [columns * w, rows.length * h]

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
    `font-family="ui-monospace, Menlo, Consolas, monospace" font-size="${h * 0.8}">${parts.join('')}</svg>`
  )
}

// Clawd's take on the spinner's word while Claude works, per family of words: what it may do,
// each a pose with the line that goes with it, `{word}` standing for the word itself.
type Act = readonly [EmoteName | undefined, string]
type Family = { acts: readonly Act[]; words: readonly string[] }

const SPINNER_FAMILIES: readonly Family[] = [
  {
    acts: [
      ['snack', 'smells good. save me some.'],
      ['snack', 'is that for me?'],
      ['snack', '*sniff sniff*'],
      ['chef', 'chef claude in the kitchen.'],
      ['chef', 'needs more salt.'],
      ['chef', 'yes, chef!'],
      ['snack', 'I brought a fork.'],
    ],
    words: ['baking', 'blanching', 'brewing', 'bunning', 'caramelizing', 'churning', 'concocting', 'cooking', 'crunching', 'drizzling', 'fermenting', 'frosting', 'garnishing', 'infusing', 'kneading', 'leavening', 'marinating', 'proofing', 'sautéing', 'seasoning', 'simmering', 'stewing', 'tempering', 'whisking', 'zesting'],
  },
  {
    acts: [
      ['dance', '♪ joining in ♪'],
      ['dance', 'crab rave!'],
      ['sixseven', 'look at these moves.'],
      ['dance', 'claws in the air!'],
      ['dance', '{word}? say no more.'],
    ],
    words: ["beboppin'", 'boogieing', 'choreographing', 'frolicking', 'grooving', 'harmonizing', 'jitterbugging', 'shimmying', 'sock-hopping', 'twisting', 'undulating', 'vibing'],
  },
  {
    acts: [
      ['sidestep', 'I only go sideways.'],
      ['sidestep', 'wait up!'],
      ['sidestep', 'sideways is faster, trust me.'],
      ['sidestep', '{word}? I scuttle.'],
      ['sidestep', 'where are we going?'],
    ],
    words: ['catapulting', 'gallivanting', 'galloping', 'hyperspacing', 'levitating', 'meandering', 'moseying', 'perambulating', 'pouncing', 'scampering', 'schlepping', 'scurrying', 'skedaddling', 'slithering', 'swooping', 'wandering', 'warping', 'zigzagging'],
  },
  {
    acts: [
      ['meditate', '{calm}'],
      ['peek', 'shh. big brain at work.'],
      ['bubbles', 'blub… deep thoughts…'],
      ['meditate', '{calm}'],
      ['peek', 'thinking about shells…'],
      ['bubbles', 'blub… inner peace…'],
    ],
    words: ['cerebrating', 'cogitating', 'considering', 'contemplating', 'deciphering', 'deliberating', 'determining', 'elucidating', 'envisioning', 'ideating', 'imagining', 'inferring', 'mulling', 'philosophizing', 'pondering', 'puzzling', 'ruminating', 'thinking'],
  },
  {
    acts: [
      ['tide', 'the tide is turning.'],
      ['rain', 'feels like rain.'],
      ['bubbles', 'blub blub.'],
      ['bubbles', 'whoosh.'],
      ['bubbles', 'hold onto your shell.'],
    ],
    words: ['billowing', 'cascading', 'flowing', 'gusting', 'misting', 'nebulizing', 'osmosing', 'precipitating', 'swirling', 'thundering', 'whirring'],
  },
  {
    acts: [
      ['sunbathe', 'growing things. nice.'],
      ['sunbathe', 'a little sun, a little water.'],
      ['sunbathe', 'grow, little idea, grow.'],
      ['sunbathe', 'nature is healing.'],
    ],
    words: ['cultivating', 'germinating', 'incubating', 'nesting', 'photosynthesizing', 'pollinating', 'propagating', 'roosting', 'sprouting', 'symbioting', 'unfurling'],
  },
  {
    acts: [
      ['golden', 'ooh, magic.'],
      ['golden', '✦ sparkly ✦'],
      ['golden', 'abracadabra.'],
      ['golden', 'how did you do that?'],
      ['golden', "I'm not even surprised."],
    ],
    words: ['crystallizing', 'enchanting', 'ionizing', 'manifesting', 'metamorphosing', 'prestidigitating', 'quantumizing', 'razzle-dazzling', 'razzmatazzing', 'sublimating', 'transfiguring', 'transmogrifying', 'transmuting'],
  },
  {
    acts: [
      ['peek', 'is that even a word?'],
      ['peek', 'dictionary says no.'],
      ['uwu', "I'll allow it."],
      ['wiggle', 'sounds made up. love it.'],
      ['wiggle', '{word}? sure, why not.'],
      ['peek', 'say that five times fast.'],
      ['uwu', 'gesundheit.'],
    ],
    words: ['befuddling', 'boondoggling', 'combobulating', 'dilly-dallying', 'discombobulating', 'fiddle-faddling', 'finagling', 'flibbertigibbeting', 'flummoxing', 'hullaballooing', 'kerfuffling', 'lollygagging', 'recombobulating', 'shenaniganing', 'tomfoolering', 'topsy-turvying', 'whatchamacalliting', 'wibbling'],
  },
]

// Words that get lines of their own.
const SPINNER_SPECIALS: Readonly<Record<string, readonly Act[]>> = {
  clauding: [['uwu', 'UwU that is me.']],
  moonwalking: [['dance', 'crabs invented that. sideways.'], ['dance', 'hee-hee!']],
  waddling: [['sidestep', "that's a duck thing."], ['sidestep', 'quack?']],
  onioning: [['cry', '*cries in crab*'], ['cry', 'who is cutting onions?']],
  flambéing: [['shy', 'careful, my shell!'], ['shy', 'FIRE.']],
  julienning: [['shy', 'watch the claws.'], ['shy', 'not the claws!']],
  burrowing: [['shy', 'I know a good burrow.'], ['shy', 'dig dig dig.']],
  spelunking: [['shy', 'bring a torch.'], ['shy', 'echo… echo…']],
  hatching: [['sunbathe', 'crabs hatch too, you know.'], ['sunbathe', 'something is hatching!']],
  ebbing: [['tide', 'tide going out.']],
  bloviating: [['enough', 'less talking, more coding.'], ['enough', 'get to the point.']],
  pontificating: [['enough', 'less talking, more coding.'], ['bow', 'yes, professor.']],
  honking: [['wave', 'honk.'], ['wave', 'HONK.']],
  booping: [['uwu', 'boop.'], ['uwu', 'boop! UwU']],
  herding: [['peek', 'herding what, cats?']],
  reticulating: [['peek', 'splines, presumably.']],
  gitifying: [['wave', 'commit early, commit often.'], ['wave', 'git gud.']],
  newspapering: [['wave', 'extra! extra!']],
  spinning: [['spin', 'wheee.'], ['spin', "I'm dizzy."]],
  whirlpooling: [['spin', 'whirlpool! wheee.'], ['spin', 'round and round we go.']],
}

// Plain nods for words without a view.
const SPINNER_NODS = ['{word}… sure.', 'ah yes, {word}.', 'very {word} of you.', '{word}! classic.']

// Clawd's pose and line for the spinner's word. `seed` in [0, 1) is drawn when the word
// appears and picks where to start; each `step` (a stretch of time the word stays up) moves on to
// the next act.
export function spinnerTake(
  word: string,
  seed: number,
  step = 0,
): { pose: EmoteName | undefined; line: string } {
  const key = word.trim().toLowerCase()
  const calm = CALM[(Math.floor(seed * CALM.length) + step) % CALM.length]!
  const say = ([pose, line]: Act) => ({ pose, line: line.replaceAll('{word}', key).replaceAll('{calm}', calm) })
  const pick = (acts: readonly Act[]) => acts[(Math.floor(seed * acts.length) + step) % acts.length]

  const act = pick(SPINNER_SPECIALS[key] ?? SPINNER_FAMILIES.find(one => one.words.includes(key))?.acts ?? [])
  if (act !== undefined) {
    return say(act)
  }

  return key === '' ? { pose: undefined, line: 'hmm…' } : say(pick(SPINNER_NODS.map(line => [undefined, line] as const))!)
}

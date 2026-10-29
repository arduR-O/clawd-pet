export type Kind =
  | 'idle'
  | 'think'
  | 'read'
  | 'run'
  | 'write'
  | 'oops'
  | 'happy'
  | 'love'
  | 'sleep'

// Clawd's little acts: idle ones, reactions to a pet, and poses for spinner words.
export type EmoteName =
  | 'wave'
  | 'dance'
  | 'bubbles'
  | 'sidestep'
  | 'peek'
  | 'snack'
  | 'sunbathe'
  | 'shades'
  | 'glasses'
  | 'stargaze'
  | 'wish'
  | 'yawn'
  | 'hearts'
  | 'hop'
  | 'wiggle'
  | 'blush'
  | 'shy'
  | 'bow'
  | 'golden'
  | 'enough'
  | 'milestone'
  | 'sixseven'
  | 'seagull'
  | 'molt'
  | 'cousin'
  | 'pearl'
  | 'tide'
  | 'party'
  | 'treat'
  | 'meditate'
  | 'uwu'
  | 'stretch'
  | 'facepalm'
  | 'squish'
  | 'rain'
  | 'hiccup'
  | 'fish'
  | 'juggle'
  | 'castle'
  | 'sing'
  | 'vibe'
  | 'chef'
  | 'hardhat'
  | 'cry'
  | 'spin'
  | 'dizzy'
  | 'tap'
  | 'sherlock'
  | 'jedi'
  | 'gandalf'
  | 'terminator'
  | 'delorean'
  | 'ninja'
  | 'duck'
  | 'neo'
  | 'coffee'
  | 'astronaut'
  | 'oneup'
  | 'whale'

export type Emote = { name: EmoteName | null; line: string; until: number }

export type Mood = {
  kind: Kind
  line: string
  // Epoch ms when a reaction gives way to the resting mood.
  until: number
  lastActiveAt: number
}

declare module 'claude-code' {
  interface PluginState {
    clawd: { mood: Shaped<Mood>; tick: number; emote: Shaped<Emote>; isOff: boolean }
  }
}

# Changelog

## 0.2.3

### Fixed

- In VS Code on a remote host, Clawd could turn into its alt text ("Clawd: dance") after the window
  sat in the background. The apps were sent a new picture every 0.8 s, and a swap could fail to load.
  Now they get one picture that plays 12 frames by itself, and a new one only when those run out or
  Clawd does something new: about 12 times fewer swaps.

## 0.2.2

### Fixed

- In VS Code and the desktop app, Clawd's name no longer sits in a blue button. Those apps draw
  every button as a native one, so there the name is plain text, and `/pet` pets Clawd. In the
  terminal a click still pets it.
- In VS Code and the desktop app, Clawd's line is no longer cut short with `…`. It was cut to the
  terminal's columns, which those apps don't have; now they wrap it to the room they have.

### Removed

- **Sweat.** The drop beside Clawd's head during a turn past two minutes looked like a stray comma,
  most of all next to a hat. A long turn still ends in confetti.

## 0.2.1

### Removed

- **The music setting.** The built-in songs cover the songbook without it, and Last.fm sings what
  you actually play. A Last.fm week with no plays now keeps the songs Clawd has.

### Docs

- The README says plainly that what Clawd reads stays on your computer: it saves and sends none of
  your prompts, commands or files.

## 0.2.0

Some of these ideas came from [physics-clawd-pet](https://github.com/Ramirez0291/physics-clawd-pet),
a desktop Clawd with cartoon physics.

### New

- **A face for every mood.** Clawd's eyes come from one table of faces: a `> <` wince when
  something breaks, deep red heart eyes for a kind word, a start at seagulls, tides and hiccups,
  a smug look for a bow or a sudo, `^ ^` when happy.
- **Dizzy.** A third failed tool in a row leaves Clawd x-eyed, with stars going round its head.
  `/pet dizzy` shows it on demand.
- **Permission prompts.** Clawd thanks you when you allow one and shrugs when you don't. Where the
  band stays on screen while one waits, it raises a claw, taps its foot and says what needs your
  ok; in the terminal the prompt takes the band's place, so there you see only the answer.
- **Watching you type.** Clawd's eyes follow the caret as you type; typing `/pet` gets happy eyes
  ahead of the pet.
- **Stretch breaks.** After 50 minutes of work (the new `break_every` setting; empty or `0` turns
  it off) a finished turn has Clawd stretch and suggest a break.
- **Long turns.** A turn of two minutes or more ends in confetti, and its "done! that took N min."
  stays up a minute. A turn you stopped, or one that died on an error, is no longer cheered.
- **Landings.** A hop and a hiccup kick up a puff of dust.
- **Click to pet.** A click on Clawd, or on its name, pets it, as `/pet` does.

- **Guests.** Twelve visitors, each with a real trigger: Sherlock (`git blame`, a search spree),
  a Jedi (`git push --force`), Gandalf (turning down a destructive command), the Terminator
  (`kill`), a DeLorean (`git revert`, the reflog), a ninja (`git stash`), a rubber duck (a long
  debugging prompt), Neo (Claude loading a skill), coffee (the morning's first prompt), an
  astronaut (an API error), a 1-UP mushroom (tests green after red) and a whale (`docker`).
  `/pet guest` brings a random one, never the same twice running.
- **More to say.** The spinner-word nods go from 4 to 18, and the lines Clawd said every time
  (a failure, a facepalm, a finished turn, tests, commits, permission answers) rotate through a few.
- **Better poses.** Meditation sits wide with its claws raised and a mote of light drifting up; a
  stretch reaches up over its head; crying shows tears (`╥ ╥`); a yawn opens wide.

- **Talking is opt-in.** The `clawd` tool, which lets Claude make Clawd act and sing, adds about
  400 tokens to every request. It is now off by default; the new **Claude can talk to Clawd**
  setting turns it on.

### Removed

- **Moss and the garden.** The two other pets fell far behind Clawd, so Clawd is now the only
  pet. `/pet moss`, `/pet garden` and `/pet clawd` are gone; a stored choice of either is ignored.

### Fixed

- Reading glasses no longer make Clawd's head bigger: the face keeps its own edges and the outer
  rims stick out past them.

### Under the hood

- The terminal band is drawn in fewer pieces, and nothing redraws while Clawd is hidden.
- CI validates the plugin and runs its tests on every push; the mod and its tests typecheck.
- The tests are split by topic and run in parallel: about 8 s instead of 18 s.
- The plugin has an icon, drawn from Clawd's own art.

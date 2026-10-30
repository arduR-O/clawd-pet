# Changelog

## 0.3.3

### Fixed

- **A refused medium effort writes at high, not low.** Checked on a real install: Claude Code 2.1.314
  refuses the songbook request at medium effort whatever the cap (8,192 or 16,000), while high and
  low answer, so 0.3.2's bigger caps did not help medium. A refused effort now tries a better one
  first (medium → high, then low; high → low).
- **More songs in a songbook.** A songbook drew 5 of its 12 lines from Piano Man and 4 from
  Desperado, though the history named 14 songs. Now at most two lines come from one song, never two
  of one song in a row, spread across as many songs as Haiku knows the words to; fewer than 12
  lines if it runs out. Songbooks from the old prompt are written again.

## 0.3.2

### Fixed

- **Medium effort writes the songbook again.** On Claude Code 2.1.314, Haiku refused the songbook
  request at medium effort with an 8,192-token cap (HTTP 400), so it fell back to low effort. Checked
  on a real install: high and low worked, medium did not. The caps are now 8,192, 16,000 and 32,000
  for low, medium and high; a cap is a ceiling, not a cost.

## 0.3.1

### Removed

- **Scenery.** The row of drifting scenery from 0.3.0 is gone, with its setting and `/pet scenery`.

## 0.2.13

### Fixed

- **A songbook request the API refuses gets a plain second try.** With effort set to `high`, the
  request asks for up to 16,000 tokens, and a Haiku with a lower output limit (an older one, or
  through some providers) refuses it with HTTP 400. Now a 400 is tried again at 8,192 tokens and low
  effort, which every Haiku takes.

## 0.2.12

### Fixed

- **A refresh keeps the songbook until the new one is ready.** `/pet refresh-songs` used to throw
  the songbook away first, so a refresh that failed left only the built-in songs. Now the songbook
  Clawd has stays until a new one is written, and stays for good if the refresh fails.
- **A busy Claude API gets a second try.** A refresh that hit a passing API error (overloaded, rate
  limited, a server error, no response) failed at once. Now it tries again 5 seconds on, and if that
  fails too, says which error it was and its HTTP status.

## 0.2.11

### Fixed

- **`/pet refresh-songs` keeps its status up.** "new songs coming…" lasted 3 seconds and anything
  could replace it, though writing a songbook takes longer. Now Clawd shows "writing new songs…"
  until the songbook is done, then the outcome ("new songbook: 12 songs ♪", or what went wrong) for
  10 seconds, over whatever else comes up. A pet or another `/pet` command still cuts in.

## 0.2.10

### Fixed

- **Clawd comes back by itself in VS Code on a remote host.** There VS Code can stop drawing Clawd's
  picture after the window sits in the background, showing only "Clawd", until a reload or
  `/pet off` and `/pet on`. That showed the stuck part is the picture element, so each new picture
  (about every 10 s) now comes as a new element, and a stuck one is replaced within about 10 s.

## 0.2.9

### Fixed

- **No more faint lines across Clawd in VS Code and the desktop app.** The picture is made of
  rectangles side by side; scaled to a size that is no whole multiple of its pixels, their smoothed
  edges let a thin line of the background show between them. The picture now draws crisp edges.

### Changed

- **Four ways between poses.** Going straight from one pose to another, Clawd crouches, rises a row,
  blinks or leans aside, taking them in turn, instead of crouching every time.

## 0.2.8

### Fixed

- **The songbook sings the songs you played, not the artists' greatest hits.** The prompt asked for
  "songs by these artists, or these songs", so Haiku often reached for each artist's best-known hit
  (Bohemian Rhapsody, Piano Man, Stairway to Heaven) over what you actually played. Now it sings only
  the songs your Last.fm names; the artists set the mood. Tried live: in three runs on a mixed Hindi
  and rock history, every line came from a named song. Songbooks written by the old prompt are
  written again.
- `/pet refresh-songs` quotes a line of the new songbook, so you can see what it holds.

## 0.2.7

### New

- **Songbook: effort.** A setting for how hard Claude Haiku thinks about the songbook: `low`,
  `medium` (the default) or `high`. Higher writes better lines and uses more tokens: about 2,000,
  4,000 and 8,000 once a day. The reply's cap grows with it (4,096, 8,192, 16,000), so the thinking
  never crowds out the lines. 0.2.6 wrote it at `low`.

## 0.2.6

### Fixed

- **The Last.fm songbook is written again.** Claude Haiku now thinks before it answers, and its
  thinking counts against the reply's token cap. At 400 tokens the thinking took them all, so the reply
  held no lines and Clawd kept its built-in songs. The cap is now 4096, with low effort to keep the
  thinking short. Tried live, with English and with Hindi songs.

## 0.2.5

### Fixed

- **`/pet refresh-songs` says why the songbook did not change.** Before, every failure was silent and
  Clawd went on with its built-in songs. Now the command answers with what happened: an empty Last.fm
  user or API key, what Last.fm said (such as an invalid key), no plays yet, or Claude Haiku not
  answering. The README's troubleshooting section lists what to do for each.

## 0.2.4

### Changed

- **Songs play to their end.** Something that happens mid-song waits until the song stops, and then
  gets its full time. A pet or a `/pet` command still stops the song at once.
- **Clawd moves from pose to pose.** Going straight from one pose to another, Clawd crouches for a
  frame in between, so it looks like Clawd moving, not another Clawd popping up in its place.
- **A ninja in black.** The ninja is masked in black to the edges of its face, only its eyes showing,
  the mask's tails flapping behind, in place of a red headband.
- **An astronaut in a spacesuit.** The astronaut wears a white suit under its helmet.

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

# Changelog

## Unreleased

### Docs

- The README covers what changed since 0.2: the songbook from LRCLIB, sung and credited, growing day
  by day with `/pet add-songs`; meditation's many lines; any `/pet` waking Clawd; its moves between
  poses. The promo video is cut again (40 s): big glasses and the book, the songbook with its credit,
  meditation with opinions.

## 0.5.11

### Changed

- Two more lines that didn't read on their own: during a magic spinner word, "how did you do that?"
  is "pick a card, any card."; a turn that used no tools ends with "a quick answer, no tools
  needed." instead of "just a chat this time."

## 0.5.10

### Removed

- The thought bubble (· ∘ ○) that grew beside the sun during long thinking: on its own it read as
  stray dots.

## 0.5.9

### Changed

- Lines that only made sense with context a newcomer doesn't have now read on their own: "too
  bright." is "so bright out there.", "soaking it in." is "soaking up the sun.", "oof. red." is "oof.
  an error.", "…again." is "broke again.", "sending a friend" is "a helper is on it.", the
  sandcastle is counted in floors rather than turns, and a dozen more like them.

## 0.5.8

### Changed

- The book is held up in front of Clawd, its claws gripping the covers and its eyes over the top:
  two pages of text either side of the spine, the cover's edge underneath, and now and then a
  page's corner folding over. It used to sit off to the side, cut off at the band's edge.
- More ways to say what comes up all the time, each taken in turn: editing a file (it was always
  "scribbling on"), writing a new one, a search, a subagent, any other tool, `git status`/`diff`/
  `log`, tests, a commit, the end of a turn, the first prompt, a late one, any other prompt. A plain
  command is shown as itself every other time, and said Clawd's way in between.
- Idle, Clawd's line for the time of day changes every 15 minutes instead of staying "gm." or "too
  bright." all morning or noon.

## 0.5.7

### Fixed

- Clawd no longer holds its act for a spinner word for as long as the word stays up, which can be a
  whole long turn: it acts the word out for 8 s of every 12 s for its first three acts, then once
  every 36 s, and nods at the word in between ("prestidigitating! classic.").
- The magic act ("ooh, magic.", "✦ sparkly ✦", a golden pet) is happy-eyed, not smug.

## 0.5.6

### Changed

- **The big reading glasses are back.** 0.5.5's round lenses fit inside the face and came out too
  small to be cute, so the glasses are the big frames again, their rims past the face's edges and
  the head its own size under them. The book and the reading lines stay.

## 0.5.5

### Changed

- **Reading comes a different way each time.** Claude reads all the time, and Clawd said "reading
  app.py" every time. Now it rotates through a dozen ways ("skimming app.py…", "flipping through
  app.py", "app.py, page 1 of ∞", "app.py. riveting.") and one read in three it holds up an open
  book instead of its glasses. Reading a file again, searching, and the web rotate too; a web page
  names its site ("peeking at docs.python.org") and a web search its query.
- **Cuter reading glasses.** Round lenses over its eyes joined by a bridge (`◉───◉`), the temples
  hooked back past its head, and now and then a lens catching the light.

## 0.5.4

### Changed

- **Leave-time reminders nag less.** They went on for two hours past the leave time, at every prompt,
  every finished turn and in the idle line. Now they stop half an hour after it; at prompts and
  finished turns they come at most every 10 minutes; and the idle line mentions it only around each
  ten-minute mark (20 min to go, 10, at it, 10 past).

## 0.5.3

### New

- **26 more things to say while meditating**, from "detach HEAD. detach ego." and "sit with the
  segfault." to "garbage collecting my thoughts…" and "no thoughts. only claws.": 34 in all.

## 0.5.2

### Changed

- **Clawd sings the lines, not quotes them.** Lines from LRCLIB came word for word, so they read
  like quotes. Now each holds its last note, the last word's vowel stretched as a singer would
  ("come down sooooon", "on a saturdaaay", "rock youuu"), and so do Haiku's twists. Songbooks from
  before are written again.
- **The song is named after it is sung.** The credit showed the whole time, under a line still
  being sung, like a quote's attribution. Now it shows once the line is sung through, as a radio
  names a song after it plays, and opens with `♫`.

## 0.5.1

### Changed

- **Bubbles are water blue.** The bubbles Clawd blows were grey; they're now the blue of the whale's
  spout, its tears and the tide.

## 0.5.0

### New

- **`/pet add-songs`.** Like `/pet refresh-songs`, but it adds to the songbook instead of starting
  afresh. It skips the songs the songbook already has and looks further back in what you played
  (up to about 60 songs from Last.fm), then adds their lines, credits and all, without repeats.
- **The songbook grows day by day.** The day's own update now adds to the songbook too, so what you
  add stays; it keeps up to 60 lines, the oldest making room. `/pet refresh-songs` still starts a
  new one.

## 0.4.10

### Fixed

- **Stretching shows two claws, not four.** The shoulders left at its sides in 0.4.9 still read as
  claws, so reaching up now leaves nothing at its sides.
- **Any `/pet` wakes Clawd.** A click or a plain `/pet` woke it, but `/pet dance`, `/pet trick`
  and the rest did not call it back from a pastime: it went on fishing over the emote. Now any
  `/pet` counts as you being here, so Clawd wakes from a nap or leaves its pastime.

## 0.4.9

### Fixed

- **Meditation stays inside the band.** Clawd floated a whole row down, so its body reached the
  band's bottom edge and the aura under it was cut off. It now bobs half a row, slowly, and its aura
  stays inside on every frame.
- **No extra hands when stretching.** Reaching up, Clawd's claws were drawn over its head while the
  claws at its sides stayed too. Now only its shoulders are left at its sides.

## 0.4.8

### Changed

- **A sung line stays as dim as anything else Clawd says.** 0.4.6 drew it at full strength, which
  made Clawd's other lines look less important. Now the line stays dim and the song credit under it
  is fainter still, in the theme's subtle color (`#505050` on the dark theme, `#AFAFAF` on the
  light one), italic, and smaller in VS Code and the desktop app.

## 0.4.7

### Fixed

- **The song credit shows however Clawd sings.** It showed for `/pet sing` and Clawd's own songs, but
  not when Clawd sang along while vibing with its headphones on while you were away. Now any songbook
  line Clawd is singing, by any way, shows the song it is from.

## 0.4.6

### Changed

- **The song credit steps back behind the line.** It was as prominent as the sung line. Now, while
  Clawd sings, the line shows at full strength and the credit under it stays dim and italic, smaller
  in VS Code and the desktop app, and opens with a quiet `—` rather than a second `♪`.

## 0.4.5

### Changed

- **Only lyrics in Devanagari are left out.** 0.4.4 also left out romanized Hindi, by counting
  Hindi words; romanized lyrics turn into lines fine, so only lyrics written in Devanagari or another
  Indian script are left out now, and Haiku is no longer asked to leave Hindi songs out.

## 0.4.4

### Changed

- **Hindi songs are left out of the songbook.** Their lines don't turn into jokes about code well.
  Clawd tells them by their lyrics from LRCLIB: an Indian script such as Devanagari, or romanized
  Hindi, where common Hindi words make up a good share of the words. When Haiku writes the songbook
  alone, it is asked to leave them out. `/pet refresh-songs` says how many it left out. The new
  **Songbook: Hindi songs** setting (`skip` or `keep`) sings them again.

## 0.4.3

### New

- **Which song is that?** While Clawd sings a line of the songbook, the song and the artist show dim
  under it (`♪ Piano Man · Billy Joel`), and `/pet song` tells you which song the line it sang last
  is from. A twist is named after the song it riffs on. The credits come from the LRCLIB lookups, so
  the built-in songs, and songbooks Claude Haiku writes on its own, carry none rather than a guess.

## 0.4.2

### Fixed

- **A busy LRCLIB no longer drops songs.** LRCLIB answers "server busy" (HTTP 503) now and then,
  and the songbook asked about every song at once, so a busy answer silently left a song out. Now it
  asks three songs at a time and tries a busy one again 1.5 seconds on. Checked on a real history:
  LRCLIB has the lyrics of 12 of its 14 songs, the ones Haiku did not know among them.

## 0.4.1

### Changed

- **Guests have their gravitas.** A guest stayed 4 seconds, and any small reaction could replace it.
  Now a guest stays 10 seconds and holds the stage, as a song does: reactions that come up meanwhile
  wait until it goes and then get their full time, and Clawd's small idle emotes skip the visit. A
  pet, a `/pet` command or another guest still comes at once, and a guest who comes mid-song walks
  on when the song ends.

## 0.4.0

### New

- **The songbook sings your songs' real lines.** Clawd looks your Last.fm songs up on LRCLIB
  (lrclib.net), a free lyrics database that music players use, and takes each song's first line and
  its chorus; Claude Haiku only adds a few twists on those lines into code. Before, Haiku had to
  remember the words, so it leaned on the few songs it knew and skipped the rest. If LRCLIB has fewer
  than 3 lines for your songs, Haiku writes the songbook as before. The new **Songbook: lyrics**
  setting turns LRCLIB off. Only song titles and artists go to LRCLIB. Songbooks from before are
  written again.

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

# Changelog

## Unreleased

Some of these ideas came from [physics-clawd-pet](https://github.com/Ramirez0291/physics-clawd-pet),
a desktop Clawd with cartoon physics.

### New

- **A face for every mood.** Clawd's eyes come from one table of faces: a `> <` wince when
  something breaks, deep red heart eyes for a kind word, a start at seagulls, tides and hiccups,
  a smug look for a bow or a sudo, `^ ^` when happy.
- **Dizzy.** A third failed tool in a row leaves Clawd x-eyed, with stars going round its head.
  `/pet dizzy` shows it on demand.
- **Waiting on you.** While a permission prompt waits, Clawd raises a claw, taps its foot and says
  what needs your ok, then thanks you or shrugs when you answer.
- **Watching you type.** Clawd's eyes follow the caret as you type; typing `/pet` gets happy eyes
  ahead of the pet.
- **Stretch breaks.** After 50 minutes of work (the new `break_every` setting; empty or `0` turns
  it off) a finished turn has Clawd stretch and suggest a break.
- **Long turns.** A turn of two minutes or more ends in confetti, and its "done! that took N min."
  stays up a minute. A turn you stopped, or one that died on an error, is no longer cheered.
- **Landings.** A hop and a hiccup kick up a puff of dust.

### Fixed

- Reading glasses no longer make Clawd's head bigger: the face keeps its own edges and the outer
  rims stick out past them.

### Under the hood

- The terminal band is drawn in fewer pieces, and nothing redraws while Clawd is hidden.
- CI validates the plugin and runs its tests on every push; the mod and its tests typecheck.
- The plugin has an icon, drawn from Clawd's own art.

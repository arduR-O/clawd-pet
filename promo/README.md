# The promo videos

Two motion-graphics videos of Clawd, built entirely from this repository: every Clawd frame is
drawn by the mod's own scene code, and the soundtrack is an original chiptune synthesized from
scratch with numpy (no samples, no licensed music).

```sh
promo/build.sh
```

```sh
promo/build.sh social
```

Both need bun, Node with Playwright and Chromium, Python 3 with numpy, and ffmpeg.

| Cut | Made for | Shape | Length | Writes |
|---|---|---|---|---|
| `promo/build.sh` | the README, YouTube: watched with sound, on purpose | 16:9, 1920×1080 | 40 s | `promo/build/clawd-promo.mp4` |
| `promo/build.sh social` | LinkedIn and other feeds | 4:5, 1080×1350 | 23 s | `promo/build/clawd-social.mp4` |

## The social cut

A feed plays a video muted, in the middle of a scroll, so the social cut is made for that:

- **Clawd is on screen from the first frame,** with one bold line ("I gave Claude Code a pet."). The
  first frame is the thumbnail, and the first second or two decide whether someone stops; a dark
  title card there loses them.
- **Every beat has a big caption,** so it reads with the sound off: what happened ("git push
  --force"), then Clawd's answer. The music is there for whoever turns the sound on.
- **Portrait, 4:5,** fills far more of a phone's feed than 16:9.
- **23 seconds,** a beat every 2: shorter means more people see it to the end.
- **Then the real thing:** the camera pulls back from Clawd to the terminal it lives in, small, right
  above the prompt, while Claude works. It answers "would this get in my way?" before the install.
- **It loops without a seam:** the end card's words clear and the opening frame comes back, so a feed
  that replays it runs straight on.
- **The end card says why and how:** zero tokens, runs locally, and the one line that installs it.

## The files

- `timeline.json`, `social.json`: each cut's shots, their times and captions; the music and the
  pictures both follow them.
- `scenes.ts`: draws Clawd's frames for every shot of both cuts.
- `page.html`, `social.html`: draw one frame of each cut for a time `t`.
- `render.cjs`: screenshots a page for every frame (`PROMO=social.json` for the social cut).
- `music.py`: the soundtrack and its sound effects, on the beat of the cuts; each shot's sound plays
  only in a cut that has the shot.

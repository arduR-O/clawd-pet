# The promo video

A 34-second, 1080p motion-graphics video of Clawd, built entirely from this repository: every
Clawd frame is drawn by the mod's own scene code, and the soundtrack is an original chiptune
synthesized from scratch with numpy (no samples, no licensed music).

```sh
promo/build.sh
```

needs bun, Node with Playwright and Chromium, Python 3 with numpy, and ffmpeg. It writes
`promo/build/clawd-promo.mp4`.

- `timeline.json`: the shots, their times and captions; the music and the pictures both follow it.
- `scenes.ts`: draws Clawd's frames for each shot.
- `page.html`: draws one frame of the video for a time `t`.
- `render.cjs`: screenshots `page.html` for every frame.
- `music.py`: the soundtrack and its sound effects, on the beat of the cuts.

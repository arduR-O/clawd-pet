#!/usr/bin/env bash
# Builds the promo video from scratch: Clawd's frames, the page's frames, the soundtrack, then
# ffmpeg puts them together as promo/build/clawd-promo.mp4. Run from the repository's root.
set -euo pipefail
cd "$(dirname "$0")/.."
bun promo/scenes.ts
python3 promo/music.py
rm -rf promo/build/frames
node promo/render.cjs
ffmpeg -y -loglevel error -framerate 30 -i promo/build/frames/f%05d.png -i promo/build/music.wav \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -shortest promo/build/clawd-promo.mp4
echo "promo/build/clawd-promo.mp4"

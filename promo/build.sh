#!/usr/bin/env bash
# Builds a promo video from scratch: Clawd's frames, the page's frames, the soundtrack, then ffmpeg
# puts them together. Run from the repository's root:
#
#   promo/build.sh          the 40-second 16:9 cut, promo/build/clawd-promo.mp4
#   promo/build.sh social   the 20-second 4:5 cut for social feeds, promo/build/clawd-social.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${1:-}" = social ]; then
  timeline=social.json frames=social-frames music=social-music.wav video=clawd-social.mp4
else
  timeline=timeline.json frames=frames music=music.wav video=clawd-promo.mp4
fi
bun promo/scenes.ts
python3 promo/music.py "$timeline" "$music"
rm -rf "promo/build/$frames"
PROMO="$timeline" node promo/render.cjs
ffmpeg -y -loglevel error -framerate 30 -i "promo/build/$frames/f%05d.png" -i "promo/build/$music" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -shortest "promo/build/$video"
echo "promo/build/$video"

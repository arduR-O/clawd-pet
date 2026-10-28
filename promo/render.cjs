// Renders the promo video's frames as PNGs: loads promo/page.html in headless Chromium, hands it
// the timeline and Clawd's frames, and screenshots render(t) for every frame. Run from the
// repository's root after `bun promo/scenes.ts`:
//
//   node promo/render.cjs [only-these-seconds, e.g. 5,12.5]
//
// Frames land in promo/build/frames/; promo/build.sh turns them into the video.

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const here = __dirname
const timeline = JSON.parse(fs.readFileSync(path.join(here, 'timeline.json'), 'utf8'))
const data = JSON.parse(fs.readFileSync(path.join(here, 'build', 'scenes.json'), 'utf8'))
const out = path.join(here, 'build', 'frames')
fs.mkdirSync(out, { recursive: true })

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: timeline.width, height: timeline.height } })
  await page.goto('file://' + path.join(here, 'page.html'))
  await page.evaluate(([tl, d]) => setup(tl, d), [timeline, data])
  const only = process.argv[2]
  const times = only
    ? only.split(',').map(Number)
    : Array.from({ length: Math.round(timeline.duration * timeline.fps) }, (_, i) => i / timeline.fps)
  for (const [i, t] of times.entries()) {
    await page.evaluate(at => render(at), t)
    const name = only ? `still-${t}.png` : `f${String(i).padStart(5, '0')}.png`
    await page.screenshot({ path: path.join(out, name) })
    if (!only && i % 150 === 0) console.log(`frame ${i}/${times.length}`)
  }
  await browser.close()
})()

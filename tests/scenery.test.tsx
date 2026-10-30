import { expect, test } from 'claude-code/testing'

import { SCENERIES, sceneryOf, sceneryRow } from '../hooks/scenery'
import { BAND, OPTIONS, NOON_IST, TYPED, start } from './helpers'

const at = (month: number, hour: number, day = 1) => ({ month, hour, day, weekday: 2 })

test('on auto, the scenery follows the season and the hour', () => {
  expect(sceneryOf('auto', at(4, 14))).toBe('blossom')
  expect(sceneryOf('auto', at(4, 8, 2))).toBe('birds')
  expect(sceneryOf('auto', at(7, 14, 2))).toBe('sea')
  expect(sceneryOf('auto', at(7, 14, 3))).toBe('koi')
  expect(sceneryOf('auto', at(10, 14))).toBe('leaves')
  expect(sceneryOf('auto', at(1, 14))).toBe('snow')
  expect(sceneryOf('auto', at(1, 23))).toBe('stars')
  expect(sceneryOf('auto', at(7, 23))).toBe('fireflies')
  expect(sceneryOf('sea', at(1, 23))).toBe('sea')
  expect(sceneryOf('off', at(4, 14))).toBeUndefined()
})

test('every scene fills its row exactly, in glyphs one cell wide, and sparsely', () => {
  // Glyphs no terminal or app draws two cells wide, nor as emoji.
  const narrow = /^[ ~‿▲<>∘✿❀·❦❧❅❆⋆✧•v✦─]*$/
  for (const scenery of SCENERIES) {
    for (const t of [0, 61_000, 3_600_000]) {
      const text = sceneryRow(scenery, 60, NOON_IST + t)
        .map(part => part.text)
        .join('')
      expect([...text]).toHaveLength(60)
      expect(text).toMatch(narrow)
      // A few things on the row, never a crowd.
      expect(text.replace(/ /g, '').length).toBeLessThan(15)
    }
  }
})

test('the scenery moves slowly: a tick changes a cell or two, a minute moves things along', () => {
  for (const scenery of SCENERIES) {
    const textAt = (t: number) => sceneryRow(scenery, 60, NOON_IST + t).map(part => part.text).join('')
    let changed = 0
    for (let t = 0; t < 60_000; t += 800) {
      const [a, b] = [textAt(t), textAt(t + 800)]
      changed = Math.max(changed, [...a].filter((ch, i) => ch !== [...b][i]).length)
    }
    expect(changed).toBeLessThanOrEqual(10)
    expect(textAt(60_000)).not.toBe(textAt(0))
  }
})

const sceneryShown = async (ui: { findAll: (query: { type: string }) => Promise<readonly { text: string; props: { mono?: boolean } }[]> }) =>
  (await ui.findAll({ type: 'Text' })).find(one => one.props.mono === true)

test('a scenery row runs under Clawd, as wide as the band, and /pet scenery changes it', { options: OPTIONS }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount(BAND)

  // October at noon, on auto: autumn leaves, across the band's 60 cells.
  const leaves = await sceneryShown(ui)
  expect([...(leaves?.text ?? '')]).toHaveLength(60)
  expect(leaves?.text).toMatch(/[❦❧·]/)

  const sea = await $.command.run({ ...TYPED, command: 'pet', args: 'scenery sea' })
  expect(sea.text).toBe('Scenery: sea.')
  expect((await sceneryShown(ui))?.text).toMatch(/▲/)

  await $.command.run({ ...TYPED, command: 'pet', args: 'scenery off' })
  expect(await sceneryShown(ui)).toBeUndefined()

  const asked = await $.command.run({ ...TYPED, command: 'pet', args: 'scenery waterfall' })
  expect(asked.text).toBe('Scenery is off. Pick one: /pet scenery auto, off, sea, koi, blossom, leaves, snow, stars, fireflies, birds.')
  await ui.unmount()
})

test('the scenery you pick is kept for the next session, and the setting picks it otherwise', { options: { ...OPTIONS, scenery: 'stars' } }, async ($, on) => {
  await start($, on, { scenery: 'koi' }, NOON_IST)
  const ui = await $.ui.mount(BAND)

  expect((await sceneryShown(ui))?.text).toMatch(/<>|∘/)
  await ui.unmount()
})

test('the apps get the row with its spaces kept', { options: { ...OPTIONS, scenery: 'stars' } }, async ($, on) => {
  await start($, on, {}, NOON_IST)
  const ui = await $.ui.mount({ ...BAND, surface: 'vscode' })

  const row = await sceneryShown(ui)
  expect(row?.text).not.toMatch(/ /)
  expect(row?.text).toMatch(/ /)
  await ui.unmount()
})

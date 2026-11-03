"""The promo video's soundtrack: an original chiptune and its sound effects, synthesized from
nothing but numpy, timed to a timeline of shots. Run from the repository's root:

    python3 promo/music.py [timeline.json] [music.wav]

It reads promo/timeline.json and writes promo/build/music.wav unless told other ones (the social cut
is promo/social.json). No samples and no one else's music: every sound is made here. Each shot's
sound plays only if the timeline has that shot.
"""

import json
import math
import os
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, sys.argv[1] if len(sys.argv) > 1 else 'timeline.json')))
OUT = sys.argv[2] if len(sys.argv) > 2 else 'music.wav'
SR = 44100
BPM = TL['bpm']
BEAT = 60 / BPM
BAR = 4 * BEAT
EIGHTH = BEAT / 2
DURATION = TL['duration']
N = int(DURATION * SR)
SHOTS = {s['id']: s for s in TL['shots']}

rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(n, attack=0.004, decay=0.08, sustain=0.6, release=0.05):
    """An ADSR envelope `n` samples long, its release in its last stretch."""
    t = np.arange(n) / SR
    length = n / SR
    a = np.clip(t / max(attack, 1e-6), 0, 1)
    d = sustain + (1 - sustain) * np.exp(-np.maximum(t - attack, 0) / max(decay, 1e-6))
    r = np.clip((length - t) / max(release, 1e-6), 0, 1)
    return a * d * r


def blep(phase, dt):
    """PolyBLEP: smooths a saw's jump so it doesn't alias into a harsh fizz."""
    out = np.zeros_like(phase)
    lo = phase < dt
    x = phase[lo] / dt[lo]
    out[lo] = 2 * x - x * x - 1
    hi = phase > 1 - dt
    x = (phase[hi] - 1) / dt[hi]
    out[hi] = x * x + 2 * x + 1
    return out


def pulse(freq, seconds, duty=0.5, vibrato=0.0):
    """A band-limited pulse wave: the difference of two saws `duty` apart."""
    t = np.arange(int(seconds * SR)) / SR
    f = freq * (1 + vibrato * np.sin(2 * math.pi * 5.5 * t) * np.clip(t / 0.15, 0, 1))
    dt = f / SR
    phase = np.cumsum(dt) % 1.0
    shifted = (phase + duty) % 1.0
    saw = lambda p: 2 * p - 1 - blep(p, dt)
    # Already centred: high for `duty` of the cycle, low the rest, two apart.
    return saw(phase) - saw(shifted)


def triangle(freq, seconds):
    t = np.arange(int(seconds * SR)) / SR
    phase = (freq * t) % 1.0
    return 4 * np.abs(phase - 0.5) - 1


def sine_sweep(f0, f1, seconds, curve=1.0):
    n = int(seconds * SR)
    k = np.linspace(0, 1, n) ** curve
    f = f0 * (f1 / f0) ** k
    return np.sin(2 * math.pi * np.cumsum(f) / SR)


def noise(seconds):
    return rng.uniform(-1, 1, int(seconds * SR))


def highpass(x):
    return np.diff(x, prepend=0.0)


left = np.zeros(N)
right = np.zeros(N)


def add(at, sound, gain=1.0, pan=0.0):
    """Mixes `sound` in from `at` seconds, panned -1 (left) to 1 (right)."""
    i = int(at * SR)
    if i >= N or i + len(sound) <= 0:
        return
    s = sound[: max(0, N - i)] * gain
    left[i : i + len(s)] += s * math.sqrt((1 - pan) / 2) * 1.414
    right[i : i + len(s)] += s * math.sqrt((1 + pan) / 2) * 1.414


# --- instruments ---------------------------------------------------------------------------


def kick(at, gain=0.55):
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.035)
    s = np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    s += noise(0.28)[:n] * np.exp(-t / 0.004) * 0.25
    add(at, np.tanh(s * 1.6), gain)


def snare(at, gain=0.42):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    s = highpass(noise(0.22)[:n]) * np.exp(-t / 0.06) * 0.9 + np.sin(2 * math.pi * 190 * t) * np.exp(-t / 0.04) * 0.5
    add(at, s, gain)


def hat(at, gain=0.13, open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    s = highpass(highpass(noise(n / SR)[:n])) * np.exp(-t / (0.06 if open_ else 0.012))
    add(at, s, gain, pan=0.3)


def crash(at, gain=0.3):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    s = highpass(noise(1.6)[:n]) * np.exp(-t / 0.5)
    add(at, s, gain, pan=-0.2)
    add(at + 0.011, s, gain * 0.8, pan=0.4)


def bass(at, midi, seconds, gain=0.24):
    s = triangle(hz(midi), seconds) * env(int(seconds * SR), decay=0.12, sustain=0.7, release=0.03)
    add(at, s, gain)


def lead(at, midi, seconds, gain=0.24, duty=0.25):
    s = pulse(hz(midi), seconds, duty, vibrato=0.006) * env(int(seconds * SR), decay=0.15, sustain=0.55, release=0.04)
    add(at, s, gain, pan=-0.15)
    # A quiet echo three eighths later, off to the other side.
    add(at + 3 * EIGHTH, s, gain * 0.28, pan=0.5)


def arp(at, midi, gain=0.07):
    s = pulse(hz(midi), EIGHTH / 2, 0.125) * env(int(EIGHTH / 2 * SR), decay=0.05, sustain=0.2, release=0.02)
    add(at, s, gain, pan=0.45)


def pad(at, midis, seconds, gain=0.05):
    n = int(seconds * SR)
    s = sum(triangle(hz(m), seconds) for m in midis) / len(midis)
    s *= env(n, attack=0.4, decay=1.0, sustain=0.8, release=0.6)
    add(at, s, gain)


# --- sound effects -------------------------------------------------------------------------


def click(at, gain=0.22):
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    s = highpass(noise(0.03)[:n]) * np.exp(-t / 0.004) + np.sin(2 * math.pi * 2400 * t) * np.exp(-t / 0.006) * 0.3
    add(at, s, gain * rng.uniform(0.7, 1.0), pan=rng.uniform(-0.3, 0.3))


def typed(at, chars, seconds):
    for i in range(chars):
        click(at + seconds * (i + 0.5) / chars)


def blip(at, midi, seconds=0.07, gain=0.18, duty=0.5):
    s = pulse(hz(midi), seconds, duty) * env(int(seconds * SR), decay=0.03, sustain=0.4, release=0.01)
    add(at, s, gain)


def boing(at, gain=0.35):
    s = sine_sweep(520, 140, 0.35, 0.6) * env(int(0.35 * SR), decay=0.2, sustain=0.3, release=0.08)
    add(at, s, gain)


def riser(at, seconds, gain=0.2):
    n = int(seconds * SR)
    k = np.linspace(0, 1, n)
    s = highpass(noise(seconds)[:n]) * k**2 + sine_sweep(200, 1800, seconds, 2.0) * k**2 * 0.3
    add(at, s, gain)


def sparkle(at, gain=0.09):
    for i, m in enumerate([84, 88, 91, 96, 91, 96, 100, 103]):
        blip(at + i * 0.045, m, 0.05, gain, duty=0.125)


def buzz(at, gain=0.16):
    s = (pulse(hz(40), 0.28, 0.5) + pulse(hz(40.3), 0.28, 0.3)) * env(int(0.28 * SR), decay=0.1, sustain=0.6, release=0.05)
    add(at, s, gain)


def wobble(at, seconds, gain=0.12):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f = 700 * 2 ** (np.sin(2 * math.pi * 3 * t) * 0.6 - t / seconds * 1.2)
    s = np.sin(2 * math.pi * np.cumsum(f) / SR) * env(n, attack=0.02, decay=0.5, sustain=0.8, release=0.1)
    add(at, s, gain)


def chime(at, midi, gain=0.14):
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * math.pi * hz(midi) * t) + 0.4 * np.sin(2 * math.pi * hz(midi) * 2.76 * t)) * np.exp(-t / 0.35)
    add(at, s, gain, pan=0.2)


def yawn(at, gain=0.14):
    n = int(0.9 * SR)
    k = np.linspace(0, 1, n)
    f = 260 + 220 * np.sin(math.pi * k) ** 1.5
    s = np.sin(2 * math.pi * np.cumsum(f) / SR) * np.sin(math.pi * k)
    add(at, s, gain)


def pop(at, midi, gain=0.16):
    s = sine_sweep(hz(midi) * 1.6, hz(midi), 0.09) * env(int(0.09 * SR), decay=0.04, sustain=0.2, release=0.02)
    add(at, s, gain)


# --- the song -----------------------------------------------------------------------------

# A minor: Am F C G, a bar each, as root and chord tones.
CHORDS = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]
MOTIF = [
    [69, None, 72, None, 76, 74, 72, 69],
    [72, None, 69, None, 65, None, 69, 72],
    [76, None, 79, None, 76, 74, 72, None],
    [74, None, 71, None, 67, None, 71, 74],
]
HIGH = [
    [81, None, 79, 76, 79, None, 76, 74],
    [72, None, 74, 76, 77, None, 76, 72],
    [76, 79, 84, None, 83, 79, 76, None],
    [74, None, 79, None, 83, None, 86, None],
]

# The shots the song turns on; a timeline without one of them goes without its part.
cold, meet, night, listing, guests, end = (SHOTS.get(name) for name in ('cold', 'meet', 'night', 'list', 'guests', 'end'))
# Where the groove starts: after the cold open and the meet, or at once for a cut that opens on Clawd.
first = next((s for s in TL['shots'] if s.get('caption') or s['id'] not in ('cold', 'meet')), TL['shots'][0])
groove = first['start']
# Where the tune climbs an octave, and the drums drop out.
climb = SHOTS.get('songbook', {'start': DURATION})['start']
calm = night or {'start': -1, 'end': -1}
outro = (end['start'] + BAR) if end else DURATION

if cold:
    # Cold open: a soft chord under the typing, rising into the flash.
    pad(0, [57, 64, 69, 72], 4.0, 0.06)
    typed(0.0, len('your terminal does a lot of work.'), 1.4)
    typed(2.0, len('it could use a friend.'), 1.0)
    riser(3.0, 1.0, 0.22)
else:
    # Opening on Clawd: a hit on the very first frame, so a viewer who turns the sound on hears it start.
    crash(0, 0.3)
    kick(0)

if meet:
    # Meet Clawd: it lands with a boing, its name pops with a stab.
    kick(meet['start'])
    crash(meet['start'], 0.35)
    boing(meet['start'] + 0.22)
    boing(meet['start'] + 0.45, 0.16)
    for m in [69, 72, 76, 81]:
        blip(meet['start'] + 1.0, m, 0.25, 0.07, duty=0.25)
    blip(meet['start'] + 2.0, 88, 0.06, 0.1)

start_at = meet['start'] if meet else 0
bars = int(DURATION // BAR)
for b in range(bars):
    at = b * BAR
    if at < start_at:
        continue
    root, tones = CHORDS[b % 4]
    is_night = calm['start'] <= at < calm['end']
    is_outro = at >= outro
    # Bass: eighths on the root, an octave jump on the off beats.
    if at < DURATION - 2:
        for e in range(8):
            if is_outro and e > 0:
                break
            bass(at + e * EIGHTH, root - 12 + (12 if e % 2 else 0), EIGHTH * (0.9 if not is_outro else 7.5))
    # Drums: four on the floor from the groove on, half time before it, hats only at night.
    if not is_outro:
        for beat in range(4):
            t = at + beat * BEAT
            if not is_night and (at >= groove or beat % 2 == 0):
                kick(t)
            if not is_night and beat % 2 == 1:
                snare(t)
            hat(t + EIGHTH, open_=beat == 3)
            hat(t, 0.07)
    # Arpeggio on sixteenths from the groove on.
    if at >= groove and not is_outro:
        for s in range(16):
            arp(at + s * EIGHTH / 2, tones[s % 3] + 12 + (12 if s % 8 >= 6 else 0))
    # The tune: the motif, then up an octave and busier from the songbook on.
    if at >= start_at + (BAR if meet else 0) and at < DURATION - 2:
        line = HIGH if climb <= at < (listing or end or {'end': DURATION})['end'] else MOTIF
        notes = line[b % 4]
        for e, m in enumerate(notes):
            if m is None:
                continue
            # A note holds through the rest after it.
            held = 2 if e + 1 < len(notes) and notes[e + 1] is None else 1
            lead(at + e * EIGHTH, m, held * EIGHTH * 0.95, 0.17 if is_night else 0.24)
    if is_night:
        pad(at, [t + 12 for t in tones], BAR, 0.05)


# Each trick gets its sound, on its cut, if the timeline has it.
def at(name, then):
    if name in SHOTS:
        then(SHOTS[name]['start'])


def sung(t):
    for i, (m, d) in enumerate([(76, 0.18), (79, 0.18), (81, 0.18), (84, 0.8)]):
        lead(t + 0.3 + i * 0.2, m, d, 0.16, duty=0.5)
    chime(t + 1.2, 96, 0.05)


at('hook', lambda t: (boing(t + 0.1), boing(t + 0.35, 0.16), [blip(t + 0.8, m, 0.25, 0.06, duty=0.25) for m in [69, 72, 76, 81]]))
at('glasses', lambda t: (blip(t + 0.05, 84), blip(t + 0.14, 91)))
at('book', lambda t: (pop(t + 0.1, 84, 0.07), pop(t + 0.22, 88, 0.06)))
at('commit', lambda t: (sparkle(t + 0.1), crash(t, 0.18)))
at('dizzy', lambda t: (buzz(t + 0.05), buzz(t + 0.35), wobble(t + 0.6, 1.2)))
at('typing', lambda t: typed(t, len('add a dark mode toggle'), 1.7))
at('jedi', lambda t: (riser(t, 0.35, 0.16), buzz(t + 0.35, 0.1), sparkle(t + 0.4, 0.06)))
at('gandalf', lambda t: (kick(t + 0.05, 0.7), crash(t + 0.05, 0.22), [lead(t + 0.3, m, 0.6, 0.06, duty=0.5) for m in [45, 52, 57]]))
at('songbook', sung)
at('long', lambda t: [blip(t + 0.05 + i * 0.09, m, 0.09 if i < 3 else 0.35, 0.13, duty=0.25) for i, m in enumerate([72, 76, 79, 84])])
at('stretch', lambda t: yawn(t + 0.1))
at('night', lambda t: [chime(t + 0.2 + i * 0.45, m, 0.05) for i, m in enumerate([93, 96, 100, 98])])
if listing:
    for i in range(4):
        pop(listing['start'] + i * BEAT, 76 + i * 3)
    crash(listing['start'], 0.2)
if guests:
    # The guests pop in on every half beat, climbing a pentatonic scale.
    crash(guests['start'], 0.25)
    for i, m in enumerate([69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]):
        pop(guests['start'] + 0.3 + i * EIGHTH, m, 0.13)

if end:
    # The end: a stab, the theme once more, and the final chord rings out.
    crash(end['start'], 0.4)
    kick(end['start'])
    for m in [57, 64, 69, 72, 76]:
        lead(end['start'], m, 0.35, 0.06, duty=0.5)
    final = DURATION - 3.0
    for m in [57, 64, 69, 72, 76, 81]:
        add(final, (triangle(hz(m), 3.0) + 0.5 * pulse(hz(m), 3.0, 0.5) * 0.3) * env(int(3.0 * SR), attack=0.01, decay=1.2, sustain=0.2, release=1.0), 0.05)
    chime(final, 93, 0.08)

# --- master ----------------------------------------------------------------------------------

mix = np.stack([left, right], axis=1)
mix = np.tanh(mix * 1.15)
peak = np.max(np.abs(mix))
mix = mix / peak * 0.89
fade = int(0.8 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]

os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
out = os.path.join(HERE, 'build', OUT)
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(f'{out}: {DURATION}s, peak before normalising {peak:.2f}')

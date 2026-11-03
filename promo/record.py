"""Record a real Claude Code session with Clawd in it, for the social cut's terminal shot.

Runs `claude` with this repository's plugin in a detached tmux pane the size of the video's window,
types a prompt, then types a follow-up while Claude works, and captures the pane (with its colours)
about eight times a second until Claude asks to edit a file. Writes promo/real.json: every
distinct frame, its time, and its rows as ANSI text, without the Claude Code header (rows 0-5).

    python3 promo/record.py

Needs tmux and a signed-in claude. The take is real, so each run differs: after recording, check
which stretch to play and set the real shot's `play` in social.json.
"""

import json
import os
import re
import subprocess
import time

PROMO = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(PROMO)
WORK = os.path.join(PROMO, 'build', 'take')
COLS, ROWS = 74, 26
HEADER = 6  # Claude Code's logo, version, model and folder: left out of the take
PROMPT = 'add a dark mode toggle to this app'
FOLLOW = 'and make it remember the choice'

APP = 'import flask\n\napp = flask.Flask(__name__)\n\n@app.route("/")\ndef index():\n    return "hello"\n'
THEME = 'body { background: white; color: #222; }\n'


def main():
    demo = os.path.join(WORK, 'demo')
    os.makedirs(os.path.join(demo, 'src'), exist_ok=True)
    open(os.path.join(demo, 'src', 'app.py'), 'w').write(APP)
    open(os.path.join(demo, 'src', 'theme.css'), 'w').write(THEME)
    subprocess.run(['git', 'init', '-q'], cwd=demo)
    # Morning, so Clawd has the sun over it; tmux quiet, so its hints don't take a row.
    settings = os.path.join(WORK, 'settings.json')
    options = {'options': {'utc_offset': '+05:30'}}
    json.dump({'pluginConfigs': {'clawd@inline': options, 'clawd': options}}, open(settings, 'w'))
    conf = os.path.join(WORK, 'tmux.conf')
    open(conf, 'w').write('set -g mouse on\nset -g focus-events on\n')

    def tmux(*args):
        return subprocess.run(['tmux', '-L', 'clawd-take', '-f', conf, *args], capture_output=True, text=True).stdout

    tmux('kill-server')
    # Not inside tmux as far as Claude Code knows, so it draws in full colour, as in a terminal app.
    command = (
        'env -u TMUX -u TMUX_PANE -u CLAUDE_CODE_CHILD_SESSION -u CLAUDECODE '
        f'TERM=xterm-256color COLORTERM=truecolor claude --plugin-dir {REPO} --settings {settings}'
    )
    tmux('new-session', '-d', '-s', 'take', '-x', str(COLS), '-y', str(ROWS), '-c', demo, command)
    time.sleep(12)
    if 'trust this folder' in tmux('capture-pane', '-p', '-t', 'take'):
        tmux('send-keys', '-t', 'take', 'Down', 'Enter')
        time.sleep(8)

    keys, at = [], 0.8
    for ch in PROMPT:
        keys.append((at, ch))
        at += 0.07
    keys.append((at + 0.4, 'Enter'))
    at += 5.0
    for ch in FOLLOW:
        keys.append((at, ch))
        at += 0.08

    frames, start = [], time.time()
    while time.time() - start < 70:
        now = time.time() - start
        while keys and keys[0][0] <= now:
            _, key = keys.pop(0)
            tmux('send-keys', '-t', 'take', *(['Enter'] if key == 'Enter' else ['-l', key]))
        screen = tmux('capture-pane', '-e', '-p', '-t', 'take')
        if 'Do you want' in screen:
            break
        screen = re.sub(r'\x1b\]8;[^\x1b]*\x1b\\', '', screen)  # links carry local paths
        rows = screen.split('\n')[HEADER:ROWS]
        if not frames or frames[-1]['rows'] != rows:
            frames.append({'t': round(now, 2), 'rows': rows})
        time.sleep(0.12)
    tmux('kill-server')

    out = os.path.join(PROMO, 'real.json')
    json.dump({'cols': COLS, 'frames': frames}, open(out, 'w'), ensure_ascii=False, indent=0)
    print(f'{len(frames)} frames to {os.path.relpath(out, REPO)}')


if __name__ == '__main__':
    main()

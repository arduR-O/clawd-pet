# Clawd: a pet crab for Claude Code

Clawd is a small pixel crab that lives above your prompt in Claude Code. It watches Claude work
and reacts to it. It puts on glasses to read, gets dizzy when tests fail, and throws confetti
when you ship.

<p align="center"><img src="assets/clawd.svg" alt="Clawd above the Claude Code prompt: waving, reading, dizzy, watching you type, a Jedi, singing, petted, meditating and celebrating" width="640"></p>

Clawd works in the terminal, in VS Code and in the Claude desktop app. It costs almost nothing
to run. Clawd is an unofficial fan mod. Anthropic did not make or endorse it.

## Install

The easy way: ask Claude in Claude Code.

> Install the Clawd mod from https://github.com/arduR-O/clawd-pet

Claude does all the steps for you. To do them yourself:

1. In a shell, add the marketplace and install the plugin:

   ```sh
   claude plugin marketplace add arduR-O/clawd-pet
   claude plugin install clawd@clawd
   ```

2. Set your time zone. In Claude Code, run `/plugin configure clawd@clawd`. Set **UTC offset**
   to your offset from UTC, for example `+05:30` or `-07:00`.
3. In Claude Code, run `/reload-plugins`. Clawd appears above the prompt.

Clawd is tested with Claude Code 2.1.312.

## What Clawd does

**It reacts to Claude.**

- When Claude reads a file, Clawd puts on reading glasses.
- When a commit goes through, Clawd throws confetti.
- When a tool fails, Clawd winces. After two failures in a row, it facepalms. After three, it
  gets dizzy.
- When a turn takes more than two minutes, Clawd sweats. At the end, it celebrates.
- When Claude thinks, Clawd reacts to the word on the spinner. "Pondering…" can make it meditate.

**It reacts to you.**

- When you type, its eyes follow the cursor.
- When you allow a permission request, Clawd thanks you. When you refuse, it shrugs.
- After 50 minutes of work, Clawd stretches and tells you to take a break.
- If you set a leave time, Clawd counts down to it and tells you to go home.

**It has a life of its own.**

- A sun or a moon moves over its head with your local time.
- It sings lines from a songbook. The songbook can follow the music you listen to.
- It builds a sandcastle. Each finished turn adds one level.
- When you go away, it fishes, juggles, listens to music or takes a nap.
- While you read Claude's answer, it keeps still.

**Claude can talk to it.** With the `clawd` tool, Claude can make Clawd act, sing or say how it
is. Claude uses it only now and then.

<p align="center"><img src="assets/tricks.svg" alt="Clawd watches you type, thanks you for an ok, has a face for every mood, wears reading glasses, suggests stretch breaks and celebrates long turns" width="640"></p>

## Guests

Sometimes a guest comes. Each guest comes for a reason:

| Guest | When it comes |
|---|---|
| Sherlock, in a deerstalker | Claude runs `git blame`, `git bisect` or `git log -S`, or searches three times in a row. |
| A Jedi with a lightsaber | Claude runs `git push --force`. *"Use the --force, Luke."* |
| Gandalf | You refuse a destructive command at a permission request. *"You shall not pass!"* |
| The Terminator | Claude runs `kill`, `pkill` or `killall`. |
| A DeLorean at 88 | Claude runs `git revert`, `git reflog` or `git reset` without `--hard`, or checks out an old commit. |
| A ninja | Claude runs `git stash`. It comes back for `git stash pop`. |
| A rubber duck | You write a long prompt about a bug. |
| Neo | Claude loads a skill that Clawd does not know. *"I know pdf."* |
| A mug of coffee | You send your first prompt of the morning. This happens once a day. |
| An astronaut | A turn stops because of an API error. *"Houston, we have a problem."* |
| A 1-UP mushroom | The tests pass after they failed earlier in the same turn. |
| A whale | Claude runs `docker` or `podman`. |

<p align="center"><img src="assets/guests.svg" alt="Clawd's guests: Sherlock, a Jedi, Gandalf, the Terminator, a DeLorean, a ninja, a rubber duck, Neo, coffee, an astronaut, a 1-UP mushroom and a whale" width="640"></p>

To see a guest now, run `/pet <guest>`, for example `/pet sherlock`. To see a random guest, run
`/pet guest`.

## Commands

Click Clawd to pet it. In VS Code and the desktop app, click its name.

All commands start with `/pet`. When you type `/pet `, Claude Code shows what can come next.

| Command | What it does |
|---|---|
| `/pet` | Pets Clawd. Too many pets in a row annoy it. |
| `/pet treat` | Gives Clawd a treat. |
| `/pet trick` | Makes Clawd do a trick. |
| `/pet guest` | Brings a random guest. The same guest does not come twice in a row. |
| `/pet <emote>` | Shows an emote now. For example: `/pet meditate`, `/pet sing`, `/pet spin`, `/pet uwu`. |
| `/pet refresh-songs` | Writes a new songbook now. See [Settings](#settings). |
| `/pet off` | Hides Clawd in all chats. `/pet on` shows it again. |
| `/pet garden`, `/pet moss`, `/pet clawd` | Changes the pet: a garden that grows as you work, Moss, or Clawd. |

## Settings

To change a setting, run `/plugin configure clawd@clawd` in Claude Code.

| Setting | Default | What it does | Cost |
|---|---|---|---|
| UTC offset | `+00:00` | Sets your time zone, for example `+05:30`. Clawd uses it for the sun, the moon and the time of day. | None |
| Songbook: music, Last.fm user, Last.fm API key | Empty | Sets the songs that Clawd sings. See [The songbook](#the-songbook). | One small Haiku call per day. With Last.fm, also one Last.fm lookup per day. |
| Leave time | Empty | Sets when you leave work on weekdays, as `HH:MM`. Clawd counts down to it and tells you to go home. Empty turns it off. | None |
| Break every | `50` | Sets the minutes of work before Clawd suggests a break. `0` or empty turns it off. | None |

### The songbook

Clawd sings short lines from songs. The lines change each day. Sometimes Clawd changes the end of
a line into a joke about code. Clawd chooses the songs like this:

1. If you set **Songbook: Last.fm user** and **Songbook: Last.fm API key**, Clawd uses the songs
   you played recently. Get a key at [last.fm/api/accounts](https://www.last.fm/api/accounts).
   Claude Code keeps the key in secure storage.
2. If Last.fm is not set, or has no plays this week, Clawd uses **Songbook: music**. Set it to
   artists or songs, separated by commas.
3. If you set neither, Clawd sings its 30 built-in lines. These cost nothing.

`/pet refresh-songs` writes a new songbook now, without waiting for the next day.

### What it costs

The `clawd` tool adds a few hundred tokens to each request that Claude makes. A songbook costs
one small Haiku call per day, and only if you set the music or Last.fm settings. Everything else runs on your
computer and costs nothing.

## Updates

Claude Code does not update Clawd automatically unless you turn it on.

- **To update now:** in a shell, run `claude plugin update clawd@clawd`. Then run
  `/reload-plugins` in Claude Code.
- **To update automatically:** in Claude Code, run `/plugin`. Open **Marketplaces**, select
  **clawd**, then select **Enable auto-update**.

[CHANGELOG.md](CHANGELOG.md) tells you what changed in each version.

## Uninstall

In a shell, run:

```sh
claude plugin uninstall clawd@clawd
claude plugin marketplace remove clawd
```

## For Claude: installing Clawd

When a user asks you to install this mod:

1. Run `claude plugin marketplace add arduR-O/clawd-pet`, then `claude plugin install clawd@clawd`.
2. Ask the user for their time zone. Do not read it from the machine, because Claude Code often
   runs on a server set to UTC. Save it as an offset. For example, for India:
   `echo '{"utc_offset": "+05:30"}' | claude plugin configure clawd@clawd --values-stdin`
3. Tell the user about the optional settings, one line each: the songbook (music or Last.fm, one
   small Haiku call per day), leave time, and break reminders (on by default, every 50 minutes).
   Set only the settings they ask for. Never ask the user to paste an API key into the chat. Tell
   them to run `/plugin configure clawd@clawd` and enter it there.
4. Tell the user to run `/reload-plugins`. Clawd appears above the prompt.

## Developing

Clawd is a Claude Code hooks module. `hooks/register.tsx` connects to the session,
`hooks/clawd.ts` draws Clawd, and `tests/` holds the tests. With Claude Code installed, run:

```sh
claude plugin validate .
claude plugin test .
```

CI runs both on every push. The pictures in this README come from the mod's own drawing code:

```sh
bun scripts/hero.ts > assets/clawd.svg
bun scripts/tricks.ts > assets/tricks.svg
bun scripts/tricks.ts guests > assets/guests.svg
```

`promo/build.sh` makes the promo video. See [promo/README.md](promo/README.md).

## Credits

Some of Clawd's newer features come from ideas in
[physics-clawd-pet](https://github.com/Ramirez0291/physics-clawd-pet) by
[Ramirez0291](https://github.com/Ramirez0291). It is a desktop Clawd with cartoon physics. You can
pick it up and throw it across your screen. Its ideas gave us five features: faces for each mood,
permission reactions, long-turn celebrations, break reminders and eyes that follow the cursor. We did not copy its code. The two projects work in very different ways.
Try theirs too.

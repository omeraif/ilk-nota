# Songless — Mechanics Analysis (observed live)

Observed via Playwright browser automation on https://lessgames.com/songless (desktop 1396px + mobile-width checks), 2026-08-29. This document records every observed rule; İlk Nota reproduces this interaction model 1:1 unless noted.

## Home / onboarding
- The game IS the home page — no separate landing. First visit opens a **"How to Play" dialog**: one sentence ("Listen to a snippet. Guess the song, wrong answers unlock more."), a demo image, optional sign-in note. Dismissed via X; not shown again.
- Header: logo/title, help + stats + settings icon buttons, sign-in (accounts optional, only for cross-device stats/custom games).

## Puzzle structure
- **Genre tabs** ("All", "Rock", "Hip Hop") — each tab is an *independent* daily puzzle with its own state, attempts and share text (share says "the All song" / genre name).
- One deterministic song per day per genre (share text shows a global puzzle number, e.g. `[Songless #366]` — a day counter since launch, same for all players).
- Post-completion stats dialog shows a **countdown to the next daily** (`00:03:44:04` D:HH:MM:SS format).

## Attempts & snippet progression (measured exactly)
- **6 attempts total.** Snippet durations unlock in this exact sequence:

  | Attempt | Unlocked duration |
  |---|---|
  | 1 | **0.1 s** |
  | 2 | **0.5 s** |
  | 3 | **2 s** |
  | 4 | **4 s** |
  | 5 | **8 s** |
  | 6 | **15 s** |

- Both a **skip** and a **wrong guess** advance to the next duration (verified: wrong guess at 0.1s → label became "0.5 seconds"; five skips → 15 seconds).
- On the final (15 s) stage the "Skip" button becomes **"Give up"**.
- Used attempts render as a stacked list of rows above the player: `Skipped` for skips, the guessed `Title - Artist` for wrong guesses.
- The current unlocked duration is always displayed as text ("2 seconds").

## Audio / playback
- Audio is played through a **hidden 1×1 embedded iframe player** (Songless uses SoundCloud's widget; the player is never visibly rendered during play). İlk Nota uses the YouTube IFrame API with the same hidden-player technique.
- Central play button plays the snippet **from the track's start point for exactly the unlocked duration**, then stops automatically. Pressing again replays the same unlocked clip from the beginning of the snippet window. No pause-resume within a snippet; no overlapping audio (single player instance).
- A progress indicator reflects the unlocked window vs. the full 15 s maximum.

## Search / autocomplete
- Single text input, placeholder "Search a song".
- Typing (≥ ~2 chars) shows **~10 one-line suggestions** in the format `Title - Artist`.
- Matching is substring-based against **both title and artist** (typing "juicy" returned "Juicy - The Notorious B.I.G." plus several Juice WRLD songs — artist-name matches).
- **Selection is two-step:** clicking/choosing a suggestion stages it (fills the input), and the Skip button morphs into **"Submit"**. Only pressing Submit commits the guess. Free text that isn't a selected suggestion cannot be submitted.
- A wrong submit: the staged guess is appended to the attempt rows, the next duration unlocks, input clears, button returns to "Skip".

## Correct answer / game over
- Wrong final guess (or Give up) → **"Game Over — THE SONG WAS — Title - Artist"** panel with the revealed song; a **stats dialog** opens: Today / All time tabs, "Solved in N" (or X), community average, **guess distribution bars (1,2,3,4,5,6,X)**, a social-comparison line ("You and 56% of others failed today's game"), countdown to next puzzle, Share + Next buttons.
- Correct guess: same structure with win framing (solved-in count highlighted). (Win state inferred — not directly triggered during observation; modeled consistently.)
- Completed puzzles are **locked**: revisiting/refreshing shows the finished state, never a re-roll.

## Share format (captured from clipboard)
```
I couldn't find the All song 💀 [Songless #366]

⬜⬜⬜⬜⬜🟥

Play Today's Game: https://less.gg/songless
```
- One emoji per used attempt: ⬜ = skipped, 🟥 = wrong guess, 🟩 = correct (win). Unused attempts are omitted. Win text uses a positive phrase; loss uses "I couldn't find the … song 💀".

## Persistence
- All progress is client-side (localStorage) — per-genre daily state, streak and distribution stats survive refresh; accounts only sync them.

## Keyboard / accessibility
- Input is a combobox: typing filters, Enter submits the staged selection, suggestions clickable; buttons are real `<button>`s. (Songless's own a11y is thin — İlk Nota implements the full ARIA combobox pattern, Space to play, Escape to close, which matches the *intended* interaction model.)

## Deviations in İlk Nota (deliberate, per brief)
- Original brand, Turkish UI text, original night-time visual design (no copied assets/styling).
- Catalogue: Turkish rap only, single "Günün Şarkısı" mode v1 (genre tabs postponed; Songless's tab = playlist concept noted for v2).
- YouTube instead of SoundCloud as the embedded source; on embed failure a visible fallback player preserves completion.
- Daily rollover at **local midnight** (per product brief) rather than Songless's fixed reset hour.

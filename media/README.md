# Gameplay clips

Each game card on the site has a media slot wired up to a filename here. Drop the
file in with the matching name and it fades in over the card's panel on its own.
No file means no slot, just the flat panel, so nothing breaks while these are empty.

| Card              | File                    |
| ----------------- | ----------------------- |
| Service           | `service.mp4`           |
| Silk Lounge       | `silk-lounge.mp4`       |
| Untitled Ski Game | `ski-game.mp4`          |
| NERV Tracker      | `nerv-tracker.mp4`      |

The slot is the `data-media` attribute on `.wcard-prev` in `index.html`. Point it at
a `.gif` instead and the loader builds an `<img>` rather than a `<video>`.

Clips play muted and looping, and only on the card that's currently centred.

- Card preview area is 320x185, so a 16:9 crop lands right.
- 960x540 is plenty. These sit in a 185px-tall box.
- Keep them a few seconds and loopable. They restart every time the card comes round.
- Watch the file size, this repo is the whole site. Under ~2 MB each.

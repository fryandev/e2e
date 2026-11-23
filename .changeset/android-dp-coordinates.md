---
'@e2e-dev/mobile': minor
---

**Breaking:** on Android, the coordinates of `boundingBox()`, `device.viewport()`, `screen.tapAt()`, `screen.swipe()`, and the agent's `swipe` tool are in density-independent pixels (dp), like iOS points. They were in physical pixels before, so a fixed point landed in a different place on screens of different density. Divide a hard-coded Android point by the device's density, or use a percentage.

Android agent steps recorded with a bare point tap don't replay anymore (`REPLAY_STALE` with `--strict-cache`). Record them again with a `read-write` run.

Before a point action, a capture is taken to read the density if the screen hasn't been captured yet. Coordinates stay in physical pixels when agent-device doesn't report a density (an older Android helper). Coordinates on `device.unstable_raw` are always in physical pixels.

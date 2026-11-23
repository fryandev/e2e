---
'@e2e-dev/mobile': minor
---

**Breaking:** on Android, `boundingBox()`, `device.viewport()`, `screen.tapAt()`, `screen.swipe()`, and the agent's `swipe` tool use density-independent pixels (dp), like iOS points. They used the screen's physical pixels before, so a fixed point landed in a different place on screens of different density. Divide a hard-coded Android point by the device's density, or use a percentage.

Android agent steps recorded with a bare point tap don't replay anymore (`REPLAY_STALE` with `--strict-cache`). Record them again with a `read-write` run.

When the screen hasn't been captured yet, a capture is taken before a point action to read the density. Coordinates stay in physical pixels when agent-device doesn't report a density (an older Android helper). `device.unstable_raw` always uses physical pixels.

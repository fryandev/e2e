---
'@e2e-dev/mobile': patch
---

On Android, `boundingBox()`, the viewport, `tapAt`, `screen.swipe`, and the agent's `swipe` tool now use density-independent pixels (dp), the same unit as iOS points. Before, they used the screen's physical pixels, so a fixed point landed in a different place on screens of different density. The engine divides the bounds agent-device reports by the display density it reports, and multiplies each point by it before sending it. A tap at a point before anything has read the screen first reads it once to learn the density. When agent-device reports no density (an older Android helper), coordinates stay in physical pixels as before. Points written for physical pixels on Android need dividing by the device's density, or use percentages.

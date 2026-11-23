/** The real runner over a captured Android screen at several display densities: a test reads and names points in dp, the device gets physical pixels. */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { expect, it } from 'vitest';
import type { CaptureSnapshotResult } from 'agent-device';
import { buildEngine } from '../../src/engine.ts';
import { AgentDeviceSurface } from '../../src/surface.ts';
import type { Rect } from '../../src/support.ts';
import { createFakeClient } from '../helpers/fake-client.ts';

// The runner is internal to e2e; the test drives the built one, as tool-pixels.test.ts does.
const builtRunnerModule = new URL('../../../e2e/dist/run/runner.js', import.meta.url).href;
const { run } = (await import(builtRunnerModule)) as {
  run: (options: object) => Promise<{ status: string }>;
};

const CAPTURE = path.join(import.meta.dirname, '../fixtures/snapshots/android/gestures.json');

/** The density of the emulator the fixture was captured on: 1080 by 2400 pixels at 420 dpi. */
const CAPTURED_DENSITY = 2.625;

const captured: Pick<CaptureSnapshotResult, 'nodes'> = JSON.parse(readFileSync(CAPTURE, 'utf8'));

/** A length of the captured screen in the physical pixels of `density`. */
function px(value: number, density: number): number {
  return Math.round((value / CAPTURED_DENSITY) * density);
}

/** The captured screen as a device of `density` reports it: the same dp layout, in whole physical pixels. */
function atDensity(density: number): Pick<CaptureSnapshotResult, 'nodes'> {
  return {
    nodes: captured.nodes.map((node) => {
      const { rect } = node;
      if (rect === undefined) return node;
      return { ...node, rect: { x: px(rect.x, density), y: px(rect.y, density), width: px(rect.width, density), height: px(rect.height, density) } };
    }),
  };
}

function contains(rect: Rect, point: { x: number; y: number }): boolean {
  return point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height;
}

it.each([1, 2.625, 3.5])('lands a swipe built from boundingBox() and percentages on the same place at density %d', async (density) => {
  const root = fileURLToPath(new URL('../../../e2e/tests/tmp-projects/', import.meta.url));
  mkdirSync(root, { recursive: true });
  const project = mkdtempSync(path.join(root, 'density-'));
  const boxFile = path.join(project, 'box.json');
  writeFileSync(path.join(project, 'test.e2e.ts'), `import { writeFileSync } from 'node:fs';
    import { test } from 'e2e';
    test('swipe from the box', async ({ screen, device }) => {
      const box = await screen.getByTestId('long-press-target').boundingBox();
      writeFileSync(${JSON.stringify(boxFile)}, JSON.stringify({ box, viewport: await device.viewport() }));
      await screen.swipe({ from: { x: box.x + box.width / 2, y: box.y + box.height / 2 }, to: { x: '50%', y: '10%' } });
    });`);
  const device = atDensity(density);
  const fake = createFakeClient({
    'capture.snapshot': () => ({ ...device, appBundleId: 'dev.e2e.benchmark', androidSnapshot: { backend: 'android-helper', pixelDensity: density } }),
  });
  const engine = buildEngine(new AgentDeviceSurface({ platform: 'android' }, () => fake.client));
  try {
    const outcome = await run({ cwd: project, quiet: true, env: {}, rawConfig: {
      tests: '*.e2e.ts', targets: [{ name: 'android', platform: 'android', engine, app: { bundleId: 'dev.e2e.benchmark' } }], cache: 'off',
    } });
    expect(outcome.status).toBe('passed');

    const target = device.nodes.find((node) => node.identifier === 'long-press-target')?.rect;
    const capturedTarget = captured.nodes.find((node) => node.identifier === 'long-press-target')?.rect;
    if (target === undefined || capturedTarget === undefined) throw new Error('the capture has no long-press-target bounds');
    const { box, viewport }: { box: Rect; viewport: { width: number; height: number } } = JSON.parse(readFileSync(boxFile, 'utf8'));
    expect(viewport).toEqual({ width: 411, height: 914 });
    for (const side of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(box[side] - capturedTarget[side] / CAPTURED_DENSITY)).toBeLessThan(1);
    }

    const { from, to } = fake.lastArgs('interactions.swipe') as { from: { x: number; y: number }; to: { x: number; y: number } };
    expect(contains(target, from)).toBe(true);
    expect(Math.abs(to.x - 0.5 * px(1080, density))).toBeLessThanOrEqual(density);
    expect(Math.abs(to.y - 0.1 * px(2400, density))).toBeLessThanOrEqual(density);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

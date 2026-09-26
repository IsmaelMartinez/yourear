import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Audiogram, generateSummary } from './audiogram';
import { COLORS } from './audiogram-base';
import { HearingProfile, getExpectedThresholds } from '../types';

interface Call { method: string; args: unknown[]; state: Record<string, unknown> }
interface Path { kind: 'fill' | 'stroke'; ops: Call[]; state: Record<string, unknown>; index: number }

// jsdom has no canvas: record every 2D context call together with the style
// state (fillStyle, strokeStyle, lineWidth, line dash) in force at that moment.
function recordCanvas(): Call[] {
  const calls: Call[] = [];
  const state: Record<string, unknown> = { lineDash: [] };
  const ctx = new Proxy({}, {
    get: (_target, method: string) => (...args: unknown[]) => {
      if (method === 'setLineDash') state.lineDash = args[0];
      calls.push({ method, args, state: { ...state } });
    },
    set: (_target, prop: string, value) => { state[prop] = value; return true; },
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
  return calls;
}

// Group path-building calls into the fill/stroke that paints them.
function paths(calls: Call[]): Path[] {
  const result: Path[] = [];
  let ops: Call[] = [];
  calls.forEach((call, index) => {
    if (call.method === 'beginPath') ops = [];
    else if (['moveTo', 'lineTo', 'arc', 'closePath'].includes(call.method)) ops.push(call);
    else if (call.method === 'fill' || call.method === 'stroke') {
      result.push({ kind: call.method, ops, state: call.state, index });
    }
  });
  return result;
}

const points = (path: Path) => path.ops
  .filter(op => op.method === 'moveTo' || op.method === 'lineTo')
  .map(op => ({ x: op.args[0] as number, y: op.args[1] as number }));

// Mirrors the default 600x450 plot area: 125-8000 Hz on a log axis, -10..110 dB HL.
const PLOT_FREQS = [125, 250, 500, 1000, 2000, 4000, 8000];
const xFor = (freq: number) => 70 + (Math.log10(freq / 125) / Math.log10(8000 / 125)) * 490;
const yFor = (db: number) => 40 + ((db + 10) / 120) * 350;

describe('Audiogram canvas', () => {
  let calls: Call[];
  let container: HTMLElement;

  const profile = (overrides: Partial<HearingProfile> = {}): HearingProfile => ({
    id: 'p',
    name: 'p',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    thresholds: [
      { frequency: 500, rightEar: 10, leftEar: 20 },
      { frequency: 1000, rightEar: 15, leftEar: null },
      { frequency: 4000, rightEar: null, leftEar: 40 },
      { frequency: 8000, rightEar: 50, leftEar: 60 },
    ],
    ...overrides,
  });

  const render = (p: HearingProfile | null) => {
    const audiogram = new Audiogram(container);
    calls.length = 0;
    audiogram.setProfile(p);
    return audiogram;
  };

  const texts = () => calls.filter(c => c.method === 'fillText').map(c => c.args[0]);
  const band = () => paths(calls).filter(p => p.kind === 'fill' && p.state.fillStyle === COLORS.expectedRange);
  const medianLine = () => paths(calls).filter(p =>
    p.kind === 'stroke' && p.state.strokeStyle === COLORS.expectedLine);
  const circles = (color: string) => paths(calls).filter(p =>
    p.kind === 'stroke' && p.state.strokeStyle === color && p.ops.some(op => op.method === 'arc'));
  const crosses = (color: string) => paths(calls).filter(p =>
    p.kind === 'stroke' && p.state.strokeStyle === color && p.state.lineWidth === 3
    && p.ops.filter(op => op.method === 'moveTo').length === 2);

  beforeEach(() => {
    calls = recordCanvas();
    container = document.createElement('div');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appends a decorative canvas and draws only the empty grid without a profile', () => {
    render(null);

    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(texts()).toContain('Frequency (Hz)');
    expect(circles(COLORS.rightEar)).toHaveLength(0);
    expect(crosses(COLORS.leftEar)).toHaveLength(0);
    expect(texts()).not.toContain('Right ear');
  });

  it('shades the typical p10-p90 range for the age beneath the grid', () => {
    render(profile({ age: 60 }));
    const expected = getExpectedThresholds(60);

    const [area] = band();
    expect(band()).toHaveLength(1);
    const outline = points(area);
    const top = PLOT_FREQS.map(f => ({ x: xFor(f), y: yFor(expected[f].p10) }));
    const bottom = PLOT_FREQS.map(f => ({ x: xFor(f), y: yFor(expected[f].p90) })).reverse();
    expect(outline).toHaveLength(top.length + bottom.length);
    [...top, ...bottom].forEach((pt, i) => {
      expect(outline[i].x).toBeCloseTo(pt.x);
      expect(outline[i].y).toBeCloseTo(pt.y);
    });
    expect(area.ops.at(-1)?.method).toBe('closePath');

    // Drawn first, so the grid border is painted over it
    const gridBorder = calls.findIndex(c => c.method === 'strokeRect');
    expect(area.index).toBeLessThan(gridBorder);
  });

  it('draws the dashed median line for the age', () => {
    render(profile({ age: 60 }));
    const expected = getExpectedThresholds(60);

    const [line] = medianLine();
    expect(medianLine()).toHaveLength(1);
    expect(line.state.lineDash).toEqual([5, 5]);
    const drawn = points(line);
    expect(drawn).toHaveLength(PLOT_FREQS.length);
    PLOT_FREQS.forEach((f, i) => {
      expect(drawn[i].x).toBeCloseTo(xFor(f));
      expect(drawn[i].y).toBeCloseTo(yFor(expected[f].median));
    });
  });

  it('places the expected range lower on the chart for an older listener', () => {
    render(profile({ age: 30 }));
    const youngMedian = points(medianLine()[0]).at(-1)!.y;
    render(profile({ age: 75 }));
    const olderMedian = points(medianLine()[0]).at(-1)!.y;

    expect(olderMedian).toBeGreaterThan(youngMedian);
  });

  it('omits the expected range, median line and its legend entry without an age', () => {
    render(profile());

    expect(band()).toHaveLength(0);
    expect(medianLine()).toHaveLength(0);
    expect(texts().some(t => String(t).startsWith('Typical range'))).toBe(false);
    expect(calls.some(c => c.method === 'fillRect' && c.state.fillStyle === COLORS.expectedRange)).toBe(false);
  });

  it('marks the right ear with circles and the left ear with crosses at each tested threshold', () => {
    const p = profile();
    render(p);

    const right = p.thresholds.filter(t => t.rightEar !== null);
    const left = p.thresholds.filter(t => t.leftEar !== null);
    // One marker per response, plus one legend marker per ear drawn last
    const rightMarkers = circles(COLORS.rightEar);
    const leftMarkers = crosses(COLORS.leftEar);
    expect(rightMarkers).toHaveLength(right.length + 1);
    expect(leftMarkers).toHaveLength(left.length + 1);

    right.forEach((t, i) => {
      const [x, y] = rightMarkers[i].ops[0].args as number[];
      expect(x).toBeCloseTo(xFor(t.frequency));
      expect(y).toBeCloseTo(yFor(t.rightEar!));
    });
    left.forEach((t, i) => {
      const [a, , b] = leftMarkers[i].ops;
      const [x1, y1] = a.args as number[];
      const [x2, y2] = b.args as number[];
      // The two strokes of the X cross at the threshold point
      expect((x1 + x2) / 2).toBeCloseTo(xFor(t.frequency));
      expect(y1 + 8).toBeCloseTo(yFor(t.leftEar!));
      expect(y2 + 8).toBeCloseTo(yFor(t.leftEar!));
    });
  });

  it('joins each ear\'s responses with a solid line, skipping missing frequencies', () => {
    const p = profile();
    render(p);

    const line = (color: string) => paths(calls).find(path =>
      path.kind === 'stroke' && path.state.strokeStyle === color && path.state.lineWidth === 2);
    const rightLine = points(line(COLORS.rightEar)!);
    const leftLine = points(line(COLORS.leftEar)!);

    expect(rightLine.map(pt => pt.y)).toEqual([10, 15, 50].map(yFor));
    expect(leftLine.map(pt => pt.y)).toEqual([20, 40, 60].map(yFor));
    expect(line(COLORS.rightEar)!.state.lineDash).toEqual([]);
  });

  it('lists both ears in the legend, plus the typical range when the age is known', () => {
    render(profile({ age: 45 }));

    const legend = texts().slice(-3);
    expect(legend).toEqual(['Typical range (45y)', 'Left ear', 'Right ear']);
    expect(calls.some(c => c.method === 'fillRect' && c.state.fillStyle === COLORS.expectedRange)).toBe(true);

    render(profile());
    expect(texts().slice(-2)).toEqual(['Left ear', 'Right ear']);
  });

  it('clears the plotted data when the profile is removed', () => {
    const audiogram = render(profile({ age: 45 }));
    calls.length = 0;
    audiogram.setProfile(null);

    expect(calls[0]).toMatchObject({ method: 'fillRect', state: { fillStyle: COLORS.background } });
    expect(band()).toHaveLength(0);
    expect(circles(COLORS.rightEar)).toHaveLength(0);
    expect(texts()).not.toContain('Right ear');
  });
});

describe('generateSummary', () => {
  const createProfile = (overrides: Partial<HearingProfile> = {}): HearingProfile => ({
    id: 'test-id',
    name: 'Test Profile',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    thresholds: [
      { frequency: 250, rightEar: 10, leftEar: 15 },
      { frequency: 500, rightEar: 10, leftEar: 10 },
      { frequency: 1000, rightEar: 15, leftEar: 10 },
      { frequency: 2000, rightEar: 20, leftEar: 20 },
      { frequency: 4000, rightEar: 25, leftEar: 30 },
      { frequency: 8000, rightEar: 35, leftEar: 40 },
    ],
    ...overrides,
  });

  it('generates a summary header', () => {
    const profile = createProfile();
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Hearing Assessment Summary');
  });

  it('includes age when provided', () => {
    const profile = createProfile({ age: 45 });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Age: 45 years');
  });

  it('excludes age line when not provided', () => {
    const profile = createProfile({ age: undefined });
    const summary = generateSummary(profile);
    
    expect(summary).not.toContain('Age:');
  });

  it('calculates PTA for right ear', () => {
    // PTA uses 500, 1000, 2000 Hz
    // Right ear: 10 + 15 + 20 = 45 / 3 = 15 dB HL
    const profile = createProfile();
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Right ear: 15 dB HL');
  });

  it('calculates PTA for left ear', () => {
    // Left ear: 10 + 10 + 20 = 40 / 3 = 13.33 ≈ 13 dB HL
    const profile = createProfile();
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Left ear: 13 dB HL');
  });

  it('classifies normal hearing correctly', () => {
    const profile = createProfile({
      thresholds: [
        { frequency: 500, rightEar: 10, leftEar: 10 },
        { frequency: 1000, rightEar: 10, leftEar: 10 },
        { frequency: 2000, rightEar: 10, leftEar: 10 },
      ],
    });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Normal');
  });

  it('classifies mild hearing loss correctly', () => {
    const profile = createProfile({
      thresholds: [
        { frequency: 500, rightEar: 30, leftEar: 30 },
        { frequency: 1000, rightEar: 35, leftEar: 35 },
        { frequency: 2000, rightEar: 40, leftEar: 40 },
      ],
    });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Mild loss');
  });

  it('includes expected PTA when age is provided', () => {
    const profile = createProfile({ age: 50 });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('Expected PTA for age 50');
  });

  it('shows positive comparison for better-than-expected hearing', () => {
    const profile = createProfile({
      age: 60,
      thresholds: [
        { frequency: 500, rightEar: 5, leftEar: 5 },
        { frequency: 1000, rightEar: 5, leftEar: 5 },
        { frequency: 2000, rightEar: 5, leftEar: 5 },
      ],
    });
    const summary = generateSummary(profile);
    
    expect(summary).toContain('better than or equal to average');
  });

  it('always includes disclaimer', () => {
    const profile = createProfile();
    const summary = generateSummary(profile);
    
    expect(summary).toContain('self-assessment tool');
    expect(summary).toContain('audiologist');
  });

  it('handles null threshold values', () => {
    const profile = createProfile({
      thresholds: [
        { frequency: 500, rightEar: null, leftEar: 10 },
        { frequency: 1000, rightEar: null, leftEar: 10 },
        { frequency: 2000, rightEar: null, leftEar: 10 },
      ],
    });
    const summary = generateSummary(profile);
    
    // Should still generate summary with available data
    expect(summary).toContain('Left ear');
  });

  it('handles quick test with only 3 frequencies', () => {
    const profile = createProfile({
      thresholds: [
        { frequency: 1000, rightEar: 15, leftEar: 15 },
        { frequency: 4000, rightEar: 25, leftEar: 25 },
        { frequency: 8000, rightEar: 35, leftEar: 35 },
      ],
    });
    const summary = generateSummary(profile);
    
    // 500 and 2000 Hz are missing, so it averages the tested frequencies: (15 + 25 + 35) / 3 = 25
    expect(summary).not.toContain('NaN');
    expect(summary).toContain('Right ear: 25 dB HL (🟢 Slight loss)');
    expect(summary).toContain('Left ear: 25 dB HL (🟢 Slight loss)');
  });

  it('averages a 0 dB ear with the other ear for the age verdict', () => {
    // Average (0 + 20) / 2 = 10 vs expected ~9 at age 60 -> typical. Treating 0 as missing gives 20 -> worse.
    const profile = createProfile({
      age: 60,
      thresholds: [
        { frequency: 500, rightEar: 0, leftEar: 20 },
        { frequency: 1000, rightEar: 0, leftEar: 20 },
        { frequency: 2000, rightEar: 0, leftEar: 20 },
      ],
    });
    expect(generateSummary(profile)).toContain('Your hearing is typical for your age');
  });
});


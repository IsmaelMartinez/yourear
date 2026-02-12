/**
 * Shared audiogram canvas base - grid, labels, coordinate mapping, and markers.
 *
 * Both Audiogram and ComparisonAudiogram extend this to avoid duplicating
 * ~120 lines of identical grid/label/marker drawing code.
 */

import { HearingThreshold, TEST_FREQUENCIES, formatFrequency } from '../types';

/**
 * Colors for audiogram rendering
 *
 * NOTE: rightEar (#ff6b6b) and leftEar (#4ecdc4) are also defined as CSS variables
 * (--accent-right and --accent-left) in styles.css. Canvas API cannot read CSS
 * variables, so we duplicate them here. Keep them in sync if changing!
 */
export const COLORS = {
  background: '#0a0a0f',
  grid: '#2a2a35',
  gridLight: '#1a1a22',
  text: '#a0a0b0',
  rightEar: '#ff6b6b',
  leftEar: '#4ecdc4',
  expectedRange: 'rgba(251, 191, 36, 0.15)',
  expectedLine: '#fbbf24',
};

export const FREQUENCIES = [125, 250, 500, 1000, 2000, 4000, 8000];
export const DB_MIN = -10;
export const DB_MAX = 110;
export const PADDING = { top: 40, right: 40, bottom: 60, left: 70 };

export abstract class AudiogramBase {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;

  constructor(container: HTMLElement, width: number, height: number) {
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = `${width}px`;
    this.canvas.style.height = 'auto';
    this.canvas.setAttribute('role', 'presentation');
    this.canvas.setAttribute('aria-hidden', 'true');

    this.ctx = this.canvas.getContext('2d')!;
    container.appendChild(this.canvas);
  }

  toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  protected freqToX(freq: number): number {
    const plotWidth = this.width - PADDING.left - PADDING.right;
    const minLog = Math.log10(FREQUENCIES[0]);
    const maxLog = Math.log10(FREQUENCIES[FREQUENCIES.length - 1]);
    return PADDING.left + ((Math.log10(freq) - minLog) / (maxLog - minLog)) * plotWidth;
  }

  protected dbToY(db: number): number {
    const plotHeight = this.height - PADDING.top - PADDING.bottom;
    return PADDING.top + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * plotHeight;
  }

  protected clearCanvas(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  protected drawGrid(): void {
    const { ctx, width, height } = this;

    ctx.lineWidth = 1;

    FREQUENCIES.forEach(freq => {
      const x = this.freqToX(freq);
      ctx.strokeStyle = COLORS.gridLight;
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, height - PADDING.bottom);
      ctx.stroke();
    });

    for (let db = DB_MIN; db <= DB_MAX; db += 10) {
      const y = this.dbToY(db);
      ctx.strokeStyle = db % 20 === 0 ? COLORS.grid : COLORS.gridLight;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(width - PADDING.right, y);
      ctx.stroke();
    }

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      PADDING.left, PADDING.top,
      width - PADDING.left - PADDING.right,
      height - PADDING.top - PADDING.bottom,
    );
  }

  protected drawLabels(): void {
    const { ctx, width, height } = this;

    ctx.fillStyle = COLORS.text;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    FREQUENCIES.forEach(freq => {
      ctx.fillText(formatFrequency(freq, 'short'), this.freqToX(freq), height - PADDING.bottom + 20);
    });

    ctx.font = '13px "DM Sans", sans-serif';
    ctx.fillText('Frequency (Hz)', width / 2, height - 10);

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';

    for (let db = DB_MIN; db <= DB_MAX; db += 20) {
      ctx.fillText(String(db), PADDING.left - 10, this.dbToY(db) + 4);
    }

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = '13px "DM Sans", sans-serif';
    ctx.fillText('Hearing Level (dB HL)', 0, 0);
    ctx.restore();
  }

  protected drawThresholdData(thresholds: HearingThreshold[], rightColor: string, leftColor: string, markerSize = 8): void {
    const rightPoints: { x: number; y: number }[] = [];
    const leftPoints: { x: number; y: number }[] = [];

    thresholds.forEach(t => {
      if (!TEST_FREQUENCIES.includes(t.frequency as typeof TEST_FREQUENCIES[number])) return;
      const x = this.freqToX(t.frequency);
      if (t.rightEar !== null) rightPoints.push({ x, y: this.dbToY(t.rightEar) });
      if (t.leftEar !== null) leftPoints.push({ x, y: this.dbToY(t.leftEar) });
    });

    this.drawLine(rightPoints, rightColor);
    this.drawLine(leftPoints, leftColor);

    thresholds.forEach(t => {
      if (!TEST_FREQUENCIES.includes(t.frequency as typeof TEST_FREQUENCIES[number])) return;
      const x = this.freqToX(t.frequency);
      if (t.rightEar !== null) this.drawCircle(x, this.dbToY(t.rightEar), rightColor, markerSize);
      if (t.leftEar !== null) this.drawX(x, this.dbToY(t.leftEar), leftColor, markerSize);
    });
  }

  protected drawLine(points: { x: number; y: number }[], color: string): void {
    if (points.length < 2) return;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.stroke();
  }

  protected drawCircle(x: number, y: number, color: string, size = 8): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  protected drawX(x: number, y: number, color: string, size = 8): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x - size, y - size);
    this.ctx.lineTo(x + size, y + size);
    this.ctx.moveTo(x + size, y - size);
    this.ctx.lineTo(x - size, y + size);
    this.ctx.stroke();
  }
}

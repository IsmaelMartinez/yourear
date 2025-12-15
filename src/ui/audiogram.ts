/**
 * Audiogram visualization using Canvas
 * Standard conventions: O = Right ear, X = Left ear
 */

import { HearingProfile, HearingThreshold, classifyHearingLoss, TEST_FREQUENCIES, getExpectedThresholds, formatFrequency } from '../types';

interface Colors {
  background: string;
  grid: string;
  gridLight: string;
  text: string;
  rightEar: string;
  leftEar: string;
  expectedRange: string;
  expectedLine: string;
}

/**
 * Colors for audiogram rendering
 * 
 * NOTE: rightEar (#ff6b6b) and leftEar (#4ecdc4) are also defined as CSS variables
 * (--accent-right and --accent-left) in styles.css. Canvas API cannot read CSS
 * variables, so we duplicate them here. Keep them in sync if changing!
 */
const COLORS: Colors = {
  background: '#0a0a0f',
  grid: '#2a2a35',
  gridLight: '#1a1a22',
  text: '#a0a0b0',
  rightEar: '#ff6b6b',   // Sync with --accent-right in styles.css
  leftEar: '#4ecdc4',    // Sync with --accent-left in styles.css
  expectedRange: 'rgba(251, 191, 36, 0.15)',
  expectedLine: '#fbbf24', // Sync with --accent-warning in styles.css
};

const FREQUENCIES = [125, 250, 500, 1000, 2000, 4000, 8000];
const DB_MIN = -10;
const DB_MAX = 110;
const PADDING = { top: 40, right: 40, bottom: 60, left: 70 };

export class Audiogram {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private profile: HearingProfile | null = null;

  constructor(container: HTMLElement, width = 600, height = 450) {
    this.width = width;
    this.height = height;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = `${width}px`;
    this.canvas.style.height = 'auto';
    
    // Accessibility: Mark canvas as presentational since we provide text alternatives
    this.canvas.setAttribute('role', 'presentation');
    this.canvas.setAttribute('aria-hidden', 'true');
    
    this.ctx = this.canvas.getContext('2d')!;
    container.appendChild(this.canvas);
    this.draw();
  }

  setProfile(profile: HearingProfile | null): void {
    this.profile = profile;
    this.draw();
  }

  /** Get the canvas element for export purposes */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /** Get the canvas as a data URL (PNG format) */
  toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  private freqToX(freq: number): number {
    const plotWidth = this.width - PADDING.left - PADDING.right;
    const minLog = Math.log10(FREQUENCIES[0]);
    const maxLog = Math.log10(FREQUENCIES[FREQUENCIES.length - 1]);
    return PADDING.left + ((Math.log10(freq) - minLog) / (maxLog - minLog)) * plotWidth;
  }

  private dbToY(db: number): number {
    const plotHeight = this.height - PADDING.top - PADDING.bottom;
    return PADDING.top + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * plotHeight;
  }

  private draw(): void {
    const { ctx, width, height } = this;
    
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);
    
    // Only show age-expected range (removed generic "normal range" as it's
    // misleading - clinical normal ≤20dB is unrealistic for older adults
    // at higher frequencies like 4kHz and 8kHz)
    if (this.profile?.age) {
      this.drawExpectedRange(this.profile.age);
    }
    
    this.drawGrid();
    this.drawLabels();
    
    if (this.profile) {
      this.drawThresholds(this.profile.thresholds);
      this.drawLegend();
    }
  }

  private drawExpectedRange(age: number): void {
    const expected = getExpectedThresholds(age);
    const ctx = this.ctx;
    
    // Draw filled area between p10 and p90 (typical range for age)
    ctx.fillStyle = COLORS.expectedRange;
    ctx.beginPath();
    
    // Build points for top line (p10) and bottom line (p90)
    const topPoints = FREQUENCIES.map(f => ({
      x: this.freqToX(f),
      y: this.dbToY(expected[f].p10)
    }));
    const bottomPoints = FREQUENCIES.map(f => ({
      x: this.freqToX(f),
      y: this.dbToY(expected[f].p90)
    }));
    
    // Draw clockwise: top left → top right → bottom right → bottom left
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i < topPoints.length; i++) {
      ctx.lineTo(topPoints[i].x, topPoints[i].y);
    }
    for (let i = bottomPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Draw median line (expected for age)
    ctx.strokeStyle = COLORS.expectedLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const medianPoints = FREQUENCIES.map(f => ({
      x: this.freqToX(f),
      y: this.dbToY(expected[f].median)
    }));
    ctx.moveTo(medianPoints[0].x, medianPoints[0].y);
    for (let i = 1; i < medianPoints.length; i++) {
      ctx.lineTo(medianPoints[i].x, medianPoints[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawGrid(): void {
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
    ctx.strokeRect(PADDING.left, PADDING.top, width - PADDING.left - PADDING.right, height - PADDING.top - PADDING.bottom);
  }

  private drawLabels(): void {
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

  private drawThresholds(thresholds: HearingThreshold[]): void {
    const rightPoints: { x: number; y: number }[] = [];
    const leftPoints: { x: number; y: number }[] = [];
    
    thresholds.forEach(t => {
      if (!TEST_FREQUENCIES.includes(t.frequency as typeof TEST_FREQUENCIES[number])) return;
      const x = this.freqToX(t.frequency);
      if (t.rightEar !== null) rightPoints.push({ x, y: this.dbToY(t.rightEar) });
      if (t.leftEar !== null) leftPoints.push({ x, y: this.dbToY(t.leftEar) });
    });
    
    this.drawLine(rightPoints, COLORS.rightEar);
    this.drawLine(leftPoints, COLORS.leftEar);
    
    thresholds.forEach(t => {
      if (!TEST_FREQUENCIES.includes(t.frequency as typeof TEST_FREQUENCIES[number])) return;
      const x = this.freqToX(t.frequency);
      if (t.rightEar !== null) this.drawCircle(x, this.dbToY(t.rightEar), COLORS.rightEar);
      if (t.leftEar !== null) this.drawX(x, this.dbToY(t.leftEar), COLORS.leftEar);
    });
  }

  private drawLine(points: { x: number; y: number }[], color: string): void {
    if (points.length < 2) return;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => this.ctx.lineTo(p.x, p.y));
    this.ctx.stroke();
  }

  private drawCircle(x: number, y: number, color: string): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawX(x: number, y: number, color: string): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 8, y - 8);
    this.ctx.lineTo(x + 8, y + 8);
    this.ctx.moveTo(x + 8, y - 8);
    this.ctx.lineTo(x - 8, y + 8);
    this.ctx.stroke();
  }

  private drawLegend(): void {
    const x = PADDING.left + 20;
    // Position from bottom, working upward
    let y = this.height - PADDING.bottom - 20;
    
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = '11px "DM Sans", sans-serif';
    this.ctx.textAlign = 'left';
    
    // Expected for age (if shown) - draw first (bottom)
    if (this.profile?.age) {
      this.ctx.fillStyle = COLORS.expectedRange;
      this.ctx.fillRect(x - 10, y - 6, 20, 12);
      this.ctx.fillStyle = COLORS.text;
      this.ctx.fillText(`Typical range (${this.profile.age}y)`, x + 18, y + 4);
      y -= 22;
    }
    
    // Left ear
    this.drawX(x, y, COLORS.leftEar);
    this.ctx.fillText('Left ear', x + 18, y + 4);
    y -= 22;
    
    // Right ear (top of legend)
    this.drawCircle(x, y, COLORS.rightEar);
    this.ctx.fillText('Right ear', x + 18, y + 4);
  }
}

export function generateSummary(profile: HearingProfile): string {
  const ptaFreqs = [500, 1000, 2000];
  
  const calcPTA = (ear: 'rightEar' | 'leftEar') => {
    const values = ptaFreqs
      .map(f => profile.thresholds.find(t => t.frequency === f)?.[ear])
      .filter((v): v is number => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  
  const formatGrade = (grade: string) => ({
    'normal': '✅ Normal',
    'slight': '🟢 Slight loss',
    'mild': '🟡 Mild loss',
    'moderate': '🟠 Moderate loss',
    'moderately-severe': '🟠 Moderately severe loss',
    'severe': '🔴 Severe loss',
    'profound': '🔴 Profound loss',
  }[grade] || grade);
  
  const lines = ['📊 Hearing Assessment Summary'];
  
  if (profile.age) {
    lines.push(`👤 Age: ${profile.age} years`);
  }
  lines.push('');
  
  const rightPTA = calcPTA('rightEar');
  const leftPTA = calcPTA('leftEar');
  
  if (rightPTA !== null) {
    lines.push(`Right ear: ${rightPTA.toFixed(0)} dB HL (${formatGrade(classifyHearingLoss(rightPTA))})`);
  }
  if (leftPTA !== null) {
    lines.push(`Left ear: ${leftPTA.toFixed(0)} dB HL (${formatGrade(classifyHearingLoss(leftPTA))})`);
  }
  
  // Age comparison
  if (profile.age && (rightPTA !== null || leftPTA !== null)) {
    const expected = getExpectedThresholds(profile.age);
    const expectedPTA = (expected[500].median + expected[1000].median + expected[2000].median) / 3;
    
    lines.push('');
    lines.push(`📈 Expected PTA for age ${profile.age}: ~${expectedPTA.toFixed(0)} dB HL`);
    
    const avgPTA = ((rightPTA || 0) + (leftPTA || 0)) / (rightPTA && leftPTA ? 2 : 1);
    if (avgPTA <= expectedPTA) {
      lines.push('✨ Your hearing is better than or equal to average for your age!');
    } else if (avgPTA <= expectedPTA + 10) {
      lines.push('👍 Your hearing is typical for your age.');
    } else {
      lines.push('📋 Your hearing shows more loss than typical for your age.');
    }
  }
  
  lines.push('');
  lines.push('⚠️ This is a self-assessment tool, not a medical diagnosis.');
  lines.push('Please consult an audiologist for professional evaluation.');
  
  return lines.join('\n');
}

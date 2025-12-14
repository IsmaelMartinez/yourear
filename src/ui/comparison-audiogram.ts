/**
 * Comparison Audiogram - Overlay multiple hearing profiles for trend analysis
 */

import { HearingProfile, HearingThreshold, TEST_FREQUENCIES, formatFrequency } from '../types';

interface ProfileWithStyle {
  profile: HearingProfile;
  color: string;
  opacity: number;
}

const COLORS = {
  background: '#0a0a0f',
  grid: '#2a2a35',
  gridLight: '#1a1a22',
  text: '#a0a0b0',
};

// Distinct colors for different profiles
const PROFILE_COLORS = [
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#fbbf24', // Yellow
  '#a78bfa', // Purple
  '#34d399', // Green
];

const FREQUENCIES = [125, 250, 500, 1000, 2000, 4000, 8000];
const DB_MIN = -10;
const DB_MAX = 110;
const PADDING = { top: 40, right: 40, bottom: 60, left: 70 };

export class ComparisonAudiogram {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private profiles: ProfileWithStyle[] = [];

  constructor(container: HTMLElement, width = 700, height = 500) {
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
    this.draw();
  }

  /** Set profiles to compare (up to 5) */
  setProfiles(profiles: HearingProfile[]): void {
    this.profiles = profiles.slice(0, 5).map((profile, index) => ({
      profile,
      color: PROFILE_COLORS[index],
      opacity: index === 0 ? 1 : 0.7, // Most recent is fully opaque
    }));
    this.draw();
  }

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
    
    this.drawGrid();
    this.drawLabels();
    
    // Draw all profiles (oldest first so newest is on top)
    [...this.profiles].reverse().forEach(({ profile, color, opacity }) => {
      this.drawProfileThresholds(profile.thresholds, color, opacity);
    });
    
    if (this.profiles.length > 0) {
      this.drawLegend();
    }
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

  private drawProfileThresholds(thresholds: HearingThreshold[], color: string, opacity: number): void {
    const ctx = this.ctx;
    ctx.globalAlpha = opacity;
    
    // Collect points for both ears
    const rightPoints: { x: number; y: number }[] = [];
    const leftPoints: { x: number; y: number }[] = [];
    
    thresholds.forEach(t => {
      if (!TEST_FREQUENCIES.includes(t.frequency as typeof TEST_FREQUENCIES[number])) return;
      const x = this.freqToX(t.frequency);
      if (t.rightEar !== null) rightPoints.push({ x, y: this.dbToY(t.rightEar) });
      if (t.leftEar !== null) leftPoints.push({ x, y: this.dbToY(t.leftEar) });
    });
    
    // Draw lines
    this.drawLine(rightPoints, color);
    this.drawLine(leftPoints, color);
    
    // Draw markers
    thresholds.forEach(t => {
      if (!TEST_FREQUENCIES.includes(t.frequency as typeof TEST_FREQUENCIES[number])) return;
      const x = this.freqToX(t.frequency);
      if (t.rightEar !== null) this.drawCircle(x, this.dbToY(t.rightEar), color);
      if (t.leftEar !== null) this.drawX(x, this.dbToY(t.leftEar), color);
    });
    
    ctx.globalAlpha = 1;
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
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawX(x: number, y: number, color: string): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 6, y - 6);
    this.ctx.lineTo(x + 6, y + 6);
    this.ctx.moveTo(x + 6, y - 6);
    this.ctx.lineTo(x - 6, y + 6);
    this.ctx.stroke();
  }

  private drawLegend(): void {
    const x = PADDING.left + 20;
    let y = this.height - PADDING.bottom - 20;
    
    this.ctx.font = '11px "DM Sans", sans-serif';
    this.ctx.textAlign = 'left';
    
    // Draw legend for each profile (newest at bottom, working up)
    this.profiles.forEach(({ profile, color }, index) => {
      const dateStr = profile.createdAt.toLocaleDateString();
      const label = `${dateStr}${profile.age ? ` (${profile.age}y)` : ''}`;
      
      // Color swatch
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = index === 0 ? 1 : 0.7;
      this.ctx.fillRect(x - 10, y - 6, 20, 12);
      this.ctx.globalAlpha = 1;
      
      // Label
      this.ctx.fillStyle = COLORS.text;
      this.ctx.fillText(label, x + 18, y + 4);
      
      y -= 20;
    });
  }
}

/**
 * Calculate the change in PTA between two profiles
 * Uses available frequencies from 500, 1000, 2000 Hz (standard PTA)
 * Falls back to any available frequencies if standard ones aren't present
 */
export function calculatePTAChange(
  older: HearingProfile,
  newer: HearingProfile
): { right: number | null; left: number | null } {
  const ptaFreqs = [500, 1000, 2000];
  
  const calcPTA = (profile: HearingProfile, ear: 'rightEar' | 'leftEar'): number | null => {
    const isValidNumber = (v: number | null | undefined): v is number => 
      v !== null && v !== undefined && !isNaN(v);
    
    // Try standard PTA frequencies first
    let values = ptaFreqs
      .map(f => profile.thresholds.find(t => t.frequency === f)?.[ear])
      .filter(isValidNumber);
    
    // If not enough standard frequencies, use all available
    if (values.length < 2) {
      values = profile.thresholds
        .map(t => t[ear])
        .filter(isValidNumber);
    }
    
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };
  
  const olderRight = calcPTA(older, 'rightEar');
  const newerRight = calcPTA(newer, 'rightEar');
  const olderLeft = calcPTA(older, 'leftEar');
  const newerLeft = calcPTA(newer, 'leftEar');
  
  return {
    right: olderRight !== null && newerRight !== null ? newerRight - olderRight : null,
    left: olderLeft !== null && newerLeft !== null ? newerLeft - olderLeft : null,
  };
}


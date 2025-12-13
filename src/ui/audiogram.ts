/**
 * Audiogram visualization using Canvas
 * Follows standard audiogram conventions:
 * - X-axis: Frequency (log scale, 125-8000 Hz)
 * - Y-axis: Hearing level (dB HL, -10 to 120, inverted)
 * - O = Right ear, X = Left ear
 */

import { HearingProfile, HearingThreshold, classifyHearingLoss, TEST_FREQUENCIES } from '../types';

export interface AudiogramOptions {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  colors: {
    background: string;
    grid: string;
    gridLight: string;
    text: string;
    rightEar: string;
    leftEar: string;
    normalRange: string;
  };
}

const DEFAULT_OPTIONS: AudiogramOptions = {
  width: 600,
  height: 450,
  padding: { top: 40, right: 40, bottom: 60, left: 70 },
  colors: {
    background: '#0a0a0f',
    grid: '#2a2a35',
    gridLight: '#1a1a22',
    text: '#a0a0b0',
    rightEar: '#ff6b6b',
    leftEar: '#4ecdc4',
    normalRange: 'rgba(78, 205, 196, 0.1)',
  },
};

// Standard audiogram frequency positions
const FREQUENCIES = [125, 250, 500, 1000, 2000, 4000, 8000];
const DB_RANGE = { min: -10, max: 110 };

export class Audiogram {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: AudiogramOptions;
  private profile: HearingProfile | null = null;

  constructor(container: HTMLElement, options: Partial<AudiogramOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = `${this.options.width}px`;
    this.canvas.style.height = 'auto';
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    container.appendChild(this.canvas);
    this.draw();
  }

  /**
   * Update the displayed profile
   */
  setProfile(profile: HearingProfile | null): void {
    this.profile = profile;
    this.draw();
  }

  /**
   * Convert frequency to X position
   */
  private freqToX(freq: number): number {
    const { padding, width } = this.options;
    const plotWidth = width - padding.left - padding.right;
    
    // Log scale
    const minLog = Math.log10(FREQUENCIES[0]);
    const maxLog = Math.log10(FREQUENCIES[FREQUENCIES.length - 1]);
    const freqLog = Math.log10(freq);
    
    return padding.left + ((freqLog - minLog) / (maxLog - minLog)) * plotWidth;
  }

  /**
   * Convert dB to Y position (inverted - higher dB = lower on chart)
   */
  private dbToY(db: number): number {
    const { padding, height } = this.options;
    const plotHeight = height - padding.top - padding.bottom;
    
    const normalized = (db - DB_RANGE.min) / (DB_RANGE.max - DB_RANGE.min);
    return padding.top + normalized * plotHeight;
  }

  /**
   * Draw the complete audiogram
   */
  draw(): void {
    const { ctx, options } = this;
    const { width, height, colors } = options;
    
    // Clear
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    this.drawNormalRange();
    this.drawGrid();
    this.drawLabels();
    
    if (this.profile) {
      this.drawThresholds(this.profile.thresholds);
      this.drawLegend();
    }
  }

  private drawNormalRange(): void {
    const { ctx, options } = this;
    const { padding, colors, width } = options;
    
    // Normal hearing is ≤20 dB HL
    const y1 = this.dbToY(-10);
    const y2 = this.dbToY(20);
    
    ctx.fillStyle = colors.normalRange;
    ctx.fillRect(
      padding.left,
      y1,
      width - padding.left - padding.right,
      y2 - y1
    );
  }

  private drawGrid(): void {
    const { ctx, options } = this;
    const { padding, colors, width, height } = options;
    
    ctx.strokeStyle = colors.gridLight;
    ctx.lineWidth = 1;
    
    // Vertical lines at each frequency
    FREQUENCIES.forEach(freq => {
      const x = this.freqToX(freq);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    });
    
    // Horizontal lines every 10 dB
    for (let db = DB_RANGE.min; db <= DB_RANGE.max; db += 10) {
      const y = this.dbToY(db);
      ctx.strokeStyle = db % 20 === 0 ? colors.grid : colors.gridLight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    
    // Border
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      padding.left,
      padding.top,
      width - padding.left - padding.right,
      height - padding.top - padding.bottom
    );
  }

  private drawLabels(): void {
    const { ctx, options } = this;
    const { padding, colors, height } = options;
    
    ctx.fillStyle = colors.text;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    
    // Frequency labels
    FREQUENCIES.forEach(freq => {
      const x = this.freqToX(freq);
      const label = freq >= 1000 ? `${freq / 1000}k` : String(freq);
      ctx.fillText(label, x, height - padding.bottom + 20);
    });
    
    // Frequency axis title
    ctx.font = '13px "DM Sans", sans-serif';
    ctx.fillText('Frequency (Hz)', options.width / 2, height - 10);
    
    // dB labels
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    
    for (let db = DB_RANGE.min; db <= DB_RANGE.max; db += 20) {
      const y = this.dbToY(db);
      ctx.fillText(String(db), padding.left - 10, y + 4);
    }
    
    // dB axis title (rotated)
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = '13px "DM Sans", sans-serif';
    ctx.fillText('Hearing Level (dB HL)', 0, 0);
    ctx.restore();
  }

  private drawThresholds(thresholds: HearingThreshold[]): void {
    const { ctx, options } = this;
    const { colors } = options;
    
    // Collect points for lines
    const rightPoints: { x: number; y: number }[] = [];
    const leftPoints: { x: number; y: number }[] = [];
    
    thresholds.forEach(t => {
      if (!TEST_FREQUENCIES.includes(t.frequency as typeof TEST_FREQUENCIES[number])) return;
      
      const x = this.freqToX(t.frequency);
      
      if (t.rightEar !== null) {
        rightPoints.push({ x, y: this.dbToY(t.rightEar) });
      }
      if (t.leftEar !== null) {
        leftPoints.push({ x, y: this.dbToY(t.leftEar) });
      }
    });
    
    // Draw connecting lines
    this.drawLine(rightPoints, colors.rightEar);
    this.drawLine(leftPoints, colors.leftEar);
    
    // Draw symbols
    thresholds.forEach(t => {
      if (!TEST_FREQUENCIES.includes(t.frequency as typeof TEST_FREQUENCIES[number])) return;
      
      const x = this.freqToX(t.frequency);
      
      if (t.rightEar !== null) {
        this.drawCircle(x, this.dbToY(t.rightEar), colors.rightEar);
      }
      if (t.leftEar !== null) {
        this.drawX(x, this.dbToY(t.leftEar), colors.leftEar);
      }
    });
  }

  private drawLine(points: { x: number; y: number }[], color: string): void {
    if (points.length < 2) return;
    
    const { ctx } = this;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  }

  private drawCircle(x: number, y: number, color: string): void {
    const { ctx } = this;
    const radius = 8;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawX(x: number, y: number, color: string): void {
    const { ctx } = this;
    const size = 8;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
  }

  private drawLegend(): void {
    const { ctx, options } = this;
    const { colors, width, padding } = options;
    
    const legendX = width - padding.right - 100;
    const legendY = padding.top + 20;
    
    // Right ear
    ctx.fillStyle = colors.text;
    ctx.font = '12px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    
    this.drawCircle(legendX, legendY, colors.rightEar);
    ctx.fillText('Right ear', legendX + 20, legendY + 4);
    
    // Left ear
    this.drawX(legendX, legendY + 25, colors.leftEar);
    ctx.fillText('Left ear', legendX + 20, legendY + 29);
  }

  /**
   * Export audiogram as PNG data URL
   */
  toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Resize the audiogram
   */
  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.draw();
  }
}

/**
 * Generate a text summary of the hearing profile
 */
export function generateSummary(profile: HearingProfile): string {
  const lines: string[] = [];
  
  // Calculate average thresholds (PTA - Pure Tone Average at 500, 1000, 2000 Hz)
  const ptaFreqs = [500, 1000, 2000];
  
  const rightPTA = calculatePTA(profile.thresholds, 'rightEar', ptaFreqs);
  const leftPTA = calculatePTA(profile.thresholds, 'leftEar', ptaFreqs);
  
  lines.push('📊 Hearing Assessment Summary');
  lines.push('');
  
  if (rightPTA !== null) {
    const grade = classifyHearingLoss(rightPTA);
    lines.push(`Right ear: ${rightPTA.toFixed(0)} dB HL (${formatGrade(grade)})`);
  }
  
  if (leftPTA !== null) {
    const grade = classifyHearingLoss(leftPTA);
    lines.push(`Left ear: ${leftPTA.toFixed(0)} dB HL (${formatGrade(grade)})`);
  }
  
  lines.push('');
  lines.push('⚠️ This is a self-assessment tool, not a medical diagnosis.');
  lines.push('Please consult an audiologist for professional evaluation.');
  
  return lines.join('\n');
}

function calculatePTA(
  thresholds: HearingThreshold[], 
  ear: 'rightEar' | 'leftEar',
  frequencies: number[]
): number | null {
  const values = frequencies
    .map(f => thresholds.find(t => t.frequency === f)?.[ear])
    .filter((v): v is number => v !== null);
  
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function formatGrade(grade: string): string {
  const labels: Record<string, string> = {
    'normal': '✅ Normal',
    'slight': '🟢 Slight loss',
    'mild': '🟡 Mild loss',
    'moderate': '🟠 Moderate loss',
    'moderately-severe': '🟠 Moderately severe loss',
    'severe': '🔴 Severe loss',
    'profound': '🔴 Profound loss',
  };
  return labels[grade] || grade;
}


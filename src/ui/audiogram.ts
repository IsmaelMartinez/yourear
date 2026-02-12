/**
 * Audiogram visualization using Canvas
 * Standard conventions: O = Right ear, X = Left ear
 */

import { HearingProfile, classifyHearingLoss, getExpectedThresholds } from '../types';
import { AudiogramBase, COLORS, FREQUENCIES, PADDING } from './audiogram-base';

export class Audiogram extends AudiogramBase {
  private profile: HearingProfile | null = null;

  constructor(container: HTMLElement, width = 600, height = 450) {
    super(container, width, height);
    this.draw();
  }

  setProfile(profile: HearingProfile | null): void {
    this.profile = profile;
    this.draw();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private draw(): void {
    this.clearCanvas();

    if (this.profile?.age) {
      this.drawExpectedRange(this.profile.age);
    }

    this.drawGrid();
    this.drawLabels();

    if (this.profile) {
      this.drawThresholdData(this.profile.thresholds, COLORS.rightEar, COLORS.leftEar);
      this.drawLegend();
    }
  }

  private drawExpectedRange(age: number): void {
    const expected = getExpectedThresholds(age);
    const ctx = this.ctx;

    // Filled area between p10 and p90 (typical range for age)
    ctx.fillStyle = COLORS.expectedRange;
    ctx.beginPath();

    const topPoints = FREQUENCIES.map(f => ({ x: this.freqToX(f), y: this.dbToY(expected[f].p10) }));
    const bottomPoints = FREQUENCIES.map(f => ({ x: this.freqToX(f), y: this.dbToY(expected[f].p90) }));

    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i < topPoints.length; i++) ctx.lineTo(topPoints[i].x, topPoints[i].y);
    for (let i = bottomPoints.length - 1; i >= 0; i--) ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
    ctx.closePath();
    ctx.fill();

    // Median line (expected for age)
    ctx.strokeStyle = COLORS.expectedLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const medianPoints = FREQUENCIES.map(f => ({ x: this.freqToX(f), y: this.dbToY(expected[f].median) }));
    ctx.moveTo(medianPoints[0].x, medianPoints[0].y);
    for (let i = 1; i < medianPoints.length; i++) ctx.lineTo(medianPoints[i].x, medianPoints[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawLegend(): void {
    const x = PADDING.left + 20;
    let y = this.height - PADDING.bottom - 20;

    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = '11px "DM Sans", sans-serif';
    this.ctx.textAlign = 'left';

    if (this.profile?.age) {
      this.ctx.fillStyle = COLORS.expectedRange;
      this.ctx.fillRect(x - 10, y - 6, 20, 12);
      this.ctx.fillStyle = COLORS.text;
      this.ctx.fillText(`Typical range (${this.profile.age}y)`, x + 18, y + 4);
      y -= 22;
    }

    this.drawX(x, y, COLORS.leftEar);
    this.ctx.fillText('Left ear', x + 18, y + 4);
    y -= 22;

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

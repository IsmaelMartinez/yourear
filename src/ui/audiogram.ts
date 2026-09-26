/**
 * Audiogram visualization using Canvas
 * Standard conventions: O = Right ear, X = Left ear
 */

import { HearingProfile, classifyHearingLoss, getExpectedThresholds, calculatePTA, compareToAge, GRADE_LABELS, AGE_VERDICT_LABELS } from '../types';
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
  const lines = ['📊 Hearing Assessment Summary'];

  if (profile.age) {
    lines.push(`👤 Age: ${profile.age} years`);
  }
  lines.push('');

  const rightPTA = calculatePTA(profile.thresholds, 'rightEar');
  const leftPTA = calculatePTA(profile.thresholds, 'leftEar');

  for (const [name, pta] of [['Right', rightPTA], ['Left', leftPTA]] as const) {
    if (pta) {
      const { icon, label } = GRADE_LABELS[classifyHearingLoss(pta.value)];
      lines.push(`${name} ear: ${pta.value.toFixed(0)} dB HL (${icon} ${label})`);
    }
  }
  const standard = [rightPTA, leftPTA].every(p => !p || p.standard);
  if (!standard) {
    lines.push('Average of tested frequencies (500/2000 Hz not tested). Use Full or Detailed Test for a true PTA.');
  }

  const age = profile.age ? compareToAge(profile.age, rightPTA, leftPTA) : null;
  if (age) {
    const { icon, label } = AGE_VERDICT_LABELS[age.verdict];
    lines.push('');
    lines.push(`📈 Expected ${standard ? 'PTA' : 'average'} for age ${profile.age}: ~${age.expected.toFixed(0)} dB HL`);
    lines.push(`${icon} ${label}`);
  }

  lines.push('');
  lines.push('⚠️ This is a self-assessment tool, not a medical diagnosis.');
  lines.push('Please consult an audiologist for professional evaluation.');

  return lines.join('\n');
}

/**
 * Comparison Audiogram - Overlay multiple hearing profiles for trend analysis
 */

import { HearingProfile } from '../types';
import { AudiogramBase, COLORS, PADDING } from './audiogram-base';

// Distinct colors for different profiles
const PROFILE_COLORS = [
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#fbbf24', // Yellow
  '#a78bfa', // Purple
  '#34d399', // Green
];

interface ProfileWithStyle {
  profile: HearingProfile;
  color: string;
  opacity: number;
}

export class ComparisonAudiogram extends AudiogramBase {
  private profiles: ProfileWithStyle[] = [];

  constructor(container: HTMLElement, width = 700, height = 500) {
    super(container, width, height);
    this.draw();
  }

  setProfiles(profiles: HearingProfile[]): void {
    this.profiles = profiles.slice(0, 5).map((profile, index) => ({
      profile,
      color: PROFILE_COLORS[index],
      opacity: index === 0 ? 1 : 0.7,
    }));
    this.draw();
  }

  private draw(): void {
    this.clearCanvas();
    this.drawGrid();
    this.drawLabels();

    // Draw all profiles (oldest first so newest is on top)
    [...this.profiles].reverse().forEach(({ profile, color, opacity }) => {
      this.ctx.globalAlpha = opacity;
      this.drawThresholdData(profile.thresholds, color, color, 6);
      this.ctx.globalAlpha = 1;
    });

    if (this.profiles.length > 0) {
      this.drawLegend();
    }
  }

  private drawLegend(): void {
    const x = PADDING.left + 20;
    let y = this.height - PADDING.bottom - 20;

    this.ctx.font = '11px "DM Sans", sans-serif';
    this.ctx.textAlign = 'left';

    this.profiles.forEach(({ profile, color }, index) => {
      const dateStr = profile.createdAt.toLocaleDateString();
      const label = `${dateStr}${profile.age ? ` (${profile.age}y)` : ''}`;

      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = index === 0 ? 1 : 0.7;
      this.ctx.fillRect(x - 10, y - 6, 20, 12);
      this.ctx.globalAlpha = 1;

      this.ctx.fillStyle = COLORS.text;
      this.ctx.fillText(label, x + 18, y + 4);

      y -= 20;
    });
  }
}

/**
 * Calculate the change in PTA between two profiles.
 * Uses 500, 1000, 2000 Hz (standard PTA), falls back to any available frequencies.
 */
export function calculatePTAChange(
  older: HearingProfile,
  newer: HearingProfile
): { right: number | null; left: number | null } {
  const ptaFreqs = [500, 1000, 2000];

  const calcPTA = (profile: HearingProfile, ear: 'rightEar' | 'leftEar'): number | null => {
    const isValidNumber = (v: number | null | undefined): v is number =>
      v !== null && v !== undefined && !isNaN(v);

    let values = ptaFreqs
      .map(f => profile.thresholds.find(t => t.frequency === f)?.[ear])
      .filter(isValidNumber);

    if (values.length < 2) {
      values = profile.thresholds.map(t => t[ear]).filter(isValidNumber);
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

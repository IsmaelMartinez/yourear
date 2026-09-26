/**
 * Comparison Audiogram - Overlay multiple hearing profiles for trend analysis
 */

import { HearingProfile, calculatePTA } from '../types';
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
 * Calculate the change in PTA between two profiles (see calculatePTA for the
 * Quick Test fallback). `standard` is false if any PTA used that fallback.
 */
export function calculatePTAChange(
  older: HearingProfile,
  newer: HearingProfile
): { right: number | null; left: number | null; standard: boolean } {
  const change = (ear: 'rightEar' | 'leftEar') => {
    const before = calculatePTA(older.thresholds, ear);
    const after = calculatePTA(newer.thresholds, ear);
    return { before, after, delta: before && after ? after.value - before.value : null };
  };
  const right = change('rightEar');
  const left = change('leftEar');
  const standard = [right.before, right.after, left.before, left.after].every(p => !p || p.standard);

  return { right: right.delta, left: left.delta, standard };
}

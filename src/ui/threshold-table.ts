/**
 * Visually hidden data table giving screen readers the values plotted on an
 * audiogram canvas (the canvas itself is aria-hidden).
 */

import { HearingProfile } from '../types';
import { escapeHtml } from '../utils/dom';

export interface TableSeries {
  /** Prefix for the column headers, e.g. a profile name; empty for a single profile */
  label: string;
  profile: HearingProfile;
}

export function renderThresholdTable(series: TableSeries[]): string {
  const frequencies = [...new Set(series.flatMap(s => s.profile.thresholds.map(t => t.frequency)))]
    .sort((a, b) => a - b);

  const header = (label: string, ear: string) => escapeHtml(label ? `${label}, ${ear.toLowerCase()}` : ear);
  const cell = (profile: HearingProfile, frequency: number, ear: 'rightEar' | 'leftEar') => {
    const threshold = profile.thresholds.find(t => t.frequency === frequency);
    if (!threshold) return 'Not tested';
    const value = threshold[ear];
    return value === null ? 'No response' : `${value} dB HL`;
  };

  return `
    <table class="sr-only">
      <thead>
        <tr>
          <th scope="col">Frequency</th>
          ${series.map(s => `
            <th scope="col">${header(s.label, 'Right ear')}</th>
            <th scope="col">${header(s.label, 'Left ear')}</th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${frequencies.map(frequency => `
          <tr>
            <th scope="row">${frequency} Hz</th>
            ${series.map(s => `
              <td>${cell(s.profile, frequency, 'rightEar')}</td>
              <td>${cell(s.profile, frequency, 'leftEar')}</td>
            `).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

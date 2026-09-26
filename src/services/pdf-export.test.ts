import { describe, it, expect, vi } from 'vitest';
import { exportToPDF } from './pdf-export';

const text = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function () {
    return {
      internal: { pageSize: { getWidth: () => 210 } },
      text,
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      setTextColor: vi.fn(),
      setDrawColor: vi.fn(),
      line: vi.fn(),
      addImage: vi.fn(),
      splitTextToSize: (s: string) => [s],
      save: vi.fn(),
    };
  }),
}));

describe('exportToPDF', () => {
  it('writes a numeric summary for a Quick Test profile', async () => {
    await exportToPDF({
      id: 'quick',
      name: 'Quick',
      age: 40,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      thresholds: [
        { frequency: 1000, rightEar: 15, leftEar: 0 },
        { frequency: 4000, rightEar: 25, leftEar: 0 },
        { frequency: 8000, rightEar: 35, leftEar: 0 },
      ],
    }, 'data:image/png;base64,');

    const written = text.mock.calls.map(([s]) => String(s)).join('\n');
    expect(written).not.toContain('NaN');
    expect(written).toContain('Right Ear: 25 dB HL (Slight loss)');
    expect(written).toContain('Left Ear: 0 dB HL (Normal)');
  });
});

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderCalibration, cleanupCalibrationScreen } from './calibration';
import { startNoiseMeter } from '../audio/noise-meter';
import { getState, resetState, setRenderCallback } from '../state/app-state';

vi.mock('../audio/tone-generator', () => ({
  playCalibrationTone: vi.fn().mockResolvedValue(undefined),
  stopTone: vi.fn(),
}));

vi.mock('../audio/noise-meter', () => ({
  startNoiseMeter: vi.fn(),
  NOISE_WARNING_THRESHOLD_DB: 40,
}));

vi.mock('../services/test-runner', () => ({
  startTest: vi.fn(),
}));

function changeAge(value: string): void {
  const input = document.getElementById('age-input') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('change'));
}

describe('calibration screen', () => {
  let renderSpy: Mock<() => void>;
  let meterStop: Mock<() => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanupCalibrationScreen();
    resetState();
    document.body.innerHTML = '<div id="app"></div>';
    renderSpy = vi.fn();
    setRenderCallback(renderSpy);
    meterStop = vi.fn();
    vi.mocked(startNoiseMeter).mockResolvedValue({ stop: meterStop });
  });

  it('updates the age without re-rendering the screen', () => {
    renderCalibration();
    changeAge('50');

    expect(getState().userAge).toBe(50);
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it('stops a running noise meter on cleanup, even after the age changed', async () => {
    renderCalibration();
    document.getElementById('noise-check')!.click();
    await vi.waitFor(() => {
      expect(document.getElementById('noise-status')!.hidden).toBe(false);
    });

    changeAge('50');
    cleanupCalibrationScreen();

    expect(meterStop).toHaveBeenCalledTimes(1);
  });

  it('stops a noise meter that starts after the screen was left', async () => {
    let resolveMeter!: (handle: { stop: () => void }) => void;
    vi.mocked(startNoiseMeter).mockReturnValue(new Promise(resolve => { resolveMeter = resolve; }));

    renderCalibration();
    document.getElementById('noise-check')!.click();
    cleanupCalibrationScreen();
    resolveMeter({ stop: meterStop });

    await vi.waitFor(() => {
      expect(meterStop).toHaveBeenCalledTimes(1);
    });
  });
});

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { startTest, stopTest } from './test-runner';
import { HearingTest, type TestEventHandler } from '../audio/hearing-test';
import { AudioInitError } from '../audio/audio-context';
import { announce } from '../utils/dom';
import { getState, navigateTo, resetState, setRenderCallback, setUserAge } from '../state/app-state';
import { createProfile } from '../storage/profile';
import { DEFAULT_TEST_CONFIG, DETAILED_TEST_CONFIG, QUICK_TEST_CONFIG } from '../types';

vi.mock('../audio/hearing-test', () => ({
  HearingTest: vi.fn(),
}));

vi.mock('../utils/dom', () => ({
  announce: vi.fn(),
}));

vi.mock('../storage/profile', () => ({
  createProfile: vi.fn(),
}));

interface MockTest {
  on: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  getResults?: ReturnType<typeof vi.fn>;
  emit: (event: 'stateChange' | 'testComplete') => void;
}

/** Let a rejected start() reach its catch handler */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe('test-runner', () => {
  let mockTest: MockTest;
  let render: Mock<() => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
    render = vi.fn();
    setRenderCallback(render);

    const handlers: TestEventHandler[] = [];
    mockTest = {
      on: vi.fn((handler: TestEventHandler) => { handlers.push(handler); }),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      emit: (event) => handlers.forEach(h => h(event)),
    };
    vi.mocked(HearingTest).mockImplementation(function () { return mockTest; } as never);
    navigateTo('calibration');
  });

  it('starts the test on the test screen', () => {
    startTest();

    expect(getState().screen).toBe('test');
    expect(getState().hearingTest).toBe(mockTest);
    expect(mockTest.start).toHaveBeenCalled();
  });

  it('returns to home with an announced error when audio fails to start', async () => {
    mockTest.start.mockRejectedValue(new AudioInitError('Could not initialize audio.'));

    startTest();
    await settle();

    expect(getState().screen).toBe('home');
    expect(getState().hearingTest).toBeNull();
    expect(mockTest.stop).toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('Could not initialize audio.'), 'assertive');
  });

  it('stopTest clears the test from state and returns home', () => {
    startTest();

    stopTest();

    expect(mockTest.stop).toHaveBeenCalled();
    expect(getState().hearingTest).toBeNull();
    expect(getState().screen).toBe('home');
  });

  it('ignores state changes from a stopped test', () => {
    startTest();
    stopTest();
    render.mockClear();

    mockTest.emit('stateChange');

    expect(render).not.toHaveBeenCalled();
  });

  it.each([
    ['full', DEFAULT_TEST_CONFIG],
    ['quick', QUICK_TEST_CONFIG],
    ['detailed', DETAILED_TEST_CONFIG],
  ] as const)('builds a %s test from its config', (mode, config) => {
    navigateTo('calibration', { mode });

    startTest();

    expect(HearingTest).toHaveBeenCalledWith(config);
  });

  it('re-renders on state changes from the active test', () => {
    startTest();
    render.mockClear();

    mockTest.emit('stateChange');

    expect(render).toHaveBeenCalledOnce();
  });

  it('saves a labelled profile with the age and shows it when the test completes', () => {
    const results = { createdAt: new Date(0), updatedAt: new Date(0), thresholds: [] };
    const profile = { ...results, id: 'p1', name: 'Quick Test' };
    mockTest.getResults = vi.fn(() => results);
    vi.mocked(createProfile).mockReturnValue(profile);
    navigateTo('calibration', { mode: 'quick' });
    setUserAge(43);

    startTest();
    mockTest.emit('testComplete');

    expect(createProfile).toHaveBeenCalledWith({
      ...results,
      name: expect.stringMatching(/^Quick Test - /),
      age: 43,
    });
    expect(getState()).toMatchObject({ screen: 'results', viewingProfile: profile });
  });

  it('announces a generic reason when start fails with a non-audio error', async () => {
    mockTest.start.mockRejectedValue(new Error('boom'));

    startTest();

    await settle();
    expect(announce).toHaveBeenCalledWith('Could not start the test. Audio could not be started.', 'assertive');
  });

  it('ignores a start failure from a test that was already stopped', async () => {
    let fail!: (error: Error) => void;
    mockTest.start.mockReturnValue(new Promise((_, reject) => { fail = reject; }));

    startTest();
    stopTest();
    navigateTo('calibration');
    fail(new AudioInitError('late failure'));
    await settle();

    expect(getState().screen).toBe('calibration');
    expect(announce).not.toHaveBeenCalled();
  });
});

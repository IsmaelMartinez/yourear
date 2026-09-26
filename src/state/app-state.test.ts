import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createInitialState,
  getState,
  navigateTo,
  rerender,
  resetState,
  setRenderCallback,
  setState,
  setUserAge,
} from './app-state';
import type { HearingProfile } from '../types';

const profile: HearingProfile = {
  id: 'p1',
  name: 'Full Test',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  thresholds: [],
};

describe('app-state', () => {
  const render = vi.fn();

  beforeEach(() => {
    render.mockClear();
    resetState();
    setRenderCallback(render);
  });

  it('starts on the home screen in full test mode', () => {
    expect(getState()).toEqual(createInitialState());
    expect(getState()).toMatchObject({ screen: 'home', testMode: 'full', hearingTest: null });
  });

  it('setState merges updates and renders once', () => {
    setState({ userAge: 43 });
    setState({ testMode: 'quick' });

    expect(getState()).toMatchObject({ screen: 'home', userAge: 43, testMode: 'quick' });
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('rerender renders without changing state', () => {
    const before = getState();

    rerender();

    expect(render).toHaveBeenCalledTimes(1);
    expect(getState()).toBe(before);
  });

  it('navigateTo changes the screen and keeps the mode when none is given', () => {
    setState({ testMode: 'detailed' });

    navigateTo('calibration');

    expect(getState()).toMatchObject({ screen: 'calibration', testMode: 'detailed' });
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('navigateTo applies a test mode and a profile to view', () => {
    navigateTo('calibration', { mode: 'quick' });
    navigateTo('results', { profile });

    expect(getState()).toMatchObject({ screen: 'results', testMode: 'quick', viewingProfile: profile });
  });

  it('setUserAge stores the age without rendering', () => {
    setUserAge(30);

    expect(getState().userAge).toBe(30);
    expect(render).not.toHaveBeenCalled();
  });

  it('resetState restores the initial state', () => {
    navigateTo('results', { mode: 'quick', profile });

    resetState();

    expect(getState()).toEqual(createInitialState());
  });

  it('updates state before any render callback is registered', async () => {
    vi.resetModules();
    const fresh = await import('./app-state');

    fresh.navigateTo('calibration');
    fresh.rerender();

    expect(fresh.getState().screen).toBe('calibration');
  });
});

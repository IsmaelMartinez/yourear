/**
 * Shared Web Audio stubs for tests. Both use vi.stubGlobal, so the
 * `unstubGlobals` setting in vitest.config.ts restores the real globals
 * after every test.
 */

import { vi } from 'vitest';

/**
 * Replace the global AudioContext with a running stub. Each instance gets
 * the defaults below plus `overrides`; methods written as `function` or
 * method shorthand see the instance as `this`. Returns a spy called with
 * each constructed instance.
 */
export function installAudioContext(overrides: Record<string, unknown> = {}) {
  const constructed = vi.fn<(ctx: AudioContext) => void>();
  vi.stubGlobal('AudioContext', class {
    constructor() {
      Object.assign(this, {
        state: 'running',
        currentTime: 0,
        destination: {},
        resume: vi.fn().mockResolvedValue(undefined),
      }, overrides);
      constructed(this as unknown as AudioContext);
    }
  });
  return constructed;
}

/**
 * Stub navigator.mediaDevices.getUserMedia to resolve with `stream` or
 * reject with an Error. Pass null to make mediaDevices unavailable.
 * Returns the getUserMedia mock (undefined when unavailable).
 */
export function stubGetUserMedia(streamOrError: object | Error | null) {
  const getUserMedia = streamOrError === null
    ? undefined
    : streamOrError instanceof Error
      ? vi.fn().mockRejectedValue(streamOrError)
      : vi.fn().mockResolvedValue(streamOrError);
  const mediaDevices = getUserMedia && { getUserMedia };
  const realNavigator = navigator;
  vi.stubGlobal('navigator', new Proxy(realNavigator, {
    get: (target, prop) => prop === 'mediaDevices' ? mediaDevices : Reflect.get(target, prop),
  }));
  return getUserMedia;
}

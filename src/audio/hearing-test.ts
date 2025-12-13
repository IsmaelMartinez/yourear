/**
 * Hearing test using simplified Hughson-Westlake procedure
 * 
 * Algorithm:
 * 1. Start at 40 dB HL
 * 2. Heard → decrease 10 dB
 * 3. Not heard → increase 5 dB (ascending)
 * 4. Ascending + heard twice at same level = threshold
 */

import { TestState, TestConfig, DEFAULT_TEST_CONFIG, HearingThreshold, HearingProfile } from '../types';
import { playTone, stopTone } from './tone-generator';

export type TestEventType = 'stateChange' | 'testComplete';
export type TestEventHandler = (event: TestEventType, data?: unknown) => void;

export class HearingTest {
  private state: TestState;
  private config: TestConfig;
  private handlers = new Set<TestEventHandler>();
  
  private isAscending = false;
  private lastLevelHeard: number | null = null;
  private hearCountAtLevel = 0;
  private waitingForResponse = false;
  private responseTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...DEFAULT_TEST_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): TestState {
    return {
      currentFrequency: this.config.frequencies[0],
      currentEar: 'right',
      currentLevel: this.config.startLevel,
      isPlaying: false,
      responses: new Map(),
      phase: 'idle',
    };
  }

  on(handler: TestEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(event: TestEventType, data?: unknown): void {
    this.handlers.forEach(h => h(event, data));
  }

  getState(): Readonly<TestState> {
    return { ...this.state };
  }

  async start(): Promise<void> {
    this.state = this.createInitialState();
    this.state.phase = 'testing';
    this.resetTracking();
    this.emit('stateChange');
    await this.presentTone();
  }

  stop(): void {
    stopTone();
    this.clearTimeout();
    this.waitingForResponse = false;
    this.state.phase = 'idle';
    this.state.isPlaying = false;
    this.emit('stateChange');
  }

  private resetTracking(): void {
    this.isAscending = false;
    this.lastLevelHeard = null;
    this.hearCountAtLevel = 0;
    this.state.currentLevel = this.config.startLevel;
  }

  async respondHeard(): Promise<void> {
    if (!this.waitingForResponse || this.state.phase !== 'testing') return;
    
    this.clearTimeout();
    this.waitingForResponse = false;
    
    const level = this.state.currentLevel;
    
    if (this.isAscending) {
      if (this.lastLevelHeard === level) {
        this.hearCountAtLevel++;
      } else {
        this.lastLevelHeard = level;
        this.hearCountAtLevel = 1;
      }
      
      if (this.hearCountAtLevel >= 2) {
        await this.recordThreshold(level);
        return;
      }
      
      await this.presentTone();
      return;
    }
    
    this.state.currentLevel -= this.config.stepDown;
    
    if (this.state.currentLevel < this.config.minLevel) {
      await this.recordThreshold(this.config.minLevel);
      return;
    }
    
    await this.presentTone();
  }

  async respondNotHeard(): Promise<void> {
    if (!this.waitingForResponse || this.state.phase !== 'testing') return;
    
    this.clearTimeout();
    this.waitingForResponse = false;
    
    this.isAscending = true;
    this.lastLevelHeard = null;
    this.hearCountAtLevel = 0;
    
    this.state.currentLevel += this.config.stepUp;
    
    if (this.state.currentLevel > this.config.maxLevel) {
      await this.recordThreshold(null);
      return;
    }
    
    await this.presentTone();
  }

  private async presentTone(): Promise<void> {
    this.state.isPlaying = true;
    this.emit('stateChange');

    await playTone({
      frequency: this.state.currentFrequency,
      level: this.state.currentLevel,
      duration: this.config.toneDuration,
      channel: this.state.currentEar,
    });

    this.state.isPlaying = false;
    this.emit('stateChange');
    
    this.waitingForResponse = true;
    this.responseTimeout = setTimeout(() => this.respondNotHeard(), this.config.responseDuration);
  }

  private clearTimeout(): void {
    if (this.responseTimeout) {
      clearTimeout(this.responseTimeout);
      this.responseTimeout = null;
    }
  }

  private async recordThreshold(level: number | null): Promise<void> {
    const key = `${this.state.currentEar}-${this.state.currentFrequency}`;
    if (level !== null) {
      this.state.responses.set(key, level);
    }

    const frequencies = [...this.config.frequencies];
    const freqIndex = frequencies.indexOf(this.state.currentFrequency);
    
    if (freqIndex < frequencies.length - 1) {
      this.state.currentFrequency = frequencies[freqIndex + 1];
      this.resetTracking();
      this.emit('stateChange');
      await this.presentTone();
    } else if (this.state.currentEar === 'right') {
      this.state.currentEar = 'left';
      this.state.currentFrequency = frequencies[0];
      this.resetTracking();
      this.emit('stateChange');
      await this.presentTone();
    } else {
      this.state.phase = 'complete';
      this.emit('stateChange');
      this.emit('testComplete', this.getResults());
    }
  }

  getResults(): Omit<HearingProfile, 'id' | 'name'> {
    const thresholds: HearingThreshold[] = [...this.config.frequencies].map(freq => ({
      frequency: freq,
      rightEar: this.state.responses.get(`right-${freq}`) ?? null,
      leftEar: this.state.responses.get(`left-${freq}`) ?? null,
    }));

    return { createdAt: new Date(), updatedAt: new Date(), thresholds };
  }

  getProgress(): number {
    const total = this.config.frequencies.length * 2;
    let done = 0;
    for (const freq of this.config.frequencies) {
      if (this.state.responses.has(`right-${freq}`)) done++;
      if (this.state.responses.has(`left-${freq}`)) done++;
    }
    return (done / total) * 100;
  }
}

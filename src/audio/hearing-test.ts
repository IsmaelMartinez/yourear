/**
 * Hearing test logic using simplified Hughson-Westlake procedure
 * 
 * Simplified for self-assessment:
 * 1. Start at a clearly audible level (40 dB HL)
 * 2. If heard: decrease by 10 dB
 * 3. If not heard: increase by 5 dB (now ascending)
 * 4. While ascending: if heard twice at same level = threshold found
 */

import { 
  TestState, 
  TestConfig, 
  DEFAULT_TEST_CONFIG, 
  HearingThreshold,
  HearingProfile 
} from '../types';
import { playTone, stopTone } from './tone-generator';

export type TestEventType = 
  | 'stateChange'
  | 'toneStart'
  | 'toneEnd'
  | 'thresholdFound'
  | 'frequencyComplete'
  | 'earComplete'
  | 'testComplete';

export type TestEventHandler = (event: TestEventType, data?: unknown) => void;

export class HearingTest {
  private state: TestState;
  private config: TestConfig;
  private eventHandlers: Set<TestEventHandler> = new Set();
  
  // Tracking for threshold detection
  private isAscending: boolean = false;
  private lastLevelHeard: number | null = null;
  private hearCountAtLevel: number = 0;
  
  private waitingForResponse: boolean = false;
  private responseTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...DEFAULT_TEST_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): TestState {
    return {
      currentFrequency: this.config.frequencies[0],
      currentEar: 'right', // Start with right ear (audiometric convention)
      currentLevel: this.config.startLevel,
      isPlaying: false,
      responses: new Map(),
      phase: 'idle',
    };
  }

  /**
   * Subscribe to test events
   */
  on(handler: TestEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: TestEventType, data?: unknown): void {
    this.eventHandlers.forEach(handler => handler(event, data));
  }

  /**
   * Get current test state
   */
  getState(): Readonly<TestState> {
    return { ...this.state };
  }

  /**
   * Start the hearing test
   */
  async start(): Promise<void> {
    this.state = this.createInitialState();
    this.state.phase = 'testing';
    this.resetFrequencyTracking();
    this.emit('stateChange', this.state);
    await this.presentTone();
  }

  /**
   * Stop the test
   */
  stop(): void {
    stopTone();
    this.clearResponseTimeout();
    this.waitingForResponse = false;
    this.state.phase = 'idle';
    this.state.isPlaying = false;
    this.emit('stateChange', this.state);
  }

  /**
   * Reset tracking variables for a new frequency
   */
  private resetFrequencyTracking(): void {
    this.isAscending = false;
    this.lastLevelHeard = null;
    this.hearCountAtLevel = 0;
    this.state.currentLevel = this.config.startLevel;
  }

  /**
   * User indicates they heard the tone
   */
  async respondHeard(): Promise<void> {
    if (!this.waitingForResponse || this.state.phase !== 'testing') {
      console.log('respondHeard blocked:', { waitingForResponse: this.waitingForResponse, phase: this.state.phase });
      return;
    }
    
    this.clearResponseTimeout();
    this.waitingForResponse = false;
    
    const currentLevel = this.state.currentLevel;
    console.log(`Heard at ${currentLevel} dB, ascending: ${this.isAscending}`);
    
    if (this.isAscending) {
      // We're in ascending phase - count responses at this level
      if (this.lastLevelHeard === currentLevel) {
        this.hearCountAtLevel++;
      } else {
        this.lastLevelHeard = currentLevel;
        this.hearCountAtLevel = 1;
      }
      
      console.log(`Ascending: heard ${this.hearCountAtLevel} times at ${currentLevel} dB`);
      
      // Threshold found: heard 2 times at this level while ascending
      if (this.hearCountAtLevel >= 2) {
        console.log(`Threshold found at ${currentLevel} dB`);
        await this.recordThreshold(currentLevel);
        return;
      }
      
      // Need one more response at this level - present same tone again
      await this.presentTone();
      return;
    }
    
    // Descending phase: decrease level to find where they stop hearing
    this.state.currentLevel -= this.config.stepDown;
    
    if (this.state.currentLevel < this.config.minLevel) {
      // Excellent hearing - can hear at minimum level
      console.log('Excellent hearing at this frequency');
      await this.recordThreshold(this.config.minLevel);
      return;
    }
    
    await this.presentTone();
  }

  /**
   * User indicates they did NOT hear the tone
   * Also called on timeout
   */
  async respondNotHeard(): Promise<void> {
    if (!this.waitingForResponse || this.state.phase !== 'testing') {
      console.log('respondNotHeard blocked:', { waitingForResponse: this.waitingForResponse, phase: this.state.phase });
      return;
    }
    
    this.clearResponseTimeout();
    this.waitingForResponse = false;
    
    const currentLevel = this.state.currentLevel;
    console.log(`Not heard at ${currentLevel} dB`);
    
    // Start or continue ascending phase
    this.isAscending = true;
    // Reset count since they didn't hear at this level
    this.lastLevelHeard = null;
    this.hearCountAtLevel = 0;
    
    // Increase level
    this.state.currentLevel += this.config.stepUp;
    
    if (this.state.currentLevel > this.config.maxLevel) {
      // Could not hear at maximum safe level - no response
      console.log('Could not hear at max level');
      await this.recordThreshold(null);
      return;
    }
    
    await this.presentTone();
  }

  /**
   * Present a tone and wait for response
   */
  private async presentTone(): Promise<void> {
    this.state.isPlaying = true;
    this.emit('stateChange', this.state);
    this.emit('toneStart', {
      frequency: this.state.currentFrequency,
      level: this.state.currentLevel,
      ear: this.state.currentEar,
    });

    console.log(`Playing ${this.state.currentFrequency} Hz at ${this.state.currentLevel} dB to ${this.state.currentEar} ear`);

    await playTone({
      frequency: this.state.currentFrequency,
      level: this.state.currentLevel,
      duration: this.config.toneDuration,
      channel: this.state.currentEar,
    });

    this.state.isPlaying = false;
    this.emit('toneEnd');
    this.emit('stateChange', this.state);
    
    // Wait for response
    this.waitingForResponse = true;
    this.responseTimeout = setTimeout(() => {
      console.log('Response timeout - treating as not heard');
      this.respondNotHeard();
    }, this.config.responseDuration);
  }

  private clearResponseTimeout(): void {
    if (this.responseTimeout) {
      clearTimeout(this.responseTimeout);
      this.responseTimeout = null;
    }
  }

  /**
   * Record threshold and move to next frequency/ear
   */
  private async recordThreshold(level: number | null): Promise<void> {
    const key = `${this.state.currentEar}-${this.state.currentFrequency}`;
    if (level !== null) {
      this.state.responses.set(key, level);
    }
    
    console.log(`Recorded threshold: ${key} = ${level} dB`);
    console.log(`Progress: ${this.getProgress()}%`);
    
    this.emit('thresholdFound', {
      ear: this.state.currentEar,
      frequency: this.state.currentFrequency,
      threshold: level,
    });

    // Move to next frequency
    const frequencies = [...this.config.frequencies]; // Convert readonly to array
    const freqIndex = frequencies.indexOf(this.state.currentFrequency);
    
    console.log(`Current freq index: ${freqIndex}, total: ${frequencies.length}`);
    
    if (freqIndex < frequencies.length - 1) {
      // Next frequency, same ear
      this.state.currentFrequency = frequencies[freqIndex + 1];
      this.resetFrequencyTracking();
      this.emit('frequencyComplete');
      this.emit('stateChange', this.state);
      await this.presentTone();
    } else if (this.state.currentEar === 'right') {
      // Switch to left ear, restart frequencies
      this.state.currentEar = 'left';
      this.state.currentFrequency = frequencies[0];
      this.resetFrequencyTracking();
      this.emit('earComplete', 'right');
      this.emit('stateChange', this.state);
      await this.presentTone();
    } else {
      // Test complete!
      console.log('Test complete!');
      this.state.phase = 'complete';
      this.emit('stateChange', this.state);
      this.emit('testComplete', this.getResults());
    }
  }

  /**
   * Get test results as a HearingProfile
   */
  getResults(): Omit<HearingProfile, 'id' | 'name'> {
    const frequencies = [...this.config.frequencies];
    const thresholds: HearingThreshold[] = frequencies.map(freq => {
      const rightKey = `right-${freq}`;
      const leftKey = `left-${freq}`;
      
      return {
        frequency: freq,
        rightEar: this.state.responses.get(rightKey) ?? null,
        leftEar: this.state.responses.get(leftKey) ?? null,
      };
    });

    return {
      createdAt: new Date(),
      updatedAt: new Date(),
      thresholds,
    };
  }

  /**
   * Get progress as percentage
   */
  getProgress(): number {
    const frequencies = [...this.config.frequencies];
    const totalTests = frequencies.length * 2; // Both ears
    
    let completed = 0;
    for (const freq of frequencies) {
      if (this.state.responses.has(`right-${freq}`)) completed++;
      if (this.state.responses.has(`left-${freq}`)) completed++;
    }
    
    return (completed / totalTests) * 100;
  }
}

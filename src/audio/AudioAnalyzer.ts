// SonicOS™ Audio Analyzer
// Implements real-time audio analysis with FFT, energy bands, and BPM detection

import { AudioAnalysis, EnergyBands } from '../core/types';

/**
 * Audio Analyzer interface
 */
export interface IAudioAnalyzer {
  connect(source: AudioNode | MediaStream): void;
  disconnect(): void;
  getAnalysis(): AudioAnalysis;
  onAnalysis(callback: (analysis: AudioAnalysis) => void): () => void;
  dispose(): void;
}

/**
 * Constants for audio analysis
 */
const FFT_SIZE = 2048; // Results in 1024 frequency bins
const SAMPLE_RATE = 44100; // Standard sample rate
const MIN_BPM = 60;
const MAX_BPM = 200;

// Frequency band boundaries in Hz
const LOW_FREQ_MIN = 20;
const LOW_FREQ_MAX = 250;
const MID_FREQ_MIN = 250;
const MID_FREQ_MAX = 4000;
const HIGH_FREQ_MIN = 4000;
const HIGH_FREQ_MAX = 20000;

// Energy weights for total calculation
const LOW_WEIGHT = 0.5;
const MID_WEIGHT = 0.3;
const HIGH_WEIGHT = 0.2;

// BPM detection parameters
const ONSET_THRESHOLD = 0.15;
const MIN_ONSET_INTERVAL_MS = 300; // 200 BPM max
const MAX_ONSET_INTERVAL_MS = 1000; // 60 BPM min
const ONSET_HISTORY_SIZE = 16;


/**
 * Converts frequency in Hz to FFT bin index
 */
export function frequencyToBin(frequency: number, fftSize: number, sampleRate: number): number {
  const binWidth = sampleRate / fftSize;
  return Math.round(frequency / binWidth);
}

/**
 * Calculates energy for a frequency range from FFT data
 * @param fftData - Normalized FFT data (0-1)
 * @param startBin - Starting bin index
 * @param endBin - Ending bin index
 * @returns Normalized energy value (0-1)
 */
export function calculateBandEnergy(fftData: ArrayLike<number>, startBin: number, endBin: number): number {
  if (startBin >= endBin || startBin < 0 || endBin > fftData.length) {
    return 0;
  }
  
  let sum = 0;
  const count = endBin - startBin;
  
  for (let i = startBin; i < endBin; i++) {
    sum += fftData[i];
  }
  
  return count > 0 ? sum / count : 0;
}

/**
 * Calculates energy bands from FFT data
 */
export function calculateEnergyBands(
  fftData: ArrayLike<number>,
  fftSize: number,
  sampleRate: number
): EnergyBands {
  const lowStart = frequencyToBin(LOW_FREQ_MIN, fftSize, sampleRate);
  const lowEnd = frequencyToBin(LOW_FREQ_MAX, fftSize, sampleRate);
  const midStart = frequencyToBin(MID_FREQ_MIN, fftSize, sampleRate);
  const midEnd = frequencyToBin(MID_FREQ_MAX, fftSize, sampleRate);
  const highStart = frequencyToBin(HIGH_FREQ_MIN, fftSize, sampleRate);
  const highEnd = Math.min(frequencyToBin(HIGH_FREQ_MAX, fftSize, sampleRate), fftData.length);

  const low = calculateBandEnergy(fftData, lowStart, lowEnd);
  const mid = calculateBandEnergy(fftData, midStart, midEnd);
  const high = calculateBandEnergy(fftData, highStart, highEnd);
  
  // Weighted total, clamped to 0-1
  const total = Math.min(1, Math.max(0, low * LOW_WEIGHT + mid * MID_WEIGHT + high * HIGH_WEIGHT));

  return { low, mid, high, total };
}

/**
 * Constrains BPM to valid range
 */
export function constrainBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));
}


/**
 * BPM Detector using onset detection
 */
class BpmDetector {
  private onsetTimes: number[] = [];
  private lastEnergy = 0;
  private lastOnsetTime = 0;
  private currentBpm = 120; // Default BPM

  /**
   * Process energy value and detect onsets
   * @returns true if an onset (beat) was detected
   */
  processEnergy(energy: number, timestamp: number): boolean {
    const energyDelta = energy - this.lastEnergy;
    this.lastEnergy = energy;

    // Detect onset: significant energy increase
    const isOnset = energyDelta > ONSET_THRESHOLD && 
                    (timestamp - this.lastOnsetTime) > MIN_ONSET_INTERVAL_MS;

    if (isOnset) {
      this.lastOnsetTime = timestamp;
      this.onsetTimes.push(timestamp);

      // Keep only recent onsets
      if (this.onsetTimes.length > ONSET_HISTORY_SIZE) {
        this.onsetTimes.shift();
      }

      // Calculate BPM from inter-onset intervals
      if (this.onsetTimes.length >= 2) {
        this.updateBpm();
      }
    }

    return isOnset;
  }

  private updateBpm(): void {
    const intervals: number[] = [];
    
    for (let i = 1; i < this.onsetTimes.length; i++) {
      const interval = this.onsetTimes[i] - this.onsetTimes[i - 1];
      if (interval >= MIN_ONSET_INTERVAL_MS && interval <= MAX_ONSET_INTERVAL_MS) {
        intervals.push(interval);
      }
    }

    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = 60000 / avgInterval;
      this.currentBpm = constrainBpm(bpm);
    }
  }

  getBpm(): number {
    return this.currentBpm;
  }

  reset(): void {
    this.onsetTimes = [];
    this.lastEnergy = 0;
    this.lastOnsetTime = 0;
    this.currentBpm = 120;
  }
}


/**
 * AudioAnalyzer - Real-time audio analysis using Web Audio API
 * 
 * Provides FFT analysis, energy band calculation, and BPM detection
 * at 60+ times per second for reactive audio visualization.
 */
export class AudioAnalyzer implements IAudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: AudioNode | MediaStreamAudioSourceNode | null = null;
  private fftData: Float32Array<ArrayBuffer>;
  private normalizedFft: Float32Array<ArrayBuffer>;
  private bpmDetector: BpmDetector;
  private callbacks: Set<(analysis: AudioAnalysis) => void> = new Set();
  private animationFrameId: number | null = null;
  private isConnected = false;

  constructor() {
    // Pre-allocate arrays for FFT data
    this.fftData = new Float32Array(FFT_SIZE / 2);
    this.normalizedFft = new Float32Array(FFT_SIZE / 2);
    this.bpmDetector = new BpmDetector();
  }

  /**
   * Connect to an audio source
   */
  connect(source: AudioNode | MediaStream): void {
    // Create audio context if needed
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Create analyser node
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = FFT_SIZE;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Connect source
    if (source instanceof MediaStream) {
      this.sourceNode = this.audioContext.createMediaStreamSource(source);
      this.sourceNode.connect(this.analyserNode);
    } else {
      this.sourceNode = source;
      source.connect(this.analyserNode);
    }

    this.isConnected = true;
    this.startAnalysisLoop();
  }

  /**
   * Disconnect from current audio source
   */
  disconnect(): void {
    this.stopAnalysisLoop();

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.analyserNode = null;
    }

    this.isConnected = false;
    this.bpmDetector.reset();
  }

  /**
   * Get current audio analysis
   */
  getAnalysis(): AudioAnalysis {
    const timestamp = performance.now();

    if (!this.isConnected || !this.analyserNode) {
      // Return silent state
      return this.createSilentAnalysis(timestamp);
    }

    // Get FFT data (returns values in dB, typically -100 to 0)
    this.analyserNode.getFloatFrequencyData(this.fftData);

    // Normalize FFT data to 0-1 range
    this.normalizeFftData();

    // Calculate energy bands
    const energy = calculateEnergyBands(
      this.normalizedFft,
      FFT_SIZE,
      this.audioContext?.sampleRate ?? SAMPLE_RATE
    );

    // Process BPM detection
    const beat = this.bpmDetector.processEnergy(energy.total, timestamp);
    const bpm = this.bpmDetector.getBpm();

    return {
      timestamp,
      fft: Float32Array.from(this.normalizedFft) as Float32Array<ArrayBuffer>,
      energy,
      bpm,
      beat,
    };
  }

  /**
   * Register callback for analysis updates
   * @returns Unsubscribe function
   */
  onAnalysis(callback: (analysis: AudioAnalysis) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.disconnect();
    this.callbacks.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private normalizeFftData(): void {
    // FFT data is in dB (typically -100 to 0)
    // Normalize to 0-1 range
    const minDb = -100;
    const maxDb = 0;
    const range = maxDb - minDb;

    for (let i = 0; i < this.fftData.length; i++) {
      const db = this.fftData[i];
      // Clamp and normalize
      const normalized = (Math.max(minDb, Math.min(maxDb, db)) - minDb) / range;
      this.normalizedFft[i] = normalized;
    }
  }

  private createSilentAnalysis(timestamp: number): AudioAnalysis {
    return {
      timestamp,
      fft: new Float32Array(FFT_SIZE / 2),
      energy: { low: 0, mid: 0, high: 0, total: 0 },
      bpm: 120, // Default BPM
      beat: false,
    };
  }

  private startAnalysisLoop(): void {
    const loop = () => {
      if (!this.isConnected) return;

      const analysis = this.getAnalysis();
      
      // Notify all callbacks
      for (const callback of this.callbacks) {
        callback(analysis);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopAnalysisLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

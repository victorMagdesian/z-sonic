// SonicOS™ Core Type Definitions

/**
 * Energy levels for different frequency bands
 */
export interface EnergyBands {
  /** Low frequency energy (20-250Hz), normalized 0-1 */
  low: number;
  /** Mid frequency energy (250-4000Hz), normalized 0-1 */
  mid: number;
  /** High frequency energy (4000-20000Hz), normalized 0-1 */
  high: number;
  /** Weighted sum of all bands, normalized 0-1 */
  total: number;
}

/**
 * Audio analysis result from the Audio Analyzer
 */
export interface AudioAnalysis {
  /** Timestamp of the analysis in milliseconds */
  timestamp: number;
  /** FFT data with 1024 frequency bins, normalized 0-1 */
  fft: Float32Array;
  /** Energy levels per frequency band */
  energy: EnergyBands;
  /** Detected BPM (60-200 range) */
  bpm: number;
  /** True when a beat is detected */
  beat: boolean;
}

/**
 * Semantic states representing audio characteristics
 */
export type SemanticState = 'loop' | 'tensao' | 'pico' | 'colapso';

/**
 * State transition event data
 */
export interface StateTransition {
  /** Previous state (null for initial state) */
  from: SemanticState | null;
  /** New state */
  to: SemanticState;
  /** Timestamp of the transition in milliseconds */
  timestamp: number;
  /** Transition duration in milliseconds */
  duration: number;
  /** Description of what triggered the transition */
  trigger: string;
}

/**
 * Configurable thresholds for state detection
 */
export interface StateThresholds {
  /** Max variance for loop detection (default: 0.1) */
  loopVariance: number;
  /** Beats to confirm loop state (default: 4) */
  loopBeats: number;
  /** Beats of rising energy for tension (default: 2) */
  tensionRiseBeats: number;
  /** Energy threshold for pico state (default: 0.9) */
  picoThreshold: number;
  /** Drop ratio for colapso detection (default: 0.5) */
  colapsoDropRatio: number;
}

/**
 * Visual rendering parameters
 */
export interface VisualParams {
  /** Primary color as RGB values (0-1 each) */
  primaryColor: [number, number, number];
  /** Secondary color as RGB values (0-1 each) */
  secondaryColor: [number, number, number];
  /** Accent color as RGB values (0-1 each) */
  accentColor: [number, number, number];
  /** Visual intensity (0-1) */
  intensity: number;
  /** Visual complexity (0-1) */
  complexity: number;
  /** Animation speed multiplier */
  speed: number;
  /** Type of visual pattern */
  patternType: 'geometric' | 'organic' | 'noise';
}


/**
 * Frequency response mapping configuration
 */
export interface FrequencyMapping {
  /** Target visual parameter to affect */
  target: keyof VisualParams;
  /** Scale factor for the mapping */
  scale: number;
  /** Offset value for the mapping */
  offset: number;
}

/**
 * Visual configuration for a state transition
 */
export interface StateVisualConfig {
  /** Transition duration in milliseconds */
  duration: number;
  /** Visual parameters to apply */
  params: Partial<VisualParams>;
}

/**
 * Environment template defining visual theme and behavior
 */
export interface EnvironmentTemplate {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Version string */
  version: string;

  /** Visual configuration */
  visual: {
    /** Color palette */
    palette: {
      /** Primary color (hex) */
      primary: string;
      /** Secondary color (hex) */
      secondary: string;
      /** Accent color (hex) */
      accent: string;
    };
    /** Default visual parameters */
    defaultParams: Partial<VisualParams>;
  };

  /** State configuration */
  states: {
    /** Custom state thresholds */
    thresholds: Partial<StateThresholds>;
    /** Visual transitions per state */
    transitions: {
      [K in SemanticState]: StateVisualConfig;
    };
  };

  /** Frequency response mappings */
  frequencyResponse: {
    low: FrequencyMapping;
    mid: FrequencyMapping;
    high: FrequencyMapping;
  };
}

/**
 * SonicOS SDK configuration
 */
export interface SonicOSConfig {
  /** Canvas element for rendering */
  canvas: HTMLCanvasElement;
  /** Environment template or ID */
  environment: EnvironmentTemplate | string;
  /** Optional audio source */
  audioSource?: AudioNode | MediaStream;
}

/**
 * Runtime metrics from SonicOS
 */
export interface SonicOSMetrics {
  /** Current frames per second */
  fps: number;
  /** Audio processing latency in milliseconds */
  audioLatency: number;
  /** State changes per minute */
  stateChangesPerMinute: number;
}

# Design Document — SonicOS™ Core

## Overview

SonicOS™ é um middleware sensorial que traduz áudio eletrônico em estados semânticos e os manifesta como ambientes visuais em tempo real. O sistema é composto por três engines principais (Audio Analyzer, State Engine, Visual Engine) conectados por um pipeline reativo, com suporte a ambientes customizáveis via templates.

O design prioriza:
- **Performance**: 60fps constante, processamento de áudio em tempo real
- **Modularidade**: Engines desacoplados, comunicação via eventos/observables
- **Extensibilidade**: Sistema de templates para novos ambientes sem modificar o core

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SonicOS SDK                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │    Audio     │───▶│    State     │───▶│    Visual    │       │
│  │   Analyzer   │    │    Engine    │    │    Engine    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Environment Template                     │       │
│  │  (Visual Config + Semantic Rules + Freq Response)    │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
AudioStream → FFT/Energy/BPM → SemanticState → VisualParams → WebGL Render
     │              │                │               │              │
     ▼              ▼                ▼               ▼              ▼
  Input      AudioAnalysis     StateTransition  ShaderUniforms   Frame
```

## Components and Interfaces

### 1. Audio Analyzer

```typescript
interface AudioAnalysis {
  timestamp: number;
  fft: Float32Array;           // 1024 bins, normalized 0-1
  energy: EnergyBands;
  bpm: number;
  beat: boolean;               // true on detected beat
}

interface EnergyBands {
  low: number;                 // 20-250Hz, normalized 0-1
  mid: number;                 // 250-4000Hz, normalized 0-1
  high: number;                // 4000-20000Hz, normalized 0-1
  total: number;               // weighted sum
}

interface IAudioAnalyzer {
  connect(source: AudioNode | MediaStream): void;
  disconnect(): void;
  getAnalysis(): AudioAnalysis;
  onAnalysis(callback: (analysis: AudioAnalysis) => void): () => void;
  dispose(): void;
}
```

### 2. State Engine

```typescript
type SemanticState = 'loop' | 'tensao' | 'pico' | 'colapso';

interface StateTransition {
  from: SemanticState | null;
  to: SemanticState;
  timestamp: number;
  duration: number;            // transition duration in ms
  trigger: string;             // what caused the transition
}

interface StateThresholds {
  loopVariance: number;        // max variance for loop detection (default: 0.1)
  loopBeats: number;           // beats to confirm loop (default: 4)
  tensionRiseBeats: number;    // beats of rising energy (default: 2)
  picoThreshold: number;       // energy threshold for pico (default: 0.9)
  colapsoDropRatio: number;    // drop ratio for colapso (default: 0.5)
}

interface IStateEngine {
  setThresholds(thresholds: Partial<StateThresholds>): void;
  process(analysis: AudioAnalysis): StateTransition | null;
  getCurrentState(): SemanticState;
  getStateHistory(count: number): StateTransition[];
  onTransition(callback: (transition: StateTransition) => void): () => void;
  reset(): void;
}
```

### 3. Visual Engine

```typescript
interface VisualParams {
  primaryColor: [number, number, number];    // RGB 0-1
  secondaryColor: [number, number, number];
  accentColor: [number, number, number];
  intensity: number;                          // 0-1
  complexity: number;                         // 0-1
  speed: number;                              // multiplier
  patternType: 'geometric' | 'organic' | 'noise';
}

interface IVisualEngine {
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  setParams(params: Partial<VisualParams>): void;
  setTransition(duration: number): void;
  render(time: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
  isContextValid(): boolean;
}
```

### 4. Environment Template

```typescript
interface EnvironmentTemplate {
  id: string;
  name: string;
  version: string;
  
  // Visual configuration
  visual: {
    palette: {
      primary: string;         // hex color
      secondary: string;
      accent: string;
    };
    defaultParams: Partial<VisualParams>;
  };
  
  // Semantic rules
  states: {
    thresholds: Partial<StateThresholds>;
    transitions: {
      [K in SemanticState]: {
        duration: number;
        params: Partial<VisualParams>;
      };
    };
  };
  
  // Frequency response mappings
  frequencyResponse: {
    low: FrequencyMapping;
    mid: FrequencyMapping;
    high: FrequencyMapping;
  };
}

interface FrequencyMapping {
  target: keyof VisualParams;
  scale: number;
  offset: number;
}
```

### 5. SonicOS SDK

```typescript
interface SonicOSConfig {
  canvas: HTMLCanvasElement;
  environment: EnvironmentTemplate | string;  // template or ID
  audioSource?: AudioNode | MediaStream;
}

interface SonicOSMetrics {
  fps: number;
  audioLatency: number;
  stateChangesPerMinute: number;
}

interface ISonicOS {
  // Lifecycle
  initialize(config: SonicOSConfig): Promise<void>;
  start(): void;
  stop(): void;
  dispose(): void;
  
  // Audio
  connectAudio(source: AudioNode | MediaStream): void;
  disconnectAudio(): void;
  
  // Environment
  loadEnvironment(template: EnvironmentTemplate | string): Promise<void>;
  getEnvironment(): EnvironmentTemplate;
  
  // State
  getCurrentState(): SemanticState;
  getVisualParams(): VisualParams;
  getAudioAnalysis(): AudioAnalysis;
  getMetrics(): SonicOSMetrics;
  
  // Events
  onStateChange(callback: (transition: StateTransition) => void): () => void;
  onError(callback: (error: SonicOSError) => void): () => void;
}

interface SonicOSError {
  code: string;
  message: string;
  recoverable: boolean;
}
```

## Data Models

### Environment JSON Schema

```typescript
interface EnvironmentJSON {
  id: string;
  name: string;
  version: string;
  visual: {
    palette: {
      primary: string;
      secondary: string;
      accent: string;
    };
    defaultParams: {
      intensity?: number;
      complexity?: number;
      speed?: number;
      patternType?: string;
    };
  };
  states: {
    thresholds?: {
      loopVariance?: number;
      loopBeats?: number;
      tensionRiseBeats?: number;
      picoThreshold?: number;
      colapsoDropRatio?: number;
    };
    transitions: {
      loop: StateVisualConfig;
      tensao: StateVisualConfig;
      pico: StateVisualConfig;
      colapso: StateVisualConfig;
    };
  };
  frequencyResponse: {
    low: FrequencyMappingJSON;
    mid: FrequencyMappingJSON;
    high: FrequencyMappingJSON;
  };
}

interface StateVisualConfig {
  duration: number;
  params: {
    intensity?: number;
    complexity?: number;
    speed?: number;
  };
}

interface FrequencyMappingJSON {
  target: string;
  scale: number;
  offset: number;
}
```

### Hard Techno Ritual Environment

```json
{
  "id": "hard-techno-ritual",
  "name": "Hard Techno Ritual",
  "version": "1.0.0",
  "visual": {
    "palette": {
      "primary": "#000000",
      "secondary": "#8B0000",
      "accent": "#FFFFFF"
    },
    "defaultParams": {
      "intensity": 0.7,
      "complexity": 0.5,
      "speed": 1.0,
      "patternType": "geometric"
    }
  },
  "states": {
    "thresholds": {
      "loopVariance": 0.1,
      "loopBeats": 4,
      "tensionRiseBeats": 2,
      "picoThreshold": 0.9,
      "colapsoDropRatio": 0.5
    },
    "transitions": {
      "loop": {
        "duration": 500,
        "params": { "intensity": 0.5, "complexity": 0.3, "speed": 0.8 }
      },
      "tensao": {
        "duration": 300,
        "params": { "intensity": 0.7, "complexity": 0.6, "speed": 1.2 }
      },
      "pico": {
        "duration": 100,
        "params": { "intensity": 1.0, "complexity": 0.9, "speed": 1.5 }
      },
      "colapso": {
        "duration": 200,
        "params": { "intensity": 0.2, "complexity": 0.1, "speed": 0.5 }
      }
    }
  },
  "frequencyResponse": {
    "low": { "target": "intensity", "scale": 0.3, "offset": 0 },
    "mid": { "target": "complexity", "scale": 0.2, "offset": 0 },
    "high": { "target": "speed", "scale": 0.4, "offset": 0.8 }
  }
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: FFT Output Validity
*For any* audio input buffer, the Audio Analyzer SHALL produce FFT data with exactly 1024 frequency bins, each normalized between 0 and 1.
**Validates: Requirements 1.1**

### Property 2: Energy Band Calculation
*For any* FFT data array, the calculated energy bands (low, mid, high, total) SHALL all be normalized values between 0 and 1, and total SHALL equal the weighted sum of the three bands.
**Validates: Requirements 1.2**

### Property 3: BPM Range Constraint
*For any* detected BPM value, the value SHALL be within the range of 60 to 200 beats per minute.
**Validates: Requirements 1.3**

### Property 4: State Validity
*For any* audio analysis input, the State Engine SHALL return a state that is one of the valid semantic states: 'loop', 'tensao', 'pico', or 'colapso'.
**Validates: Requirements 2.1**

### Property 5: State Transition Metadata Completeness
*For any* state transition, the transition object SHALL contain non-null values for: from (previous state or null for initial), to (new state), timestamp, duration, and trigger.
**Validates: Requirements 2.6**

### Property 6: Visual Parameter Interpolation
*For any* state transition with duration > 0, visual parameters at time t (where 0 < t < duration) SHALL be interpolated values between the start and end parameter sets.
**Validates: Requirements 3.4**

### Property 7: Environment Template Parsing Completeness
*For any* valid environment template JSON, parsing SHALL produce an EnvironmentTemplate object with all required fields populated: id, name, version, visual, states, and frequencyResponse.
**Validates: Requirements 4.1**

### Property 8: Invalid Configuration Rejection
*For any* JSON configuration missing required fields or containing invalid values, the system SHALL reject it and return an error with a non-empty message describing the validation failure.
**Validates: Requirements 4.2, 6.4**

### Property 9: Custom Threshold Override
*For any* environment template with custom state thresholds, the State Engine SHALL use those custom values instead of defaults when processing audio analysis.
**Validates: Requirements 4.4**

### Property 10: State-Visual Parameter Mapping
*For any* semantic state in an active environment, the Visual Engine SHALL apply the visual parameters defined in that environment's state transitions configuration for that state.
**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 11: Environment Serialization Round-Trip
*For any* valid EnvironmentTemplate object, serializing to JSON and then deserializing SHALL produce an equivalent EnvironmentTemplate object.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 12: SDK Query Validity
*For any* running SonicOS instance, calling getCurrentState() SHALL return a valid SemanticState, getVisualParams() SHALL return a valid VisualParams object, and getAudioAnalysis() SHALL return a valid AudioAnalysis object.
**Validates: Requirements 7.2**

### Property 13: Error Event Structure
*For any* error emitted by the SDK, the error object SHALL contain a non-empty code string, a non-empty message string, and a boolean recoverable flag.
**Validates: Requirements 7.4**

## Error Handling

### Error Categories

| Code | Category | Recoverable | Description |
|------|----------|-------------|-------------|
| `AUDIO_CONNECT_FAILED` | Audio | Yes | Failed to connect to audio source |
| `AUDIO_STREAM_LOST` | Audio | Yes | Audio stream disconnected |
| `WEBGL_INIT_FAILED` | Visual | No | WebGL2 not supported or init failed |
| `WEBGL_CONTEXT_LOST` | Visual | Yes | WebGL context lost, attempting recovery |
| `SHADER_COMPILE_ERROR` | Visual | No | Shader compilation failed |
| `ENV_PARSE_ERROR` | Config | Yes | Environment JSON parsing failed |
| `ENV_VALIDATION_ERROR` | Config | Yes | Environment validation failed |
| `ENV_NOT_FOUND` | Config | Yes | Environment ID not found |

### Recovery Strategies

1. **Audio Errors**: Emit silent state, continue visual rendering, attempt reconnection
2. **WebGL Context Lost**: Attempt context restoration up to 3 times, then emit fatal error
3. **Config Errors**: Fall back to default environment, emit warning

## Testing Strategy

### Property-Based Testing Library

**Library**: [fast-check](https://github.com/dubzzz/fast-check) for TypeScript/JavaScript

Configuration:
- Minimum 100 iterations per property test
- Seed logging for reproducibility
- Shrinking enabled for minimal failing examples

### Test Categories

#### Unit Tests
- Audio Analyzer: FFT computation, energy calculation, BPM detection
- State Engine: Individual state transition logic, threshold handling
- Visual Engine: Shader compilation, parameter interpolation
- Environment: JSON parsing, validation, serialization

#### Property-Based Tests
Each correctness property will have a corresponding property-based test:

1. **Property 1 Test**: Generate random audio buffers → verify FFT output structure
2. **Property 2 Test**: Generate random FFT arrays → verify energy band normalization
3. **Property 3 Test**: Generate audio with known BPM → verify detection range
4. **Property 4 Test**: Generate random AudioAnalysis → verify state validity
5. **Property 5 Test**: Trigger state transitions → verify metadata completeness
6. **Property 6 Test**: Generate transitions with duration → verify interpolation
7. **Property 7 Test**: Generate valid JSON templates → verify parsing completeness
8. **Property 8 Test**: Generate invalid JSON → verify rejection with error
9. **Property 9 Test**: Generate templates with custom thresholds → verify override
10. **Property 10 Test**: Generate state sequences → verify visual param mapping
11. **Property 11 Test**: Generate EnvironmentTemplate → verify round-trip equality
12. **Property 12 Test**: Query running instance → verify return types
13. **Property 13 Test**: Trigger errors → verify error structure

### Test Annotation Format

All property-based tests must include:
```typescript
/**
 * Feature: sonic-os-core, Property {number}: {property_text}
 * Validates: Requirements {X.Y}
 */
```

### Integration Tests
- Full pipeline: Audio → State → Visual flow
- Environment switching during playback
- Error recovery scenarios

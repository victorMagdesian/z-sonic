# Implementation Plan — SonicOS™ Core

- [x] 1. Set up project structure and core types






  - [x] 1.1 Initialize TypeScript project with Vite, configure tsconfig and package.json

    - Set up src/ directory structure: core/, audio/, state/, visual/, environments/
    - Configure TypeScript strict mode, ES2022 target
    - Add fast-check as dev dependency for property testing
    - _Requirements: 7.1_

  - [x] 1.2 Create core type definitions and interfaces

    - Create `src/core/types.ts` with all interfaces: AudioAnalysis, EnergyBands, SemanticState, StateTransition, VisualParams, EnvironmentTemplate
    - Create `src/core/errors.ts` with SonicOSError interface and error codes enum
    - _Requirements: 2.1, 7.4_

- [x] 2. Implement Audio Analyzer





  - [x] 2.1 Create AudioAnalyzer class with FFT computation


    - Implement Web Audio API integration with AnalyserNode
    - Configure FFT size 2048 for 1024 frequency bins
    - Implement getAnalysis() returning AudioAnalysis
    - _Requirements: 1.1, 1.4_
  - [ ]* 2.2 Write property test for FFT output validity
    - **Property 1: FFT Output Validity**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Implement energy band calculation

    - Calculate low (20-250Hz), mid (250-4kHz), high (4k-20kHz) energy
    - Normalize all values to 0-1 range
    - Implement weighted total calculation
    - _Requirements: 1.2_
  - [ ]* 2.4 Write property test for energy band calculation
    - **Property 2: Energy Band Calculation**
    - **Validates: Requirements 1.2**

  - [x] 2.5 Implement BPM detection

    - Implement onset detection from energy peaks
    - Calculate BPM from inter-onset intervals
    - Constrain output to 60-200 BPM range
    - _Requirements: 1.3_
  - [ ]* 2.6 Write property test for BPM range constraint
    - **Property 3: BPM Range Constraint**
    - **Validates: Requirements 1.3**
  - [ ]* 2.7 Write unit tests for AudioAnalyzer
    - Test connect/disconnect lifecycle
    - Test silent audio handling (edge case for 1.5)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 3. Implement State Engine
  - [ ] 3.1 Create StateEngine class with state determination logic
    - Implement process() method that takes AudioAnalysis
    - Implement state history tracking
    - Implement getCurrentState() and getStateHistory()
    - _Requirements: 2.1_
  - [ ]* 3.2 Write property test for state validity
    - **Property 4: State Validity**
    - **Validates: Requirements 2.1**
  - [ ] 3.3 Implement state transition logic
    - Implement Loop detection (stable energy for 4+ beats)
    - Implement Tensão detection (rising energy for 2+ beats)
    - Implement Pico detection (energy > 90%)
    - Implement Colapso detection (50%+ drop after Pico)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - [ ] 3.4 Implement transition metadata emission
    - Create StateTransition objects with from, to, timestamp, duration, trigger
    - Implement onTransition callback registration
    - _Requirements: 2.6_
  - [ ]* 3.5 Write property test for transition metadata completeness
    - **Property 5: State Transition Metadata Completeness**
    - **Validates: Requirements 2.6**
  - [ ] 3.6 Implement configurable thresholds
    - Implement setThresholds() for custom StateThresholds
    - Store and apply custom thresholds in state determination
    - _Requirements: 4.4_
  - [ ]* 3.7 Write property test for custom threshold override
    - **Property 9: Custom Threshold Override**
    - **Validates: Requirements 4.4**
  - [ ]* 3.8 Write unit tests for StateEngine
    - Test each state transition scenario
    - Test threshold configuration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Environment System
  - [ ] 5.1 Create environment JSON schema and validation
    - Implement validateEnvironment() function
    - Define required fields and value constraints
    - Return descriptive error messages for invalid configs
    - _Requirements: 4.2, 6.4_
  - [ ]* 5.2 Write property test for invalid configuration rejection
    - **Property 8: Invalid Configuration Rejection**
    - **Validates: Requirements 4.2, 6.4**
  - [ ] 5.3 Implement environment parsing and serialization
    - Implement parseEnvironment() from JSON string
    - Implement serializeEnvironment() to JSON string
    - Ensure round-trip consistency
    - _Requirements: 4.1, 6.1, 6.2, 6.3_
  - [ ]* 5.4 Write property test for environment parsing completeness
    - **Property 7: Environment Template Parsing Completeness**
    - **Validates: Requirements 4.1**
  - [ ]* 5.5 Write property test for serialization round-trip
    - **Property 11: Environment Serialization Round-Trip**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [ ] 5.6 Create Hard Techno Ritual environment template
    - Create `src/environments/hard-techno-ritual.json`
    - Define palette: black, deep red, white
    - Define state transitions with visual params
    - _Requirements: 5.1_
  - [ ]* 5.7 Write unit tests for environment system
    - Test parsing valid/invalid JSON
    - Test serialization output
    - _Requirements: 4.1, 4.2, 6.1, 6.2, 6.3, 6.4_

- [ ] 6. Implement Visual Engine
  - [ ] 6.1 Create VisualEngine class with WebGL2 initialization
    - Implement initialize() with canvas and WebGL2 context
    - Load and compile vertex/fragment shaders
    - Handle context loss/restoration
    - _Requirements: 3.1, 3.5_
  - [ ] 6.2 Implement shader programs
    - Create base vertex shader for fullscreen quad
    - Create fragment shader with color, intensity, complexity uniforms
    - Implement geometric pattern generation in shader
    - _Requirements: 3.3_
  - [ ] 6.3 Implement visual parameter handling
    - Implement setParams() for updating VisualParams
    - Implement parameter interpolation for transitions
    - Map VisualParams to shader uniforms
    - _Requirements: 3.4_
  - [ ]* 6.4 Write property test for visual parameter interpolation
    - **Property 6: Visual Parameter Interpolation**
    - **Validates: Requirements 3.4**
  - [ ] 6.5 Implement state-to-visual mapping
    - Apply environment's state transition params on state change
    - Implement setTransition() for transition duration
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  - [ ]* 6.6 Write property test for state-visual parameter mapping
    - **Property 10: State-Visual Parameter Mapping**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
  - [ ] 6.7 Implement render loop
    - Implement render(time) method
    - Update uniforms and draw fullscreen quad
    - Track FPS for metrics
    - _Requirements: 3.2_
  - [ ]* 6.8 Write unit tests for VisualEngine
    - Test initialization
    - Test parameter updates
    - Test resize handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement SonicOS SDK
  - [ ] 8.1 Create SonicOS main class
    - Implement initialize() with SonicOSConfig
    - Wire up AudioAnalyzer → StateEngine → VisualEngine pipeline
    - Implement start(), stop(), dispose() lifecycle methods
    - _Requirements: 7.1, 7.3_
  - [ ] 8.2 Implement audio connection methods
    - Implement connectAudio() for AudioNode or MediaStream
    - Implement disconnectAudio() with cleanup
    - _Requirements: 7.1_
  - [ ] 8.3 Implement environment management
    - Implement loadEnvironment() for template or ID
    - Implement getEnvironment() returning current template
    - Support runtime environment switching
    - _Requirements: 4.3_
  - [ ] 8.4 Implement query methods
    - Implement getCurrentState(), getVisualParams(), getAudioAnalysis()
    - Implement getMetrics() returning fps, latency, state changes
    - _Requirements: 7.2_
  - [ ]* 8.5 Write property test for SDK query validity
    - **Property 12: SDK Query Validity**
    - **Validates: Requirements 7.2**
  - [ ] 8.6 Implement error handling and events
    - Implement onStateChange() callback registration
    - Implement onError() callback registration
    - Emit SonicOSError with code, message, recoverable
    - _Requirements: 7.4_
  - [ ]* 8.7 Write property test for error event structure
    - **Property 13: Error Event Structure**
    - **Validates: Requirements 7.4**
  - [ ]* 8.8 Write unit tests for SonicOS SDK
    - Test lifecycle methods
    - Test environment switching
    - Test error emission
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. Create Demo Application
  - [ ] 9.1 Create minimal HTML demo page
    - Create `demo/index.html` with canvas element
    - Add audio file input or microphone selection
    - Initialize SonicOS with Hard Techno Ritual environment
    - _Requirements: 7.1_
  - [ ] 9.2 Add debug overlay
    - Display current state, BPM, energy levels
    - Display FPS and metrics
    - _Requirements: 7.2_

- [ ] 10. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

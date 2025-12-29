# Requirements Document

## Introduction

SonicOS™ é um middleware sensorial que traduz áudio eletrônico em estados semânticos e os manifesta como ambientes visuais vivos em tempo real. Este documento especifica os requisitos para o core do sistema, incluindo o Audio Analyzer, State Engine, Visual Engine e o ambiente flagship "Hard Techno Ritual".

O sistema atua como camada nervosa entre áudio e percepção, sendo plugável (não invasivo) e funcionando como motor audiovisual reativo com performance de 60fps em desktop.

## Glossary

- **SonicOS**: Middleware sensorial que traduz áudio em estados visuais
- **Audio Analyzer**: Componente responsável por extrair características do áudio (FFT, energia, BPM)
- **State Engine**: Motor de estados semânticos que interpreta dados do áudio
- **Visual Engine**: Motor de renderização WebGL baseado em shaders
- **FFT (Fast Fourier Transform)**: Transformada que converte sinal de áudio em espectro de frequências
- **BPM (Beats Per Minute)**: Medida de tempo/ritmo do áudio
- **Energy Level**: Nível de energia/intensidade do áudio em um momento
- **Semantic State**: Estado interpretado do áudio (Loop, Tensão, Pico, Colapso)
- **Environment/Ambiente**: Configuração visual completa com regras semânticas e respostas por frequência
- **Visual Params**: Parâmetros que controlam a renderização visual (cor, intensidade, forma)

## Requirements

### Requirement 1: Audio Analysis

**User Story:** As a developer, I want to analyze audio streams in real-time, so that I can extract meaningful characteristics for visual generation.

#### Acceptance Criteria

1. WHEN an audio stream is provided THEN the Audio Analyzer SHALL compute FFT data with frequency bins covering 20Hz to 20kHz
2. WHEN FFT data is computed THEN the Audio Analyzer SHALL calculate energy levels for low (20-250Hz), mid (250-4000Hz), and high (4000-20000Hz) frequency bands
3. WHEN audio frames are processed THEN the Audio Analyzer SHALL detect BPM within a range of 60 to 200 beats per minute
4. WHEN the Audio Analyzer processes audio THEN the system SHALL emit analysis results at a minimum rate of 60 times per second
5. IF the audio stream becomes unavailable THEN the Audio Analyzer SHALL emit a silent state with zero energy levels

### Requirement 2: State Engine

**User Story:** As a developer, I want to translate audio characteristics into semantic states, so that visual responses can be meaningful and context-aware.

#### Acceptance Criteria

1. WHEN the State Engine receives audio analysis data THEN the State Engine SHALL determine the current semantic state based on energy thresholds and patterns
2. WHEN energy levels remain stable within 10% variance for more than 4 beats THEN the State Engine SHALL transition to Loop state
3. WHEN energy levels increase progressively over 2 or more beats THEN the State Engine SHALL transition to Tensão (Tension) state
4. WHEN energy level exceeds 90% of maximum THEN the State Engine SHALL transition to Pico (Peak) state
5. WHEN energy level drops more than 50% within 1 beat after a Pico state THEN the State Engine SHALL transition to Colapso (Collapse) state
6. WHEN a state transition occurs THEN the State Engine SHALL emit the new state with transition metadata including previous state and transition duration

### Requirement 3: Visual Engine

**User Story:** As a developer, I want to render reactive visuals using WebGL shaders, so that the system can display fluid, performant graphics synchronized to audio.

#### Acceptance Criteria

1. WHEN the Visual Engine initializes THEN the Visual Engine SHALL create a WebGL2 context with shader programs loaded
2. WHEN visual params are updated THEN the Visual Engine SHALL render a new frame within 16.67ms to maintain 60fps
3. WHEN rendering a frame THEN the Visual Engine SHALL use only shader-based rendering without video textures
4. WHEN the current state changes THEN the Visual Engine SHALL interpolate visual parameters over the transition duration
5. IF WebGL context is lost THEN the Visual Engine SHALL attempt context restoration and resume rendering

### Requirement 4: Environment Template System

**User Story:** As a developer, I want to define environments as reusable templates, so that new visual themes can be created without modifying the core engine.

#### Acceptance Criteria

1. WHEN an environment template is loaded THEN the system SHALL parse visual configuration, semantic rules, and frequency response mappings
2. WHEN the system initializes THEN the system SHALL validate the environment template against the required schema
3. WHEN multiple environments are available THEN the system SHALL allow runtime switching between environments without audio interruption
4. WHEN an environment defines custom state thresholds THEN the State Engine SHALL use those thresholds instead of defaults

### Requirement 5: Hard Techno Ritual Environment

**User Story:** As a user, I want to experience the Hard Techno Ritual environment, so that I can visualize hard techno music with appropriate aesthetic responses.

#### Acceptance Criteria

1. WHEN the Hard Techno Ritual environment is active THEN the Visual Engine SHALL use only black (#000000), deep red (#8B0000), and blown-out white (#FFFFFF) colors
2. WHEN in Loop state THEN the Visual Engine SHALL render repetitive geometric patterns with minimal variation
3. WHEN in Tensão state THEN the Visual Engine SHALL increase visual pressure through converging elements and rising intensity
4. WHEN in Pico state THEN the Visual Engine SHALL render maximum intensity with white flash elements
5. WHEN in Colapso state THEN the Visual Engine SHALL rapidly reduce visual elements to near-black with residual red traces

### Requirement 6: Data Serialization

**User Story:** As a developer, I want to serialize and deserialize environment configurations, so that environments can be saved, shared, and loaded from files.

#### Acceptance Criteria

1. WHEN an environment configuration is serialized THEN the system SHALL encode it as valid JSON
2. WHEN a JSON environment configuration is parsed THEN the system SHALL reconstruct the equivalent environment object
3. WHEN serializing then deserializing an environment THEN the system SHALL produce an equivalent configuration to the original
4. IF the JSON configuration contains invalid fields THEN the system SHALL reject the configuration with descriptive error messages

### Requirement 7: System Integration

**User Story:** As a developer, I want to integrate SonicOS into web applications, so that I can add reactive audio visualization to any project.

#### Acceptance Criteria

1. WHEN the SonicOS SDK is initialized THEN the system SHALL expose a single entry point for configuration and startup
2. WHEN the system is running THEN the SDK SHALL provide methods to query current state, visual params, and audio metrics
3. WHEN the system is stopped THEN the SDK SHALL release all audio and WebGL resources cleanly
4. WHEN errors occur during operation THEN the SDK SHALL emit error events with actionable error codes and messages

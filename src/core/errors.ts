// SonicOS™ Error Definitions

/**
 * Error codes for SonicOS operations
 */
export enum SonicOSErrorCode {
  // Audio errors
  AUDIO_CONNECT_FAILED = 'AUDIO_CONNECT_FAILED',
  AUDIO_STREAM_LOST = 'AUDIO_STREAM_LOST',

  // Visual/WebGL errors
  WEBGL_INIT_FAILED = 'WEBGL_INIT_FAILED',
  WEBGL_CONTEXT_LOST = 'WEBGL_CONTEXT_LOST',
  SHADER_COMPILE_ERROR = 'SHADER_COMPILE_ERROR',

  // Configuration errors
  ENV_PARSE_ERROR = 'ENV_PARSE_ERROR',
  ENV_VALIDATION_ERROR = 'ENV_VALIDATION_ERROR',
  ENV_NOT_FOUND = 'ENV_NOT_FOUND',
}

/**
 * Error object emitted by SonicOS SDK
 */
export interface SonicOSError {
  /** Error code identifying the type of error */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Whether the error is recoverable */
  recoverable: boolean;
}

/**
 * Error metadata for each error code
 */
export const ERROR_METADATA: Record<SonicOSErrorCode, { recoverable: boolean; category: string }> = {
  [SonicOSErrorCode.AUDIO_CONNECT_FAILED]: { recoverable: true, category: 'Audio' },
  [SonicOSErrorCode.AUDIO_STREAM_LOST]: { recoverable: true, category: 'Audio' },
  [SonicOSErrorCode.WEBGL_INIT_FAILED]: { recoverable: false, category: 'Visual' },
  [SonicOSErrorCode.WEBGL_CONTEXT_LOST]: { recoverable: true, category: 'Visual' },
  [SonicOSErrorCode.SHADER_COMPILE_ERROR]: { recoverable: false, category: 'Visual' },
  [SonicOSErrorCode.ENV_PARSE_ERROR]: { recoverable: true, category: 'Config' },
  [SonicOSErrorCode.ENV_VALIDATION_ERROR]: { recoverable: true, category: 'Config' },
  [SonicOSErrorCode.ENV_NOT_FOUND]: { recoverable: true, category: 'Config' },
};

/**
 * Creates a SonicOSError object
 */
export function createSonicOSError(code: SonicOSErrorCode, message: string): SonicOSError {
  const metadata = ERROR_METADATA[code];
  return {
    code,
    message,
    recoverable: metadata.recoverable,
  };
}

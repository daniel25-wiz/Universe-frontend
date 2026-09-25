/**
 * Barrel for the centralized backend-response normalizers.
 *
 * Every Real*Api implementation imports from here so dialect handling
 * (snake_case, envelopes, numeric strings, DRF pagination) lives in exactly
 * one place. The mock API does NOT use these — it emits contract-shaped data
 * directly.
 */
export * from './primitives';
export * from './product';
export * from './user';

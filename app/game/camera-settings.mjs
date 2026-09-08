export const MIN_ZOOM = .65;
export const MAX_ZOOM = 3.2;
export const DEFAULT_ZOOM = 1;
export const INITIAL_ZOOM = 1.75;
export const clampZoom = (value) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

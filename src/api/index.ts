import { config } from './config';
import { ApiBundle } from './repository';
import { mockApi } from './mock';
import { wordpressApi } from './wordpress/client';

/**
 * Single entry point for the whole app.
 * UI/services import { api } — never import mock or wordpress directly.
 * Switch via EXPO_PUBLIC_API_MODE=mock|wordpress (default mock).
 */
export const api: ApiBundle = config.apiMode === 'wordpress' ? wordpressApi : mockApi;

export * from './repository';
export { config } from './config';
export { isMockMode } from './config';

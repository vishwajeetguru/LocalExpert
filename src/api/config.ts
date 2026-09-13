export type AppEnv = 'staging' | 'production';

const appEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? 'staging') as AppEnv;

function resolveUrl(): string {
  if (appEnv === 'production') {
    return process.env.EXPO_PUBLIC_API_URL_PRODUCTION ?? '';
  }
  return (
    process.env.EXPO_PUBLIC_API_URL_STAGING ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://vishwaguru.local/wp-json/sevasathi/v1'
  );
}

export const config = {
  apiUrl: resolveUrl().replace(/\/$/, ''),
  apiMode: (process.env.EXPO_PUBLIC_API_MODE ?? 'wordpress') as 'mock' | 'wordpress',
  appEnv,
  /** Live-Link tunnel credentials (staging only) — sent as HTTP Basic, never stored. */
  tunnelUser: process.env.EXPO_PUBLIC_TUNNEL_USER ?? '',
  tunnelPass: process.env.EXPO_PUBLIC_TUNNEL_PASS ?? '',
  appName: 'SevaSathi',
  tagline: 'Find trusted local services near you.',
  demoCity: 'Shegaon, Maharashtra',
  defaultCity: 'Shegaon',
  supportPhone: '+91 98XXXXXX00',
  pageSize: 12,
  /** Live-sync poll interval (ms) for catalog/vendor/request changes. */
  syncIntervalMs: 20000,
} as const;

export const isMockMode = config.apiMode === 'mock';

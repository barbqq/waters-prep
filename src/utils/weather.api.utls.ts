import { APIResponse, Response as PlaywrightResponse } from '@playwright/test';

export interface OpenWeatherResponse {
  current: {
    temp: number;
    feels_like?: number;
    humidity?: number;
  };
}

export function isOpenWeatherResponse(json: unknown): json is OpenWeatherResponse {
  if (typeof json !== 'object' || json === null) {
    return false;
  }

  const res = json as Record<string, unknown>;
  const current = res.current as Record<string, unknown> | undefined;

  return typeof current === 'object' && current !== null && typeof current.temp === 'number';
}

export async function parseOpenWeatherResponse(
  response: APIResponse | Response | PlaywrightResponse,
): Promise<OpenWeatherResponse> {
  const json: unknown = await response.json();
  if (!isOpenWeatherResponse(json)) {
    throw new Error('Invalid OpenWeather API response format: missing current.temp');
  }
  return json;
}

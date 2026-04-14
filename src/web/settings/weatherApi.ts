import { getSetting, setSetting } from "../../db/settings.js";

const WEATHER_API_KEY_SETTING = "weather.apiKey";

export interface WeatherApiSettings {
  configured: boolean;
  updatedAt: number | null;
}

function toSettings(value: string | null | undefined, updatedAt: number | null): WeatherApiSettings {
  return {
    configured: Boolean(value?.trim()),
    updatedAt,
  };
}

export function getWeatherApiKey(): string | null {
  const value = getSetting(WEATHER_API_KEY_SETTING)?.value.trim();
  return value ? value : null;
}

export function getWeatherApiSettings(): WeatherApiSettings {
  const record = getSetting(WEATHER_API_KEY_SETTING);
  return toSettings(record?.value, record?.updatedAt ?? null);
}

export function setWeatherApiKey(apiKey: string): WeatherApiSettings {
  const record = setSetting(WEATHER_API_KEY_SETTING, apiKey.trim());
  return toSettings(record.value, record.updatedAt);
}

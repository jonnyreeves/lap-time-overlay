const WEATHER_API_KEY_ENV = "WEATHER_API_KEY";
const WEATHER_API_ENDPOINT = "https://api.weatherapi.com/v1/history.json";

type WeatherApiHour = {
  time?: string;
  temp_c?: number;
  precip_mm?: number;
  condition?: WeatherApiCondition;
};

type WeatherApiDay = {
  avgtemp_c?: number;
  totalprecip_mm?: number;
  condition?: WeatherApiCondition;
};

type WeatherApiCondition = {
  text?: string;
};

type WeatherApiForecastDay = {
  date?: string;
  day?: WeatherApiDay;
  hour?: WeatherApiHour[];
};

type WeatherApiHistoryResponse = {
  forecast?: {
    forecastday?: WeatherApiForecastDay[];
  };
};

type NormalizedWeatherCondition = "Dry" | "Wet";

const PRECIP_DRY_THRESHOLD_MM = 0.1;
const WET_CONDITION_KEYWORDS = [
  "rain",
  "drizzle",
  "shower",
  "sleet",
  "snow",
  "hail",
  "thunder",
  "storm",
  "ice",
] as const;

function normalizePostcode(postcode: string | null | undefined): string | null {
  if (!postcode) return null;
  const normalized = postcode.trim().toUpperCase().replace(/\s+/g, " ");
  if (!normalized) return null;
  return normalized;
}

function parseSessionDateTime(
  sessionDate: string | null | undefined
): { date: string; hour: number | null } | null {
  if (!sessionDate) return null;
  const trimmed = sessionDate.trim();
  if (!trimmed) return null;

  const [datePart, timePart] = trimmed.split("T");
  if (!datePart) return null;

  if (!timePart) {
    return { date: datePart, hour: null };
  }

  const cleaned = timePart.replace(/Z$/, "");
  const [hours, minutes] = cleaned.split(":");
  if (!hours) {
    return { date: datePart, hour: null };
  }

  const parsedHours = Number.parseInt(hours, 10);
  if (!Number.isInteger(parsedHours) || parsedHours < 0 || parsedHours > 23) {
    return { date: datePart, hour: null };
  }

  const parsedMinutes = minutes ? Number.parseInt(minutes, 10) : 0;
  if (Number.isInteger(parsedMinutes) && parsedMinutes >= 30 && parsedHours < 23) {
    return { date: datePart, hour: parsedHours + 1 };
  }

  return { date: datePart, hour: parsedHours };
}

function findHourlyTemperature(
  hours: WeatherApiHour[] | undefined,
  date: string,
  hour: number | null
): number | null {
  if (!hours || hour == null) return null;
  const targetPrefix = `${date} ${String(hour).padStart(2, "0")}:`;
  const match = hours.find((entry) => entry.time?.startsWith(targetPrefix));
  const temperature = match?.temp_c;
  if (typeof temperature !== "number" || !Number.isFinite(temperature)) {
    return null;
  }
  return temperature;
}

function findHourlyPrecip(
  hours: WeatherApiHour[] | undefined,
  date: string,
  hour: number | null
): number | null {
  if (!hours || hour == null) return null;
  const targetPrefix = `${date} ${String(hour).padStart(2, "0")}:`;
  const match = hours.find((entry) => entry.time?.startsWith(targetPrefix));
  const precip = match?.precip_mm;
  if (typeof precip !== "number" || !Number.isFinite(precip)) {
    return null;
  }
  return precip;
}

function findHourlyCondition(
  hours: WeatherApiHour[] | undefined,
  date: string,
  hour: number | null
): string | null {
  if (!hours || hour == null) return null;
  const targetPrefix = `${date} ${String(hour).padStart(2, "0")}:`;
  const match = hours.find((entry) => entry.time?.startsWith(targetPrefix));
  const condition = match?.condition?.text?.trim();
  return condition ? condition : null;
}

function normalizePrecipCondition(
  precip: number | null | undefined
): NormalizedWeatherCondition | null {
  if (precip == null) return null;
  if (!Number.isFinite(precip)) return null;
  return precip > PRECIP_DRY_THRESHOLD_MM ? "Wet" : "Dry";
}

function normalizeCondition(raw: string | null | undefined): NormalizedWeatherCondition | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase();
  const isWet = WET_CONDITION_KEYWORDS.some((keyword) => normalized.includes(keyword));
  return isWet ? "Wet" : "Dry";
}

export async function fetchWeatherForPostcode(
  postcode: string | null | undefined,
  sessionDate: string | null | undefined
): Promise<{ temperature: string | null; conditions: NormalizedWeatherCondition | null } | null> {
  const apiKey = process.env[WEATHER_API_KEY_ENV];
  if (!apiKey) {
    console.warn(`Missing ${WEATHER_API_KEY_ENV} env var; skipping weather lookup.`);
    return null;
  }
  const normalizedPostcode = normalizePostcode(postcode);
  if (!normalizedPostcode) return null;

  const parsedDateTime = parseSessionDateTime(sessionDate);
  if (!parsedDateTime) return null;

  const url = new URL(WEATHER_API_ENDPOINT);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", normalizedPostcode);
  url.searchParams.set("dt", parsedDateTime.date);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.warn("WeatherAPI request failed", error);
    return null;
  }

  if (!response.ok) {
    console.warn(`WeatherAPI returned ${response.status} for ${normalizedPostcode}`);
    return null;
  }

  let data: WeatherApiHistoryResponse;
  try {
    data = (await response.json()) as WeatherApiHistoryResponse;
  } catch (error) {
    console.warn("WeatherAPI JSON parse failed", error);
    return null;
  }

  const forecastDay =
    data.forecast?.forecastday?.find((day) => day.date === parsedDateTime.date) ??
    data.forecast?.forecastday?.[0];
  if (!forecastDay) return null;

  let temperature = findHourlyTemperature(
    forecastDay.hour,
    parsedDateTime.date,
    parsedDateTime.hour
  );

  if (temperature == null) {
    const avg = forecastDay.day?.avgtemp_c;
    if (typeof avg === "number" && Number.isFinite(avg)) {
      temperature = avg;
    }
  }

  const hourlyPrecip = findHourlyPrecip(
    forecastDay.hour,
    parsedDateTime.date,
    parsedDateTime.hour
  );
  const dailyPrecip = forecastDay.day?.totalprecip_mm;
  const conditions =
    normalizePrecipCondition(hourlyPrecip) ??
    normalizePrecipCondition(dailyPrecip) ??
    normalizeCondition(
      findHourlyCondition(forecastDay.hour, parsedDateTime.date, parsedDateTime.hour) ??
        forecastDay.day?.condition?.text
    );

  return {
    temperature: temperature == null ? null : String(Math.round(temperature)),
    conditions,
  };
}

export async function fetchTemperatureForPostcode(
  postcode: string | null | undefined,
  sessionDate: string | null | undefined
): Promise<string | null> {
  const weather = await fetchWeatherForPostcode(postcode, sessionDate);
  return weather?.temperature ?? null;
}

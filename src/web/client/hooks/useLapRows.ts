import { useCallback, useState } from "react";

export type LapFormRow = {
  id: string;
  lapNumber: string;
  time: string;
};

export type LapInputPayload = {
  lapNumber: number;
  time: number;
};

function parseLapTimeInput(time: string): number | null {
  const trimmed = time.trim();
  if (!trimmed) return null;

  const timeParts = trimmed.split(":");
  if (timeParts.length > 2) return null;

  if (timeParts.length === 2) {
    const [minutesPart, secondsPart] = timeParts;
    const minutes = Number(minutesPart);
    const seconds = Number(secondsPart);
    const totalSeconds = minutes * 60 + seconds;
    if (!Number.isFinite(minutes) || minutes < 0) return null;
    if (!Number.isFinite(seconds) || seconds < 0) return null;
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
    return totalSeconds;
  }

  const seconds = Number(trimmed);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds;
}

function buildLapId() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

export function useLapRows() {
  const [laps, setLaps] = useState<LapFormRow[]>([]);

  const addLapRow = useCallback(() => {
    setLaps((current) => {
      const highestLapNumber = current.reduce((max, lap) => {
        const lapNumber = Number(lap.lapNumber);
        if (!Number.isFinite(lapNumber)) return max;
        return Math.max(max, lapNumber);
      }, 0);
      const nextLapNumber = highestLapNumber + 1;
      return [...current, { id: buildLapId(), lapNumber: String(nextLapNumber), time: "" }];
    });
  }, []);

  const updateLapRow = useCallback((id: string, field: "lapNumber" | "time", value: string) => {
    setLaps((current) =>
      current.map((lap) => (lap.id === id ? { ...lap, [field]: value } : lap))
    );
  }, []);

  const removeLapRow = useCallback((id: string) => {
    setLaps((current) => current.filter((lap) => lap.id !== id));
  }, []);

  const buildLapPayload = useCallback((): LapInputPayload[] => {
    if (laps.length === 0) {
      return [];
    }

    const seen = new Set<number>();
    const parsed = laps.map((lap, idx) => {
      const lapNumber = Number(lap.lapNumber);
      if (!Number.isFinite(lapNumber) || lapNumber < 1) {
        throw new Error(`Lap number has to be >= 1 (row ${idx + 1}).`);
      }

      const lapTimeSeconds = parseLapTimeInput(lap.time);
      if (lapTimeSeconds === null) {
        throw new Error(
          `Lap ${lap.lapNumber || idx + 1} needs a time like 75.123 or 1:15.123.`
        );
      }

      if (seen.has(lapNumber)) {
        throw new Error(`Lap ${lapNumber} is duplicated.`);
      }
      seen.add(lapNumber);

      return { lapNumber: Math.round(lapNumber), time: lapTimeSeconds };
    });

    parsed.sort((a, b) => a.lapNumber - b.lapNumber);
    return parsed;
  }, [laps]);

  return {
    laps,
    addLapRow,
    updateLapRow,
    removeLapRow,
    buildLapPayload,
  };
}

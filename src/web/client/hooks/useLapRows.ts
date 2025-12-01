import { useCallback, useState } from "react";
import { formatLapTimeSeconds } from "../utils/lapTime.js";

export type LapFormRow = {
  id: string;
  lapNumber: string;
  time: string;
  events: LapEventFormRow[];
};

export type LapEventFormRow = {
  id: string;
  offset: string;
  event: string;
  value: string;
};

export type LapEventInputPayload = {
  offset: number;
  event: string;
  value: string;
};

export type LapInputPayload = {
  lapNumber: number;
  time: number;
  lapEvents?: LapEventInputPayload[];
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
      return [
        ...current,
        { id: buildLapId(), lapNumber: String(nextLapNumber), time: "", events: [] },
      ];
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

  const addLapEventRow = useCallback((lapId: string) => {
    setLaps((current) =>
      current.map((lap) =>
        lap.id === lapId
          ? {
              ...lap,
              events: [
                ...lap.events,
                { id: buildLapId(), offset: "", event: "position", value: "" },
              ],
            }
          : lap
      )
    );
  }, []);

  const updateLapEventRow = useCallback(
    (lapId: string, eventId: string, field: "offset" | "event" | "value", value: string) => {
      setLaps((current) =>
        current.map((lap) =>
          lap.id === lapId
            ? {
                ...lap,
                events: lap.events.map((event) =>
                  event.id === eventId ? { ...event, [field]: value } : event
                ),
              }
            : lap
        )
      );
    },
    []
  );

  const removeLapEventRow = useCallback((lapId: string, eventId: string) => {
    setLaps((current) =>
      current.map((lap) =>
        lap.id === lapId
          ? { ...lap, events: lap.events.filter((event) => event.id !== eventId) }
          : lap
      )
    );
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

      const lapEvents = parseLapEvents(lap.events, lapNumber, lapTimeSeconds);
      return lapEvents.length > 0
        ? { lapNumber: Math.round(lapNumber), time: lapTimeSeconds, lapEvents }
        : { lapNumber: Math.round(lapNumber), time: lapTimeSeconds };
    });

    parsed.sort((a, b) => a.lapNumber - b.lapNumber);
    return parsed;
  }, [laps]);

  const setLapRowsFromImport = useCallback((imported: LapInputPayload[]) => {
    setLaps(
      imported.map((lap) => ({
        id: buildLapId(),
        lapNumber: String(lap.lapNumber),
        time: formatLapTimeSeconds(lap.time),
        events:
          lap.lapEvents?.map((event) => ({
            id: buildLapId(),
            offset: String(event.offset),
            event: event.event,
            value: event.value,
          })) ?? [],
      }))
    );
  }, []);

  return {
    laps,
    addLapRow,
    updateLapRow,
    removeLapRow,
    addLapEventRow,
    updateLapEventRow,
    removeLapEventRow,
    buildLapPayload,
    setLapRowsFromImport,
  };
}

function parseLapEvents(
  events: LapEventFormRow[],
  lapNumber: number,
  lapTimeSeconds: number
): LapEventInputPayload[] {
  if (events.length === 0) return [];

  const parsed = events.map((event, idx) => {
    if (event.offset.trim() === "") {
      throw new Error(`Lap ${lapNumber} event offset is required (row ${idx + 1}).`);
    }
    const offset = Number(event.offset);
    if (!Number.isFinite(offset) || offset < 0) {
      throw new Error(`Lap ${lapNumber} event offset must be >= 0 (row ${idx + 1}).`);
    }
    if (offset > lapTimeSeconds) {
      throw new Error(
        `Lap ${lapNumber} event offset (${offset}s) cannot exceed lap time (${lapTimeSeconds}s).`
      );
    }
    const eventType = event.event.trim();
    if (!eventType) {
      throw new Error(`Lap ${lapNumber} event needs a type (row ${idx + 1}).`);
    }
    const value = event.value.trim();
    if (!value) {
      throw new Error(`Lap ${lapNumber} event value is required (row ${idx + 1}).`);
    }
    return { offset, event: eventType, value };
  });

  parsed.sort((a, b) => a.offset - b.offset);
  return parsed;
}

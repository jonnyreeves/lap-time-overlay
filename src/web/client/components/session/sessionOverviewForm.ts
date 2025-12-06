export const formatOptions = ["Practice", "Qualifying", "Race"] as const;
export const conditionsOptions = ["Dry", "Wet"] as const;

export type SessionOverviewFormState = {
  circuitId: string;
  format: string;
  date: string;
  time: string;
  conditions: string;
  classification: string;
  notes: string;
};

export function splitDateTime(value: string): { date: string; time: string } {
  if (!value.includes("T")) {
    return { date: value, time: "" };
  }
  const [date, rest] = value.split("T");
  const cleaned = rest.replace(/Z$/, "");
  const [hours, minutes] = cleaned.split(":");
  if (!hours || !minutes) {
    return { date, time: "" };
  }
  return { date, time: `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}` };
}

export function combineDateTime(date: string, time: string) {
  return `${date}T${time}`;
}

export function validateSessionOverviewForm(formValues: SessionOverviewFormState) {
  const trimmedDate = formValues.date.trim();
  const trimmedTime = formValues.time.trim();
  const trimmedNotes = formValues.notes.trim();

  if (!formValues.circuitId) {
    return { error: "Please select a circuit." } as const;
  }

  if (!formatOptions.includes(formValues.format as (typeof formatOptions)[number])) {
    return { error: "Please select a session format." } as const;
  }

  if (!trimmedDate || !trimmedTime) {
    return { error: "Please provide both date and start time." } as const;
  }

  const classification = Number.parseInt(formValues.classification, 10);
  if (!Number.isInteger(classification) || classification < 1) {
    return { error: "Classification must be 1 or higher." } as const;
  }

  return {
    error: null,
    payload: {
      circuitId: formValues.circuitId,
      format: formValues.format,
      date: combineDateTime(trimmedDate, trimmedTime),
      classification,
      conditions: formValues.conditions,
      notes: trimmedNotes,
    },
  } as const;
}

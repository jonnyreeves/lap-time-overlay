import { getSetting, setSetting } from "../../db/settings.js";

const PREFER_HW_KEY = "video.preferHardwareEncoding";

// Default to false to avoid attempting GPU passthrough on hosts that haven't enabled it.
const DEFAULT_PREFER_HARDWARE = false;

export function getPreferHardwareEncoding(): boolean {
  const record = getSetting(PREFER_HW_KEY);
  if (!record) return DEFAULT_PREFER_HARDWARE;
  return record.value === "true";
}

export function setPreferHardwareEncoding(value: boolean): boolean {
  setSetting(PREFER_HW_KEY, value ? "true" : "false");
  return value;
}

export function getPreferHardwareEncodingDefault(): boolean {
  return DEFAULT_PREFER_HARDWARE;
}

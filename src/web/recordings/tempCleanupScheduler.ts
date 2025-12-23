import type { TempCleanupSchedule } from "./tempCleanup.js";
import { getTempCleanupSchedule, runTempCleanupNow, setTempCleanupSchedule } from "./tempCleanup.js";

class TempCleanupScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start(): Promise<TempCleanupSchedule> {
    const schedule = await getTempCleanupSchedule();
    this.scheduleNextRun(schedule);
    return schedule;
  }

  private scheduleNextRun(schedule: TempCleanupSchedule): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!schedule.enabled || !schedule.nextRunAt) {
      return;
    }

    const delay = Math.max(0, schedule.nextRunAt - Date.now());
    this.timer = setTimeout(() => {
      void this.executeScheduledRun();
    }, delay);
  }

  private async executeScheduledRun(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const schedule = await runTempCleanupNow();
      this.scheduleNextRun(schedule);
    } catch (err) {
      console.error("Temp cleanup scheduler failed", err);
      const schedule = await getTempCleanupSchedule();
      this.scheduleNextRun(schedule);
    } finally {
      this.isRunning = false;
    }
  }

  async updateSchedule(input: { hour: number; days: number[] }): Promise<TempCleanupSchedule> {
    const schedule = await setTempCleanupSchedule(input);
    this.scheduleNextRun(schedule);
    return schedule;
  }

  async runNow(): Promise<{ started: boolean; schedule: TempCleanupSchedule }> {
    if (this.isRunning) {
      const schedule = await getTempCleanupSchedule();
      return { started: false, schedule };
    }

    this.isRunning = true;
    try {
      const schedule = await runTempCleanupNow();
      this.scheduleNextRun(schedule);
      return { started: true, schedule };
    } catch (err) {
      console.error("Temp cleanup run failed", err);
      const schedule = await getTempCleanupSchedule();
      this.scheduleNextRun(schedule);
      throw err;
    } finally {
      this.isRunning = false;
    }
  }
}

export const tempCleanupScheduler = new TempCleanupScheduler();

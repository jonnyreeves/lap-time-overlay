import { runMigrations } from "./migrations/runner.js";

await runMigrations();
console.log("Migrations complete.");

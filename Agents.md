# Agents Guide

- Always run `npm run type-check` before handing work back to the user and fix any reported issues.
- Keep changes minimal, aligned with existing style, and explain them succinctly in the final message (reference paths, not file dumps).
- For public UI code, prefer the lit-html helper in `public/template.js` over raw `innerHTML`; keep IDs/classes stable for existing wiring.
- Avoid adding new build steps or heavy deps; stick to the current ESM/browser setup unless asked.
- Never revert or overwrite user changes unless explicitly requested.***

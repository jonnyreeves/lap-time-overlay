import { html, render } from "./template.js";

export function setStatus(statusBodyEl, message, isError = false) {
  render(
    html`
      <p class="status__line ${isError ? "error" : ""}">${message}</p>
    `,
    statusBodyEl
  );
}

export function renderStatus(statusBodyEl, jobId, data) {
  if (data.status === "error") {
    render(
      html`
        <div class="status__line">
          Job #${jobId}: <strong>Failed</strong><br />${data.error ||
          "Unknown error"}
        </div>
      `,
      statusBodyEl
    );
    return;
  }

  if (data.status === "complete") {
    render(
      html`
        <div class="status__line">Job #${jobId}: <strong>Complete</strong></div>
        <div class="status__actions">
          ${data.downloadUrl
            ? html`<a class="status__link" href="${data.downloadUrl}"
                >Download overlay</a
              >`
            : null}
          ${data.outputName
            ? html`<span class="badge">${data.outputName}</span>`
            : null}
        </div>
      `,
      statusBodyEl
    );
    return;
  }

  const progressValue = Number(data.progress);
  const hasProgress = Number.isFinite(progressValue);
  const clampedProgress = hasProgress
    ? Math.min(100, Math.max(0, progressValue))
    : null;
  const progressLabel =
    clampedProgress !== null ? `${clampedProgress.toFixed(1)}% rendered` : null;

  render(
    html`<div class="status__line">
      Job #${jobId}: ${data.status || "queued"}…
    </div>
    ${progressLabel
      ? html`
          <div class="progress">
            <div
              class="progress__bar"
              style="width: ${clampedProgress?.toFixed(1)}%"
            ></div>
            <div class="progress__text">${progressLabel}</div>
          </div>
        `
      : null}`,
    statusBodyEl
  );
}

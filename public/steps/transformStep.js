import { html, render } from "../template.js";
import { renderStatus, setStatus } from "../status.js";

export function renderTransformStep(root) {
  const section = document.createElement("section");
  section.className = "card status step";
  section.id = "stepTransform";
  render(
    html`
      <div class="card__header">
        <div class="dot"></div>
        <div>
          <p class="eyebrow">Step 5</p>
          <h2>Transform &amp; download</h2>
        </div>
      </div>
      <div id="statusBody" class="status__body">
        <p class="muted">No job running yet.</p>
      </div>
      <div class="step-nav">
        <button type="button" class="btn btn--ghost" id="backToLapTimes">
          Back to preview
        </button>
      </div>
    `,
    section
  );
  root.appendChild(section);
}

export function initTransformStep({ els, state, router }) {
  function clearPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  async function startPolling(jobId) {
    clearPolling();
    state.pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
        if (!res.ok) throw new Error("Status error");
        const data = await res.json();
        renderStatus(els.statusBody, jobId, data);
        if (data.status === "complete" || data.status === "error") {
          clearPolling();
        }
      } catch (err) {
        console.error(err);
        setStatus(
          els.statusBody,
          "Lost connection while polling job status.",
          true
        );
        clearPolling();
      }
    }, 1500);
  }

  els.backToLapTimes.addEventListener("click", (event) => {
    event.preventDefault();
    router.goTo("preview");
  });

  return { startPolling, clearPolling };
}

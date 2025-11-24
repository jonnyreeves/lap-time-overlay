export function createRouter({ steps }) {
  const body = document.body;
  const stepNames = Object.keys(steps);
  const defaultStep = steps.upload ? "upload" : stepNames[0] || null;
  let current = defaultStep;

  const readStepFromUrl = () => {
    const url = new URL(window.location.href);
    const urlStep = url.searchParams.get("step");
    if (urlStep && steps[urlStep]) {
      return urlStep;
    }
    return defaultStep;
  };

  const updateHistory = (name, { replaceHistory } = {}) => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", name);
    const method = replaceHistory ? "replaceState" : "pushState";
    window.history[method]({ step: name }, "", url);
  };

  function goTo(name, options = {}) {
    if (!steps[name]) return;
    current = name;
    Object.entries(steps).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle("step--active", key === name);
    });
    body.classList.toggle("hero-compact", name !== "upload");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!options.fromPopState) {
      updateHistory(name, { replaceHistory: options.replaceHistory });
    }
  }

  window.addEventListener("popstate", (event) => {
    const stateStep = event.state?.step;
    const targetStep =
      (stateStep && steps[stateStep] ? stateStep : readStepFromUrl()) ??
      defaultStep;
    if (!targetStep || !steps[targetStep]) return;
    goTo(targetStep, { fromPopState: true });
  });

  return {
    goTo,
    currentStep: () => current,
    getInitialStep: readStepFromUrl,
  };
}

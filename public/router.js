export function createRouter({ steps }) {
  let current = "upload";
  const body = document.body;

  function goTo(name) {
    if (!steps[name]) return;
    current = name;
    Object.entries(steps).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle("step--active", key === name);
    });
    body.classList.toggle("hero-compact", name !== "upload");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    goTo,
    currentStep: () => current,
  };
}

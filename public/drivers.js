function splitCells(line) {
  const tabParts = line.split(/\t+/);
  if (tabParts.length > 1) return tabParts.map((p) => p.trim());
  return line.split(/ {2,}/).map((p) => p.trim());
}

export function extractDrivers(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const header = splitCells(lines[0]);
  return header.slice(1).filter(Boolean);
}

export function populateDrivers(selectEl, drivers) {
  selectEl.innerHTML = '<option value="">Pick a driver</option>';
  drivers.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    selectEl.appendChild(opt);
  });
}

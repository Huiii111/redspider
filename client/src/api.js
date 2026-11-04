// All fetch calls live here.
export const getHealth = () => fetch('/api/health').then((r) => r.json());
export const getBenchmark = () => fetch('/api/benchmark').then((r) => r.json());
export const getCase = (id) => fetch(`/api/cases/${id}`).then((r) => r.json());
export const scan = (before, after) =>
  fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ before, after }),
  }).then((r) => r.json());

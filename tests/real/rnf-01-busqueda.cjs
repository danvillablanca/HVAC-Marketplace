// RNF-01: la búsqueda de proveedores responde en ≤ 2 s (p95).
// Requiere el backend con DEMO_MODE=false contra Supabase local (ver README.md).
// Uso: API_URL=http://localhost:3101 N=50 node tests/real/rnf-01-busqueda.cjs

const API = process.env.API_URL ?? "http://localhost:3101";
const N = Number(process.env.N ?? 50);
const LIMIT_MS = 2000;

// Comunas de Santiago con combinaciones de filtros (BUS-01..03).
const CASES = [
  { lat: -33.4372, lng: -70.6506 }, // Santiago centro
  { lat: -33.4255, lng: -70.6143, radiusKm: 5 }, // Providencia
  { lat: -33.4103, lng: -70.5674, minRating: 4.5, sort: "rating" }, // Las Condes
  { lat: -33.4569, lng: -70.5978, onlyAvailable: true }, // Ñuñoa
  { lat: -33.5167, lng: -70.7667, radiusKm: 25 }, // Maipú
  { lat: -33.4372, lng: -70.6506, query: "mantención", page: 2 },
];

function pct(sorted, p) {
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[i];
}

(async () => {
  // Calentamiento: la primera llamada compila la ruta en `next dev`.
  await fetch(`${API}/api/providers/search?lat=-33.4372&lng=-70.6506`);

  const times = [];
  let errors = 0;
  let results = 0;
  for (let i = 0; i < N; i++) {
    const params = new URLSearchParams(
      Object.entries(CASES[i % CASES.length]).map(([k, v]) => [k, String(v)]),
    );
    const t0 = performance.now();
    const res = await fetch(`${API}/api/providers/search?${params}`);
    const body = await res.json().catch(() => null);
    times.push(performance.now() - t0);
    if (!res.ok) errors++;
    else results += body?.data?.items?.length ?? 0;
  }

  times.sort((a, b) => a - b);
  const summary = {
    fecha: new Date().toISOString(),
    api: API,
    solicitudes: N,
    errores: errors,
    resultadosTotales: results,
    minMs: Math.round(times[0]),
    p50Ms: Math.round(pct(times, 50)),
    p95Ms: Math.round(pct(times, 95)),
    maxMs: Math.round(times[times.length - 1]),
    limiteMs: LIMIT_MS,
  };
  summary.resultado = errors === 0 && summary.p95Ms <= LIMIT_MS ? "OK" : "NO CUMPLE";
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.resultado === "OK" ? 0 : 1);
})();

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1>Marketplace HVAC API</h1>
      <p>Backend Next.js (solo API) del Marketplace HVAC.</p>
      <h2>Endpoints disponibles</h2>
      <ul>
        <li>
          <code>GET /api/health</code>
        </li>
        <li>
          <code>GET /api/providers</code>
        </li>
        <li>
          <code>GET /api/providers/search</code>
        </li>
        <li>
          <code>GET /api/providers/:id</code>
        </li>
        <li>
          <code>GET /api/providers/:id/reviews</code>
        </li>
        <li>
          <code>POST /api/reviews</code>
        </li>
        <li>
          <code>GET|POST /api/leads</code>
        </li>
        <li>
          <code>PATCH /api/leads/:id</code>
        </li>
        <li>
          <code>POST /api/appointments</code>
        </li>
        <li>
          <code>PATCH /api/appointments/:id</code>
        </li>
        <li>
          <code>GET|PATCH /api/admin/verifications</code>
        </li>
        <li>
          <code>POST /api/ai/chat</code>
        </li>
      </ul>
    </main>
  );
}

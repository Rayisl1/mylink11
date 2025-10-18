// app/api/sheets/route.js
export const runtime = "edge";

const SHEETS_URL = "https://script.google.com/macros/s/AKfycbyEFOT9QWbrsmiFjBbs30rz5ZtoxNA7tDRYet7pJeNn56kzgV9vlkq_pOCK21eF6Gnj/exec";

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const r = await fetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok) return json(r.status, { ok: false, error: data?.error || text });
    return json(200, { ok: true, data });
  } catch (e) {
    return json(500, { ok: false, error: e?.message || String(e) });
  }
}

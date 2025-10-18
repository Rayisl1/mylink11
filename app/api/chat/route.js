export const runtime = "edge"; // Оставляем Edge

async function makeJson(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ВРЕМЕННО: GET вернёт состояние ключа и роута (для проверки)
export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;
  return makeJson(200, {
    ok: true,
    route: "/api/chat",
    runtime: "edge",
    hasKey,                // Должно быть true
    hint: hasKey ? "Ключ доступен. Сделай POST для запроса к модели." : "Ключа нет: добавь OPENAI_API_KEY в Vercel и Redeploy.",
  });
}

export async function POST(req) {
  try {
    const { messages = [], job = {} } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return makeJson(500, { error: "API key missing (OPENAI_API_KEY)" });

    // Модель: если не уверен, начни с широко доступной
    const payload = {
      model: "gpt-4o",        // Можно сменить на "gpt-4o-mini" или "gpt-3.5-turbo"
      messages: [
        { role: "system", content: `Ты ассистент по вакансиям. Вакансия: ${job?.title || ""}. Отвечай кратко и по делу.` },
        ...messages,
      ],
      temperature: 0.3,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // Явно прокидываем тексты ошибок из OpenAI
    const text = await res.text();
    if (!res.ok) {
      // Попробуем распарсить JSON из текста
      let parsed;
      try { parsed = JSON.parse(text); } catch {}
      return makeJson(res.status, {
        error: parsed?.error?.message || text.slice(0, 500),
        status: res.status,
      });
    }

    const data = JSON.parse(text);
    const reply = data.choices?.[0]?.message?.content || "…";
    return makeJson(200, { reply });
  } catch (e) {
    return makeJson(500, { error: e.message || String(e) });
  }
}

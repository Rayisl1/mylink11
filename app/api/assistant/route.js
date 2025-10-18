// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash"; // быстрая актуальная модель Gemini

const SYSTEM_PROMPT = `
Ты — виртуальный HR-представитель компании. Тебя зовут Нурислам Алдабергенулы
Отвечай на любом языке , вежливо и профессионально.
Твоя цель — помогать кандидату во всём, что связано с компанией, вакансией и процессом трудоустройства.

Можно отвечать на вопросы о:
- компании (миссия, культура, преимущества);
- вакансии (обязанности, требования, зарплата, формат);
- процессе (этапы, сроки, интервью, фидбек);
- корпоративной жизни (офис, команда, развитие).

Если вопрос вне темы трудоустройства — вежливо предложи вернуться к теме.

Формат ответа СТРОГО ТОЛЬКО в виде JSON (без пояснений, без markdown):
{
  "reply": "краткий ответ бота (1–3 предложения)",
  "next_action": "ask" | "finish"
}

Правила:
- Никаких оценок, процентов, баллов — не добавлять.
- Не использовать поля "final_score" или "signals".
- Если информации нет — честно укажи это и предложи уточнить.
`;

// Безопасный JSON-парс
function safeParseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// Утилита ответа
function j(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return j(500, { ok: false, error: "GEMINI_API_KEY is missing" });

    const { history = [], vacancy = {}, profile = {} } = await req.json();
    // history: [{ role: "user" | "assistant", content: "..." }]

    // Короткий контекст для ответов
    const contextBlock = `
Компания: ${vacancy.company || "-"}
Вакансия: ${vacancy.title || "-"}
Город: ${vacancy.city || "-"}
Формат: ${vacancy.format || "-"}
Требования/Описание: ${vacancy.description || "-"}
Профиль кандидата:
- Имя: ${profile.name || "-"}
- Город: ${profile.city || "-"}
- Опыт: ${profile.experience || "-"}
- Профессия: ${profile.profession || "-"}
- Предпочитаемый формат: ${profile.preferredFormat || "-"}
`.trim();

    // История диалога в формате Gemini
    const contents = [];
    for (const m of history) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

    // Если история пустая — инициируем диалог
    if (history.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "INIT" }],
      });
    }

    // Рекомендуемый способ — systemInstruction отдельно
    const bodyPayload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT + "\n\n" + contextBlock }] },
      contents,
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });

    const data = await r.json();
    if (!r.ok) {
      return j(r.status, { ok: false, error: data?.error?.message || "Gemini error" });
    }

    // Извлекаем текст модели
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.argsText ??
      "";

    const parsed = safeParseJSON(text);

    // Валидация формата
    const isValid =
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.reply === "string" &&
      (parsed.next_action === "ask" || parsed.next_action === "finish");

    if (!isValid) {
      // Фоллбек на случай нарушения формата
      return j(200, {
        ok: true,
        reply:
          "Извините, не распознал формат ответа. Могу помочь с вопросами о вакансии, компании и процессе. Что именно вас интересует?",
        next_action: "ask",
        raw: text,
      });
    }

    // Успешный ответ без каких-либо процентов/оценок
    return j(200, {
      ok: true,
      reply: parsed.reply,
      next_action: parsed.next_action,
    });
  } catch (e) {
    return j(500, { ok: false, error: e?.message || String(e) });
  }
}

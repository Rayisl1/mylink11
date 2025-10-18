// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash"; // быстро и дешево; можно заменить на gemini-1.5-pro

const SYSTEM_PROMPT = `
Ты — HR-менеджер. Веди скрининг кандидата по-русски, дружелюбно и профессионально.
Всегда задавай ОДИН уточняющий вопрос за раз. Не пиши длинных простыней.

У тебя есть контекст вакансии (город, опыт, формат работы) и профиль кандидата (если передан).
Цель: быстро выяснить — совпадают ли ключевые условия:
- город (или готовность релокации/удалёнка),
- опыт (минимальные требования по годам/уровню),
- формат работы (офис/гибрид/полный день/удалёнка).

Всегда отвечай строго в формате JSON (без пояснений, без markdown):

{
  "reply": "фраза бота пользователю",
  "signals": {
    "city": "да|нет|неизвестно",
    "exp": "да|нет|неизвестно",
    "format": "да|нет|неизвестно"
  },
  "final_score": null или число от 0 до 100,
  "next_action": "ask" | "finish"
}

Правила для score:
- старт 100;
- если city = "нет" → -30;
- если exp = "нет" → -40;
- если format = "нет" → -30;
- "неизвестно" не штрафует;
- итог ограничь от 0 до 100.
Ставь "final_score" ТОЛЬКО когда, по твоему мнению, информации достаёт для финальной оценки и next_action="finish".
Иначе final_score=null и next_action="ask".

Обращайся кратко, вежливо. Если контекст вакансии русскоязычный — общайся по-русски.
`;

// Вспомогалка: безопасный JSON парс из вывода модели
function safeParseJSON(t) {
  try { return JSON.parse(t); } catch { return null; }
}

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
    // history: [{role:"user"|"assistant", content:"..."}]

    // Сшиваем промпт: сначала system, затем краткий контекст, потом история
    const contextBlock = `
Вакансия:
- Город: ${vacancy.city || "-"}
- Опыт: ${vacancy.exp || "-"}
- Формат: ${vacancy.format || "-"}
- Должность: ${vacancy.title || "-"}

Профиль кандидата (если есть):
- Имя: ${profile.name || "-"}
- Город: ${profile.city || "-"}
- Опыт: ${profile.experience || "-"}
- Профессия: ${profile.profession || "-"}
- Формат предпочтительный: ${profile.preferredFormat || "-"}
`;

    // Формируем parts по правилам Gemini REST
    const contents = [];

    // "системный" стиль — кладём в начало содержимым от ассистента
    contents.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT + "\n\n" + contextBlock }],
    });

    // добавляем историю
    for (const m of history) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

    // Если история пустая, инициируем первый вопрос
    if (history.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "INIT" }],
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.6,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return j(r.status, { ok: false, error: data?.error?.message || "Gemini error" });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = safeParseJSON(text);

    if (!parsed || typeof parsed.reply !== "string") {
      // fallback — если модель нарушила формат
      return j(200, {
        ok: true,
        reply: "Извините, возникла ошибка формата ответа. Давайте ещё раз: подтвердите город, опыт и формат работы.",
        signals: { city: "неизвестно", exp: "неизвестно", format: "неизвестно" },
        final_score: null,
        next_action: "ask",
        raw: text,
      });
    }

    return j(200, {
      ok: true,
      reply: parsed.reply,
      signals: parsed.signals || { city: "неизвестно", exp: "неизвестно", format: "неизвестно" },
      final_score: parsed.final_score ?? null,
      next_action: parsed.next_action || "ask",
    });
  } catch (e) {
    return j(500, { ok: false, error: e?.message || String(e) });
  }
}

// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash"; // актуальная быстрая модель Gemini

const SYSTEM_PROMPT = `
Ты — виртуальный HR-представитель компании.
Говори вежливо и профессионально. Отвечай кратко (1–3 предложения). Всегда задавай ОДИН уточняющий вопрос за раз.
Никаких процентов, оценок, баллов — не используй.

ЦЕЛИ:
1) В самом начале диалога:
   - КРАТКО представь компанию (если есть данные): название, сфера/продукт, ключевое преимущество (1–2 предложения, без маркетингового перегруза и без выдумывания фактов).
   - Затем СРАЗУ задай один вопрос: предложи выбрать удобный язык общения.
     Формулируй приглашение трёхъязычно, чтобы кандидат понял сразу:
     "Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English".
   - После выбора языка продолжай весь диалог на выбранном языке.
   - Если кандидат сам пишет на одном из языков (kk/ru/en), автоматически переключись на него.

2) В ходе диалога:
   - Помогай с вопросами о компании, вакансии, задачах, процессе найма.
   - Собери ключевую информацию о кандидате (по одному вопросу за раз):
     • уровень владения английским,
     • желаемая зарплата,
     • образование (уровень, специальность, вуз),
     • город/релокация,
     • опыт и формат работы (офис/гибрид/удалёнка).
   - Если информации нет — скажи об этом нейтрально и не выдумывай.

ФОРМАТ ОТВЕТА СТРОГО ТОЛЬКО JSON (без markdown и пояснений):
{
  "reply": "фраза бота пользователю (на выбранном языке, коротко)",
  "next_action": "ask" | "finish"
}

ПРАВИЛА:
- Не используй поля "final_score" или "signals".
- Если язык ещё не выбран — первый ответ всегда содержит мини-презентацию компании + вопрос выбора языка.
- После выбора языка соблюдай стиль и краткость, задавай ровно один уточняющий вопрос.
`;

function safeParseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
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
    // history: [{ role: "user" | "assistant", content: "..." }]

    // Краткий контекст, который модель использует для мини-презентации компании и ответов
    const contextBlock = `
Компания: ${vacancy.company || "-"}
Сфера/продукт: ${vacancy.industry || vacancy.product || "-"}
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
- Английский: ${profile.english || "-"}
- Образование: ${profile.education || "-"}
- Желаемая зарплата: ${profile.salary || "-"}
`.trim();

    // История диалога для Gemini
    const contents = [];
    for (const m of history) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

    // Если истории нет — инициируем старт: модель должна представить компанию и спросить язык
    if (history.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "INIT" }],
      });
    }

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

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.argsText ??
      "";

    const parsed = safeParseJSON(text);

    const isValid =
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.reply === "string" &&
      (parsed.next_action === "ask" || parsed.next_action === "finish");

    if (!isValid) {
      // Фоллбек: короткое многоязычное приглашение выбрать язык + напоминание о компании
      const companyName = vacancy.company || "Компания";
      const role = vacancy.title ? `: ${vacancy.title}` : "";
      return j(200, {
        ok: true,
        reply:
          `${companyName}${role}. Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English.`,
        next_action: "ask",
        raw: text,
      });
    }

    return j(200, {
      ok: true,
      reply: parsed.reply,
      next_action: parsed.next_action,
    });
  } catch (e) {
    return j(500, { ok: false, error: e?.message || String(e) });
  }
}

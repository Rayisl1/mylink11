// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash"; // быстрая модель Gemini

// ──────────────────────────────────────────────
// Простая in-memory память (для MVP)
// В продакшене можно заменить на Vercel KV / Supabase
const mem = new Map();

/** @typedef {{
 *  language?: "Русский"|"Қазақша"|"English",
 *  city?: string,
 *  relocation?: string,
 *  format?: string,
 *  availability?: string,
 *  experience?: string,
 *  hard_skills?: string,
 *  english?: string,
 *  education?: string,
 *  salary?: string,
 *  motivation?: string,
 *  company_questions?: string,
 *  available_from?: string
 * }} Memory
 */

function getMemory(id) {
  return mem.get(id) || {};
}
function patchMemory(id, patch) {
  const cur = mem.get(id) || {};
  const next = { ...cur, ...patch };
  mem.set(id, next);
  return next;
}
// ──────────────────────────────────────────────

const SYSTEM_PROMPT = `
Ты — виртуальный HR по вакансии {{vacancy_title}}.
Отвечай коротко (1–3 предложения). Один ответ → один уточняющий вопрос. Факты не выдумывай.

Старт:
— Если язык ещё не выбран: представься и СРАЗУ спроси язык трёхъязычно:
  "Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English".
— Если пользователь пишет на kk/ru/en — продолжай на этом языке и НЕ спрашивай язык снова.

После выбора языка (один раз!):
— Коротко представь компанию (1–2 предложения) и сразу задай первый вопрос.

Интервью (по одному вопросу за раз):
— A) Локация/формат/график/дата выхода;
— B) Опыт и ключевые навыки;
— C) Английский;
— D) Образование/сертификаты;
— E) Зарплатные ожидания;
— F) Мотивация/поведенческие вопросы;
— G) Вопросы кандидата.

Завершение:
— Поблагодари и скажи, что дадим обратную связь в ближайшие дни.

Обязательный формат ответа — СТРОГИЙ JSON:
{
  "reply": "короткий ответ на выбранном языке",
  "next_action": "ask" | "finish",
  "memory_patch": null | {
    "language"?: "Русский" | "Қазақша" | "English",
    "city"?: string,
    "relocation"?: string,
    "format"?: string,
    "availability"?: string,
    "experience"?: string,
    "hard_skills"?: string,
    "english"?: string,
    "education"?: string,
    "salary"?: string,
    "motivation"?: string,
    "company_questions"?: string,
    "available_from"?: string
  },

  // ↓ ЭТИ ПОЛЯ НУЖНЫ ДЛЯ СМАРТ-ОЦЕНКИ
  "signals": {
    "city"?: string,
    "exp"?: string,
    "format"?: string
  },
  "final_score": null | number,   // 0..100 — итоговая релевантность
  "gaps": null | string           // кратко: что ещё не хватает (если score < 100)
}

Когда собрал ключевые данные — ставь "next_action":"finish" и рассчитай "final_score".
При расчёте учитывай (примерная шкала):
- опыт vs требование вакансии (до 40%),
- совпадение формата/графика (до 20%),
- совпадение города/релокации (до 20%),
- профильные навыки (до 20%).
Оцени честно. Если итог ≥ 80, обязательно объясни в "gaps", почему не хватает оставшихся (100 - score)% (2–3 коротких причины).
`.trim();


function safeParseJSON(t) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
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
    if (!apiKey)
      return j(500, { ok: false, error: "GEMINI_API_KEY is missing" });

    const {
      history = [],
      vacancy = {},
      profile = {},
      conversationId = "default",
    } = await req.json();

    const memory = getMemory(conversationId);

    const contextBlock = `
Компания: ${vacancy.company || "-"}
Сфера/продукт: ${vacancy.industry || vacancy.product || "-"}
Вакансия: ${vacancy.title || "-"}
Описание: ${vacancy.description || "-"}
Город: ${memory.city || profile.city || "-"}
Формат: ${memory.format || profile.preferredFormat || "-"}
Английский: ${memory.english || profile.english || "-"}
Образование: ${memory.education || profile.education || "-"}
Зарплата: ${memory.salary || profile.salary || "-"}
Выбранный язык: ${memory.language || "-"}
`.trim();

    const contents = [];
    for (const m of history) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

    // Если диалог новый и язык не выбран — инициализация
    if (history.length === 0 && !memory.language) {
      contents.push({ role: "user", parts: [{ text: "INIT" }] });
    }

    const system = SYSTEM_PROMPT
      .replaceAll("{{company_name}}", vacancy.company || "Компания")
      .replaceAll("{{vacancy_title}}", vacancy.title || "Вакансия");

    const bodyPayload = {
      systemInstruction: { parts: [{ text: system + "\n\n" + contextBlock }] },
      contents,
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 700,
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
      return j(r.status, {
        ok: false,
        error: data?.error?.message || "Gemini error",
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.argsText ??
      "";
    const parsed = safeParseJSON(text);

    const isValid =
      parsed &&
      typeof parsed.reply === "string" &&
      (parsed.next_action === "ask" || parsed.next_action === "finish");

    if (!isValid) {
      const companyName = vacancy.company || "Компания";
      const role = vacancy.title ? `: ${vacancy.title}` : "";
      return j(200, {
        ok: true,
        reply: `${companyName}${role}. Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English.`,
        next_action: "ask",
        raw: text,
      });
    }

   // ... parsed уже валиден
if (parsed.memory_patch && typeof parsed.memory_patch === "object") {
  patchMemory(conversationId, parsed.memory_patch);
} else if (!memory.language) {
  const rep = parsed.reply || "";
  if (/Қазақша/i.test(rep)) patchMemory(conversationId, { language: "Қазақша" });
  else if (/English/i.test(rep)) patchMemory(conversationId, { language: "English" });
  else if (/[А-Яа-яЁё]/.test(rep)) patchMemory(conversationId, { language: "Русский" });
}

return j(200, {
  ok: true,
  reply: parsed.reply,
  next_action: parsed.next_action,
  // ↓ Новые поля для фронта
  signals: parsed.signals || null,
  final_score: typeof parsed.final_score === "number" ? parsed.final_score : null,
  gaps: parsed.gaps || null
});
  } catch (e) {
    return j(500, { ok: false, error: e?.message || String(e) });
  }
}
//123
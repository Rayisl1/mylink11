// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash";

// ──────────────────────────────────────────────
// Простейшая “память” на время жизни edge-воркера.
// В проде лучше Vercel KV / Upstash / Supabase.
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
Ты — виртуальный HR-менеджер компании по вакансии {{vacancy_title}}.
Общайся вежливо и структурированно. Отвечай кратко (1–3 предложения), задавай ровно ОДИН уточняющий вопрос за раз. Факты не выдумывай.

Старт диалога:
— Если язык ещё НЕ выбран: представься одной фразой и СРАЗУ спроси язык трёхъязычно:
  "Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English".
— Если кандидат пишет на kk/ru/en — автоматически продолжай на этом языке и НЕ спрашивай язык повторно.

После выбора языка (один раз!):
— Кратко представь компанию (1–2 предложения).
— Затем задай первый уточняющий вопрос.

Интервью (после представления компании):
— Принцип "один ответ → один уточняющий вопрос".
— Собери блоки: локация/формат; опыт/навыки; английский; образование; зарплата; мотивация; вопросы кандидата.

Завершение (когда всё собрано):
— Поблагодари и пообещай обратную связь. Без оценочных процентов.

Формат ответа СТРОГО JSON:
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
  }
}
`;

function safeParseJSON(t) {
  try { return JSON.parse(t); } catch { return null; }
}
function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return json(500, { ok: false, error: "GEMINI_API_KEY is missing" });

    const body = await req.json();
    const {
      history = [],
      vacancy = {},
      profile = {},
      conversationId = "default",
    } = body || {};

    // Если фронт уже знает язык — зафиксируем в памяти (один раз)
    if (profile?.language && !getMemory(conversationId)?.language) {
      patchMemory(conversationId, { language: profile.language });
    }

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
Выбранный язык: ${memory.language || profile.language || "-"}
`.trim();

    const contents = [];
    for (const m of history) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

    // Чтобы не было "contents is not specified":
    if (contents.length === 0 && !memory.language) {
      contents.push({ role: "user", parts: [{ text: "INIT" }] });
    } else if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Продолжим." }] });
    }

    const system = SYSTEM_PROMPT
      .replaceAll("{{company_name}}", vacancy.company || "Компания")
      .replaceAll("{{vacancy_title}}", vacancy.title || "Вакансия");

    const payload = {
      systemInstruction: { parts: [{ text: system + "\n\n" + contextBlock }] },
      contents,
      generationConfig: {
        temperature: 0.6, topK: 40, topP: 0.9,
        maxOutputTokens: 700,
        responseMimeType: "application/json",
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) {
      return json(r.status, { ok: false, error: data?.error?.message || "Gemini error" });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.argsText ?? "";

    const parsed = safeParseJSON(text);
    const isValid = parsed && typeof parsed.reply === "string" &&
      (parsed.next_action === "ask" || parsed.next_action === "finish");

    if (!isValid) {
      const companyName = vacancy.company || "Компания";
      const role = vacancy.title ? ` — ${vacancy.title}` : "";
      const hasLang = getMemory(conversationId)?.language || profile.language || "";

      const fallbackReply = hasLang
        ? "Продолжим. Ответьте, пожалуйста, на последний вопрос."
        : `${companyName}${role}. Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English.`;

      return json(200, { ok: true, reply: fallbackReply, next_action: "ask", raw: text });
    }

    // Применяем патч памяти
    if (parsed.memory_patch && typeof parsed.memory_patch === "object") {
      patchMemory(conversationId, parsed.memory_patch);
    } else {
      const rep = parsed.reply || "";
      if (!memory.language) {
        if (/Қазақша/i.test(rep)) patchMemory(conversationId, { language: "Қазақша" });
        else if (/English/i.test(rep)) patchMemory(conversationId, { language: "English" });
        else if (/[А-Яа-яЁё]/.test(rep)) patchMemory(conversationId, { language: "Русский" });
      }
    }

    const memAfter = getMemory(conversationId);

    return json(200, {
      ok: true,
      reply: parsed.reply,
      next_action: parsed.next_action,
      memory_patch: parsed.memory_patch || (memAfter.language ? { language: memAfter.language } : undefined),
    });
  } catch (e) {
    return json(500, { ok: false, error: e?.message || String(e) });
  }
}

// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash"; // быстрая модель Gemini

// ──────────────────────────────────────────────
// Простая in-memory память (для MVP).
// В продакшене замените на Vercel KV / Supabase / DB.
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
Общайся вежливо, дружелюбно и поддерживающе, но сохраняй академический стиль и деловую структуру.
Отвечай кратко (1–3 предложения), задавай ровно ОДИН уточняющий вопрос за раз. Факты не выдумывай.

Старт диалога:
— Если язык ещё НЕ выбран: представься одной фразой и СРАЗУ спроси язык трёхъязычно:
  «Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English».
— Если кандидат пишет на kk/ru/en — автоматически продолжай на этом языке и НЕ спрашивай язык повторно.

После выбора языка (один раз!):
— Кратко представь компанию (1–2 предложения: сфера/продукт/миссия — только известные факты).
— Затем задай первый уточняющий вопрос (начни интервью).

Интервью (после представления компании):
— Принцип «один ответ → один уточняющий вопрос».
— Собери базовые блоки:
  A) Локация и формат (город, готовность к релокации/удалёнке, формат, график, дата выхода);
  B) Опыт и навыки;
  C) Английский язык (уровень, использование);
  D) Образование и сертификаты;
  E) Зарплатные ожидания;
  F) Психологические/поведенческие вопросы (по STAR);
  G) Мотивация к компании и к роли;
  H) Вопросы кандидата.

Завершение (когда всё собрано):
— Благодари за беседу, укажи, что заявка будет рассмотрена, и пообещай обратную связь в ближайшие дни.
— Без процентов и оценок.

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

Если язык уже выбран — НЕ задавай вопрос про язык повторно.
Если из ответа кандидата извлечены новые данные, верни их в memory_patch.
После выбора языка сразу сгенерируй краткое описание компании и первый вопрос.
`;

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

    const {
      history = [],
      vacancy = {},
      profile = {},
      conversationId = "default",
    } = await req.json();

    const memory = getMemory(conversationId);

    // Контекст (без синтаксических ошибок)
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

    // Сборка contents. Фильтруем пустые строки и ГАРАНТИРУЕМ не-пустоту.
    const contents = [];
    for (const m of history) {
      const text = (m?.content ?? "").toString().trim();
      if (!text) continue;
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text }],
      });
    }
    if (contents.length === 0) {
      // Первый заход или пустые сообщения — кладём INIT.
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

    // Фолбэк: если модель не вернула JSON в нужном формате — показываем выбор языка.
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

    // Обновляем память, если пришёл memory_patch
    if (parsed.memory_patch && typeof parsed.memory_patch === "object") {
      patchMemory(conversationId, parsed.memory_patch);
    } else {
      // Если язык ещё не выбран, пытаемся определить по реплике
      const rep = parsed.reply || "";
      if (!memory.language) {
        if (/Қазақша/i.test(rep)) patchMemory(conversationId, { language: "Қазақша" });
        else if (/English/i.test(rep)) patchMemory(conversationId, { language: "English" });
        else if (/[А-Яа-яЁё]/.test(rep)) patchMemory(conversationId, { language: "Русский" });
      }
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

// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash"; // быстрая модель Gemini

// ──────────────────────────────────────────────
// Простая in-memory память (для MVP).
const mem = new Map();

/** @typedef {Object} Memory
 * @property {"Русский"|"Қазақша"|"English"} [language]
 * @property {string} [city]
 * @property {string} [relocation]
 * @property {string} [format]
 * @property {string} [availability]
 * @property {string} [experience]
 * @property {string} [hard_skills]
 * @property {string} [english]
 * @property {string} [education]
 * @property {string} [salary]
 * @property {string} [motivation]
 * @property {string} [company_questions]
 * @property {string} [available_from]
 */

function getMemory(id) { return mem.get(id) || {}; }
function patchMemory(id, patch) {
  const cur = mem.get(id) || {};
  const next = { ...cur, ...patch };
  mem.set(id, next);
  return next;
}
// ──────────────────────────────────────────────

// ========== NEW: утилиты скоринга (похожи на фронт) ==========
function parseYears(text){ if(!text) return 0; const m=String(text).match(/(\d+(\.\d+)?)/); return m?Number(m[1]):0; }

function scoreKeywordMatch(profession, jobTitle){
  const jt=(jobTitle||"").toLowerCase();
  const pf=(profession||"").toLowerCase();
  if(!jt || !pf) return 0;
  let s=0;
  if(pf.includes(jt)||jt.includes(pf)) s+=40;
  const keywords=jt.split(/\W+/).filter(Boolean);
  let matches=0; for(const k of keywords) if(pf.includes(k)) matches++;
  s+=Math.min(30, matches*6);
  return s;
}

function inferRequiredYears(jobExp){
  if(!jobExp) return 0;
  const m=String(jobExp).match(/(\d+)/);
  if(m) return Number(m[1]);
  if(/senior/i.test(jobExp)) return 5;
  if(/middle\+?/i.test(jobExp)) return 3;
  if(/middle/i.test(jobExp)) return 2;
  if(/junior/i.test(jobExp)) return 0.5;
  return 0;
}

function computeAutoScoreServer({memory, vacancy, profile}) {
  let score = 50;

  // Город
  if (memory.city && vacancy.city && memory.city.toLowerCase() === String(vacancy.city).toLowerCase()) {
    score += 15;
  }

  // Ключевые слова (профессия vs название вакансии)
  const profession = profile?.profession || memory?.profession || memory?.hard_skills || "";
  score += scoreKeywordMatch(profession, vacancy.title);

  // Опыт
  const candYears = parseYears(memory.experience);
  const requiredYears = inferRequiredYears(vacancy.exp);
  if (requiredYears > 0) {
    if (candYears >= requiredYears) score += 15;
    else score -= Math.min(20, (requiredYears - candYears) * 6);
  }

  // Формат
  if (memory.format && vacancy.format && memory.format.toLowerCase().includes(String(vacancy.format).toLowerCase())) {
    score += 5;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

function explainGapServer({memory, vacancy, score}) {
  const issues = [];
  if (memory.city && vacancy.city && memory.city.toLowerCase() !== String(vacancy.city).toLowerCase()) {
    issues.push("Город отличается");
  }
  const candYears = parseYears(memory.experience);
  const req = inferRequiredYears(vacancy.exp);
  if (req && candYears < req) {
    issues.push(`Опыт ниже требований (${candYears} < ${req} лет)`);
  }
  const jt=(vacancy.title||"").toLowerCase();
  const pf=(memory.hard_skills||"").toLowerCase();
  if (jt && pf && !(pf.includes(jt)||jt.includes(pf))) {
    issues.push("Профиль по ключевым словам не совпадает с вакансией");
  }
  return issues.length ? "Почему не 100%: " + issues.join("; ") + "." : "";
}
// ========== /NEW ==========

const SYSTEM_PROMPT = `
Ты — виртуальный HR-менеджер компании по вакансии {{vacancy_title}}.
Общайся вежливо, дружелюбно и поддерживающе, но сохраняй академический стиль и деловую структуру.
Отвечай кратко (1–3 предложения), задавай ровно ОДИН уточняющий вопрос за раз. Факты не выдумывай.

Старт диалога:
— Если язык ещё НЕ выбран: представься одной фразой и СРАЗУ спроси язык трёхъязычно:
  «Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English».
— Если кандидат пишет на kk/ru/en — автоматически продолжай на этом языке и НЕ спрашивай язык повторно.

После выбора языка (один раз!):
— Кратко представь компанию (1–2 предложения: сфера/продукт/миссия — только известные факты если нету известных фактов, то расскажи что нибудь связанной с профессии.
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

    // Сборка contents
    const contents = [];
    for (const m of history) {
      const text = (m?.content ?? "").toString().trim();
      if (!text) continue;
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text }],
      });
    }
    if (contents.length === 0) contents.push({ role: "user", parts: [{ text: "INIT" }] });

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
      return j(r.status, { ok: false, error: data?.error?.message || "Gemini error" });
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

    // Обновляем память
    if (parsed.memory_patch && typeof parsed.memory_patch === "object") {
      patchMemory(conversationId, parsed.memory_patch);
    } else {
      // Эвристика языка
      const rep = parsed.reply || "";
      if (!memory.language) {
        if (/Қазақша/i.test(rep)) patchMemory(conversationId, { language: "Қазақша" });
        else if (/English/i.test(rep)) patchMemory(conversationId, { language: "English" });
        else if (/[А-Яа-яЁё]/.test(rep)) patchMemory(conversationId, { language: "Русский" });
      }
    }

    // NEW: формируем signals из актуальной памяти
const memNow = getMemory(conversationId);
const signals = {
  city: memNow.city || "-",
  exp: memNow.experience || "-",
  format: memNow.format || "-",
};

// Считаем итог и объяснение только если модель завершила интервью
let finalScore = null;
let gaps = null;

if (parsed.next_action === "finish") {
  finalScore = computeAutoScoreServer({ memory: memNow, vacancy, profile });
  gaps = explainGapServer({ memory: memNow, vacancy, score: finalScore });
}

return j(200, {
  ok: true,
  reply: parsed.reply,
  next_action: parsed.next_action,
  signals,
  ...(finalScore !== null ? { final_score: finalScore } : {}),
  ...(gaps ? { gaps } : {}),
});

  } catch (e) {
    return j(500, { ok: false, error: e?.message || String(e) });
  }
}

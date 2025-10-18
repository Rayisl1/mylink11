// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash"; // актуальная быстрая модель Gemini

// ──────────────────────────────────────────────────────────────────────────────
// ПРОСТЕЙШАЯ ПАМЯТЬ (демо). Для продакшена замени на Vercel KV / Supabase / etc.
// key: conversationId -> Memory
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
// ──────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
Ты — виртуальный HR-менеджер компании {{company_name}} по вакансии {{vacancy_title}}.
Общайся вежливо, дружелюбно и поддерживающе, но сохраняй академический стиль и деловую структуру.
Отвечай кратко (1–3 предложения), задавай ровно ОДИН уточняющий вопрос за раз. Факты не выдумывай.

Цели и рамки:
1) Отвечай на любые вопросы кандидата о компании, вакансии, задачах, условиях, процессе найма и культуре.
2) Если вопрос вне темы компании/вакансии — ответь кратко и профессионально, поясни степень связи с компанией и мягко верни фокус к трудоустройству.
3) Поддерживай уважительный тон, ясность и инклюзивность. Избегай жаргона и оценочных характеристик личности.

Старт диалога (если язык ещё не выбран):
— Представься: «Здравствуйте! Я HR-менеджер компании {{company_name}} по вакансии {{vacancy_title}}.»
— Одним предложением опиши компанию (сфера/продукт/миссия — только известные факты).
— Сразу спроси язык трёхъязычно: «Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English».
— Если кандидат пишет на kk/ru/en — автоматически продолжай на этом языке и НЕ спрашивай язык повторно.

Интервью (после выбора языка):
— Принцип «один ответ → один уточняющий вопрос».
— Сначала базовые блоки (по одному вопросу за раз):
  A) Локация и формат: город; готовность к релокации/удалёнке; формат (офис/гибрид/удалёнка); занятость/график; дата выхода.
  B) Опыт: общий и релевантный под роль; ключевые навыки; примеры задач/достижений.
  C) Английский: уровень (A1–C2 / Beginner–Advanced), реальное использование (встречи, письма, демо).
  D) Образование: уровень, специальность, вуз, год; доп. обучение/сертификаты.
  E) Вознаграждение: желаемая зарплата (валюта/вилка/налоги), бонусы/льготы; готовность к обсуждению.
— Затем 1–2 поведенческих/психологических вопроса (STAR): сложная задача, дедлайны/многозадачность, конфликт и его решение.
— Вопросы по компании/вакансии: мотивация к {{company_name}} и к роли; ожидания от команды/процессов; график/командировки/ИП; ограничения.

Правила языка и стиля:
— Всегда сохраняй выбранный язык (Қазақша / Русский / English) до конца диалога.
— Структура: короткий ответ → один корректный уточняющий вопрос.

Работа с «вне темы»:
— Дай краткий ответ, явно отметь связь/несвязь с компанией, мягко вернись к вакансии.

Завершение (когда собраны ключевые блоки: локация/формат, опыт, английский, образование, зарплата, мотивация и вопросы по компании):
— Заверши академично и доброжелательно, без оценок и процентов:
  1) Благодарность за время и ответы.
  2) Краткий следующий шаг (внутренний обзор/согласование).
  3) Обещание обратной связи с ориентиром по срокам.
  4) Вежливое прощание.
— Пример (адаптируй под язык):
  «Благодарю Вас за содержательную беседу. Мы систематизируем предоставленную информацию и свяжемся после внутреннего рассмотрения заявки. Ожидаемый срок информирования — в ближайшие рабочие дни. Признательны за интерес к {{company_name}} и открытую коммуникацию.»

Формат ответа СТРОГО JSON (без markdown/пояснений):
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

Правила для memory_patch:
— Если из сообщения кандидата извлечены новые факты, заполни соответствующие поля; иначе верни null.
— Если язык уже выбран (по памяти или по языку сообщений) — НЕ задавай вопрос выбора языка повторно.
— Используй известные поля памяти при формулировании ответов (не проси то, что уже известно, если это не уточнение).
— Никаких оценок/процентов/дополнительных полей.
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

    const {
      history = [],        // [{ role: "user"|"assistant", content: "..." }]
      vacancy = {},        // { company, title, industry, product, description, city, format, ... }
      profile = {},        // стартовые данные о кандидате (опционально)
      conversationId = "default"
    } = await req.json();

    // 1) Память разговора
    const memory = getMemory(conversationId);

    // 2) Краткий контекст (память приоритетнее профиля)
    const contextBlock = `
Компания: ${vacancy.company || "-"}
Сфера/продукт: ${vacancy.industry || vacancy.product || "-"}
Вакансия: ${vacancy.title || "-"}
Город: ${memory.city || profile.city || "-"}
Формат: ${memory.format || profile.preferredFormat || "-"}
Доступность/график: ${memory.availability || "-"}
Английский: ${memory.english || profile.english || "-"}
Образование: ${memory.education || profile.education || "-"}
Желаемая зарплата: ${memory.salary || profile.salary || "-"}
Мотивация: ${memory.motivation || "-"}
Вопросы к компании: ${memory.company_questions || "-"}
Дата возможного выхода: ${memory.available_from || "-"}
Выбранный язык: ${memory.language || "-"}
`.trim();

    // 3) История для Gemini
    const contents = [];
    for (const m of history) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

    // 4) INIT только если диалог новый и язык ещё не выбран
    if (history.length === 0 && !memory.language) {
      contents.push({ role: "user", parts: [{ text: "INIT" }] });
    }

    // 5) Вызов модели
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

    // 6) Парсинг ответа
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
      // Фоллбек: корректно инициируем язык
      const companyName = vacancy.company || "Компания";
      const role = vacancy.title ? `: ${vacancy.title}` : "";
      return j(200, {
        ok: true,
        reply: `${companyName}${role}. Выберите язык / Тілді таңдаңыз / Choose your language: Қазақша, Русский, English.`,
        next_action: "ask",
        raw: text,
      });
    }

    // 7) Применяем memory_patch, если пришёл
    if (parsed.memory_patch && typeof parsed.memory_patch === "object") {
      patchMemory(conversationId, parsed.memory_patch);
    } else {
      // лёгкая эвристика: если reply явно на одном языке и язык ещё не выбран
      const rep = parsed.reply || "";
      if (!memory.language) {
        if (/Тілді таңдаңыз|Қазақша/i.test(rep)) patchMemory(conversationId, { language: "Қазақша" });
        else if (/Choose your language|English/i.test(rep)) patchMemory(conversationId, { language: "English" });
        else if (/[А-Яа-яЁё]/.test(rep)) patchMemory(conversationId, { language: "Русский" });
      }
    }

    // 8) Итог
    return j(200, {
      ok: true,
      reply: parsed.reply,
      next_action: parsed.next_action,
      // debug_memory: getMemory(conversationId) // включи на время разработки
    });

  } catch (e) {
    return j(500, { ok: false, error: e?.message || String(e) });
  }
}

// app/api/assistant/route.js
export const runtime = "edge";

const MODEL = "gemini-2.5-flash"; // быстрая актуальная модель Gemini

const SYSTEM_PROMPT = `
Ты — виртуальный HR-представитель компании.
Отвечай по-русски, вежливо и профессионально.
Твоя цель — помочь кандидату разобраться во всём, что связано с вакансией, компанией и процессом трудоустройства,
а также собрать ключевую информацию о кандидате.

Ты можешь:
- рассказывать о компании, вакансии, задачах и процессе найма;
- уточнять у кандидата:
  • уровень владения английским языком,
  • желаемый уровень дохода (зарплату),
  • образование (уровень, специальность, учебное заведение),
  • другие релевантные детали для найма (город, формат, опыт).

Всегда задавай **один уточняющий вопрос за раз**.
Не пиши длинных текстов. Отвечай дружелюбно, профессионально и кратко (1–3 предложения).

Если вопрос не связан с работой или компанией — вежливо предложи вернуться к теме трудоустройства.

Формат ответа СТРОГО ТОЛЬКО в виде JSON (без markdown и пояснений):
{
  "reply": "фраза бота пользователю",
  "next_action": "ask" | "finish"
}

Правила:
- Не добавляй проценты, оценки или баллы.
- Не используй поля "final_score" или "signals".
- Если информации пока не хватает — продолжай задавать вопросы.
- Когда получено всё нужное (город, опыт, формат, английский, зарплата, образование) — можешь завершить с next_action="finish".
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
- Английский: ${profile.english || "-"}
- Образование: ${profile.education || "-"}
- Желаемая зарплата: ${profile.salary || "-"}
`.trim();

    const contents = [];
    for (const m of history) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

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
      return j(200, {
        ok: true,
        reply:
          "Извините, не распознал формат ответа. Расскажите, пожалуйста, какой у вас уровень английского и желаемая зарплата?",
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

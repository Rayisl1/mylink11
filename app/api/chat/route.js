export const runtime = "edge";

export async function POST(req) {
  try {
    const { messages, job } = await req.json();

    // пример интеграции с провайдером ИИ (OpenAI совместимый эндпоинт)
    const apiKey = process.env.OPENAI_API_KEY; // добавишь в Vercel → Project → Settings → Environment Variables
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key missing" }), { status: 500 });
    }

    const payload = {
      model: "gpt-4o-mini", // или твой провайдер/модель
      messages: [
        { role: "system", content: `Ты ассистент по вакансиям. Вакансия: ${job?.title||""}. Отвечай кратко и по делу.` },
        ...(messages||[])
      ],
      temperature: 0.3
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const t = await res.text();
      return new Response(JSON.stringify({ error: t.slice(0,500) }), { status: 500 });
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "…";

    return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type":"application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

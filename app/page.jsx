"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/* ===== Mock вакансий ===== */
const JOBS = [
  {
    id: 1,
    title: "Менеджер по продажам",
    city: "Алматы",
    exp: "от 2 лет",
    format: "Полный день",
    salary: "от 300 000 ₸",
    description:
      "Ищем активного менеджера по продажам для работы с входящими лидами и холодными звонками. Нужен уверенный пользователь CRM, грамотная речь, дисциплина."
  },
  {
    id: 2,
    title: "Маркетолог Performance",
    city: "Астана",
    exp: "от 3 лет",
    format: "Гибрид",
    salary: "от 600 000 ₸",
    description:
      "Настройка и оптимизация рекламных кампаний (Google/Meta/TikTok). Аналитика, гипотезы, отчётность."
  }
];

const clsx = (...xs) => xs.filter(Boolean).join(" ");
const Card = ({ children, className = "" }) => (
  <div className={clsx("bg-white rounded-2xl shadow p-5", className)}>{children}</div>
);
const Button = ({ children, onClick, variant = "primary", className = "", type = "button" }) => {
  const base =
    "px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-blue-600 text-blue-700 hover:bg-blue-50",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    success: "bg-emerald-600 text-white hover:bg-emerald-700"
  };
  return (
    <button type={type} onClick={onClick} className={clsx(base, styles[variant], className)}>
      {children}
    </button>
  );
};

/* ===== SmartBot виджет ===== */
function SmartBotWidget({ job }) {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const [candidate, setCandidate] = useState({});
  const listRef = useRef(null);

  const push = (sender, text) => setMessages((m) => [...m, { sender, text }]);

  useEffect(() => {
    push("bot", `Спасибо за интерес к вакансии «${job.title}». Как вас зовут?`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const normalizeYesNo = (v) => {
    const t = (v || "").toString().trim().toLowerCase();
    const yes = ["да", "ага", "угу", "ок", "yes", "y", "д", "+"];
    const no = ["нет", "не", "no", "n", "-", "неа"];
    if (yes.includes(t)) return "да";
    if (no.includes(t)) return "нет";
    return t;
  };

  const quicks = useMemo(() => {
    if (step === 1 || step === 2 || step === 3) {
      return [
        { label: "Да", value: "да" },
        { label: "Нет", value: "нет" }
      ];
    }
    return [];
  }, [step]);

  const ask = (s) => {
    if (s === 1) push("bot", `Вы сейчас находитесь в городе ${job.city}?`);
    if (s === 2) push("bot", `У вас есть минимум ${job.exp}?`);
    if (s === 3) push("bot", `Формат ${job.format}. Подходит такой график?`);
    if (s === 4) {
      push("bot", "Спасибо! Оцениваю вашу релевантность…");
      setTimeout(() => finish(), 500);
    }
  };

  const finish = () => {
    let score = 100;
    if (candidate.city !== "да") score -= 30;
    if (candidate.exp !== "да") score -= 40;
    if (candidate.format !== "да") score -= 30;
    if (score < 0) score = 0;

    push("bot", `Релевантность: <b>${score}%</b>`);

    const all = JSON.parse(localStorage.getItem("smartbot_candidates") || "[]");
    all.push({
      name: candidate.name || "Кандидат",
      city: candidate.city,
      exp: candidate.exp,
      format: candidate.format,
      score,
      jobId: job.id,
      jobTitle: job.title,
      date: new Date().toISOString()
    });
    localStorage.setItem("smartbot_candidates", JSON.stringify(all));
    localStorage.setItem("smartbot_score", score);

    push(
      "bot",
      `Можно также оформить отклик через внешний портал (пример — <a class='underline' href='https://mylink.kz/login' target='_blank' rel='noopener'>mylink.kz</a>). Это опционально.`
    );
    push("bot", "Ваши ответы сохранены. Спасибо! Можете закрыть чат.");
  };

  const handle = (text) => {
    const v = text.trim();
    if (!v) return;
    push("user", v);

    if (step === 0) {
      setCandidate((c) => ({ ...c, name: v }));
      setStep(1);
      ask(1);
    } else if (step === 1) {
      setCandidate((c) => ({ ...c, city: normalizeYesNo(v) }));
      setStep(2);
      ask(2);
    } else if (step === 2) {
      setCandidate((c) => ({ ...c, exp: normalizeYesNo(v) }));
      setStep(3);
      ask(3);
    } else if (step === 3) {
      setCandidate((c) => ({ ...c, format: normalizeYesNo(v) }));
      setStep(4);
      ask(4);
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b px-4 py-3 bg-slate-50 text-slate-700 font-semibold">
        🤖 SmartBot — быстрый скрининг
      </div>
      <div ref={listRef} className="px-4 py-3 h-72 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex", m.sender === "bot" ? "justify-start" : "justify-end")}>
            <div
              className={clsx(
                "px-3 py-2 rounded-xl max-w-[80%] text-sm",
                m.sender === "bot" ? "bg-slate-100" : "bg-blue-100"
              )}
              dangerouslySetInnerHTML={{
                __html: `<b>${m.sender === "bot" ? "SmartBot" : "Вы"}:</b> ${m.text}`
              }}
            />
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 space-y-2">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Введите ответ…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handle(value);
                setValue("");
              }
            }}
          />
          <Button onClick={() => { handle(value); setValue(""); }}>Отправить</Button>
        </div>
        {quicks.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {quicks.map((q, idx) => (
              <Button key={idx} variant="subtle" onClick={() => handle(q.value)}>
                {q.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ===== Кабинет работодателя ===== */
function EmployerDashboard() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("smartbot_candidates") || "[]");
    setRows(data.reverse());
  }, []);

  const color = (s) => (s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-amber-500" : "bg-rose-500");

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Отклики SmartBot</h3>
        <Button
          variant="subtle"
          onClick={() => {
            localStorage.removeItem("smartbot_candidates");
            setRows([]);
          }}
        >
          Очистить
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">Имя</th>
              <th className="py-2 pr-4">Вакансия</th>
              <th className="py-2 pr-4">Релевантность</th>
              <th className="py-2 pr-4">Индикатор</th>
              <th className="py-2">Ответы</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  Пока нет сохранённых откликов. Попросите кандидатов пройти скрининг.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 pr-4">{r.name}</td>
                <td className="py-2 pr-4">{r.jobTitle}</td>
                <td className="py-2 pr-4">
                  <span className={clsx("px-2 py-1 rounded-full text-white", color(r.score))}>
                    {r.score}%
                  </span>
                </td>
                <td className="py-2 pr-4 w-48">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={clsx("h-2", color(r.score))} style={{ width: `${r.score}%` }} />
                  </div>
                </td>
                <td className="py-2 text-slate-600">
                  город: {r.city}; опыт: {r.exp}; формат: {r.format}
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(r.date).toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ===== Страницы ===== */
function Home({ go }) {
  return (
    <Card>
      <h2 className="text-2xl font-semibold">Добро пожаловать в демо-портал вакансий</h2>
      <p className="text-slate-600 mt-2">
        Это учебный пример портала, похожего по духу на mylink: вакансии, карточки, отклики.
        Данных бэкенда нет — всё хранится в вашем браузере (localStorage).
      </p>
      <div className="mt-4 flex gap-2 flex-wrap">
        <Button onClick={() => go("jobs")}>Перейти к вакансиям</Button>
        <a href="https://mylink.kz/login" target="_blank" rel="noopener" className="inline-block">
          <Button variant="outline">Открыть mylink.kz (внешняя ссылка)</Button>
        </a>
      </div>
    </Card>
  );
}

function Jobs({ go, setJob }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {JOBS.map((j) => (
        <Card key={j.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{j.title}</h3>
              <div className="text-sm text-slate-600 mt-1">
                <div><b>Город:</b> {j.city}</div>
                <div><b>Опыт:</b> {j.exp}</div>
                <div><b>Формат:</b> {j.format}</div>
                <div><b>Зарплата:</b> {j.salary}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => { setJob(j); go("job"); }}>Подробнее</Button>
            <a href="https://mylink.kz/login" target="_blank" rel="noopener" className="inline-block">
              <Button variant="outline">Отклик через mylink.kz</Button>
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}

function JobDetail({ job, go }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">{job.title}</h2>
          <div className="flex gap-2">
            <a href="https://mylink.kz/login" target="_blank" rel="noopener" className="inline-block">
              <Button variant="outline">Через mylink.kz</Button>
            </a>
            <Button onClick={() => document.getElementById("smartbot").scrollIntoView({ behavior: "smooth" })}>
              Отклик в чате
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-3 text-slate-700 text-sm">
          <div><b>Город:</b> {job.city}</div>
          <div><b>Опыт:</b> {job.exp}</div>
          <div><b>Формат:</b> {job.format}</div>
          <div><b>Зарплата:</b> {job.salary}</div>
        </div>
        <p className="text-slate-600 mt-3">{job.description}</p>
      </Card>

      <div id="smartbot">
        <SmartBotWidget job={job} />
      </div>
    </div>
  );
}

function Auth() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
    <Card>
      <h3 className="text-lg font-semibold mb-3">Вход</h3>
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Email" />
        <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Пароль" type="password" />
        <Button className="w-full" type="submit">Войти</Button>
      </form>
    </Card>
    <Card>
      <h3 className="text-lg font-semibold mb-3">Регистрация</h3>
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Имя" />
        <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Email" />
        <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Пароль" type="password" />
        <Button className="w-full" type="submit">Создать аккаунт</Button>
      </form>
    </Card>
  </div>
  );
}

/* ===== Корневой компонент ===== */
export default function Page() {
  const [page, setPage] = useState("home");
  const [job, setJob] = useState(JOBS[0]);
  const go = (p) => setPage(p);

  return (
    <>
      <header className="sticky top-0 backdrop-blur bg-white/80 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="font-bold text-lg">MyLink Demo</div>
          <nav className="ml-auto flex gap-2">
            <Button variant={page === "home" ? "primary" : "subtle"} onClick={() => go("home")}>Главная</Button>
            <Button variant={page === "jobs" ? "primary" : "subtle"} onClick={() => go("jobs")}>Вакансии</Button>
            <Button variant={page === "job" ? "primary" : "subtle"} onClick={() => go("job")}>Детали</Button>
            <Button variant={page === "auth" ? "primary" : "subtle"} onClick={() => go("auth")}>Вход/Регистрация</Button>
            <Button variant={page === "employer" ? "primary" : "subtle"} onClick={() => go("employer")}>Работодатель</Button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 grid gap-4">
        {page === "home" && <Home go={go} />}
        {page === "jobs" && <Jobs go={go} setJob={setJob} />}
        {page === "job" && <JobDetail go={go} job={job} />}
        {page === "auth" && <Auth />}
        {page === "employer" && <EmployerDashboard />}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-slate-500">
        Демо-сайт для презентации. Данные не отправляются на сервер и остаются в вашем браузере.
      </footer>
    </>
  );
}

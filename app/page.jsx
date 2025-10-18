"use client";
import { useEffect, useRef, useState, useMemo } from "react";

/* ========= ДАННЫЕ ДЛЯ КАРТОЧЕК (РАСШИРЕНО) ========= */
const JOBS = [
  { id: 1,  title: "Менеджер по продажам",            city: "Алматы",    exp: "от 2 лет",   format: "Полный день",  salary: "от 300 000 ₸" },
  { id: 2,  title: "Маркетолог Performance",           city: "Астана",    exp: "от 3 лет",   format: "Гибрид",       salary: "от 600 000 ₸" },
  { id: 3,  title: "UI/UX Дизайнер",                   city: "Шымкент",   exp: "от 2 лет",   format: "Гибрид",       salary: "" },
  { id: 4,  title: "Backend Developer (Node.js)",      city: "Алматы",    exp: "Middle+",    format: "Full Remote",  salary: "" },
  { id: 5,  title: "Product Manager",                  city: "Астана",    exp: "Senior",     format: "Офис",         salary: "" },
  { id: 6,  title: "Frontend Developer (React)",       city: "Алматы",    exp: "Middle",     format: "Гибрид",       salary: "до 900 000 ₸" },
  { id: 7,  title: "Data Analyst",                     city: "Астана",    exp: "от 1 года",  format: "Полный день",  salary: "" },
  { id: 8,  title: "SMM-специалист",                   city: "Алматы",    exp: "Junior+",    format: "Гибрид",       salary: "" },
  { id: 9,  title: "QA Engineer",                      city: "Караганда", exp: "Middle",     format: "Полный день",  salary: "" },
  { id:10,  title: "HR Generalist",                    city: "Алматы",    exp: "от 2 лет",   format: "Офис",         salary: "" },
  { id:11,  title: "DevOps Engineer (AWS)",            city: "Астана",    exp: "Senior",     format: "Гибрид",       salary: "" },
  { id:12,  title: "Salesforce Administrator",         city: "Алматы",    exp: "Middle",     format: "Полный день",  salary: "" },
];

/* ========= ВСПОМОГАТЕЛЬНОЕ ========= */
const clsx = (...xs) => xs.filter(Boolean).join(" ");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

/* ========= АУТЕНТИФИКАЦИЯ (ЛОКАЛЬНО) ========= */
function AuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  // регистрация
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [birth,     setBirth]     = useState(""); // дд.мм.гггг
  const [role,      setRole]      = useState("applicant"); // applicant | employer

  // общее
  const [email,     setEmail]     = useState("");
  const [pass,      setPass]      = useState("");
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("login");
    setFirstName(""); setLastName(""); setBirth(""); setRole("applicant");
    setEmail(""); setPass(""); setError("");
  }, [open]);

  if (!open) return null;

  const validBirth = (v) => {
    // простой чекер формата дд.мм.гггг
    const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!m) return false;
    const d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
    if (y < 1900 || y > 2100) return false;
    if (mo < 1 || mo > 12) return false;
    if (d < 1 || d > 31) return false;
    return true;
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");

    const users = JSON.parse(localStorage.getItem("jb_users") || "{}"); // email -> user
    const hash = btoa(pass); // псевдохэш (демо)

    if (mode === "register") {
      if (!firstName.trim()) return setError("Введите имя");
      if (!lastName.trim())  return setError("Введите фамилию");
      if (!validBirth(birth)) return setError("Дата рождения в формате дд.мм.гггг");
      if (!email.includes("@") || !email.endsWith("@gmail.com")) return setError("Введите корректный Gmail");
      if (pass.length < 4) return setError("Минимум 4 символа в пароле");
      if (users[email]) return setError("Пользователь уже существует");

      const user = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birth,
        role, // applicant | employer
        email,
        passHash: hash,
      };
      users[email] = user;
      localStorage.setItem("jb_users", JSON.stringify(users));
      localStorage.setItem("jb_current", JSON.stringify(user));
      onAuth(user);
      onClose();
      return;
    }

    // login
    const u = users[email];
    if (!u || u.passHash !== hash) return setError("Неверный email или пароль");
    localStorage.setItem("jb_current", JSON.stringify(u));
    onAuth(u);
    onClose();
  };

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true">
      <div className="auth-modal">
        <div className="auth-head">
          <div className="auth-tabs">
            <button className={clsx("auth-tab", mode === "login" && "active")} onClick={() => setMode("login")}>
              Вход
            </button>
            <button className={clsx("auth-tab", mode === "register" && "active")} onClick={() => setMode("register")}>
              Регистрация
            </button>
          </div>
          <button className="auth-close" onClick={onClose}>×</button>
        </div>

        <form className="auth-body" onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="field">
                <label>Имя</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Иван" />
              </div>
              <div className="field">
                <label>Фамилия</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Иванов" />
              </div>
              <div className="field">
                <label>Дата рождения (дд.мм.гггг)</label>
                <input value={birth} onChange={(e) => setBirth(e.target.value)} placeholder="31.12.2000" />
              </div>
            </>
          )}

          <div className="field">
            <label>Gmail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••" />
          </div>

          {mode === "register" && (
            <div className="field">
              <label>Роль</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label className="radio">
                  <input
                    type="radio"
                    name="role"
                    value="applicant"
                    checked={role === "applicant"}
                    onChange={() => setRole("applicant")}
                  />
                  Соискатель (только вакансии)
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    name="role"
                    value="employer"
                    checked={role === "employer"}
                    onChange={() => setRole("employer")}
                  />
                  Работодатель (вакансии + вкладка работодателя)
                </label>
              </div>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: 8 }}>
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>

          <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            Демоверсия: данные хранятся только в вашем браузере.
          </div>
        </form>
      </div>

      <style jsx global>{`
        .auth-backdrop{position:fixed;inset:0;background:rgba(2,8,23,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
        .auth-modal{width:min(520px,94vw);background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 60px rgba(2,8,23,.25);overflow:hidden}
        .auth-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f1f5f9;border-bottom:1px solid var(--line)}
        [data-theme="dark"] .auth-head{background:#0b1424}
        .auth-tabs{display:flex;gap:8px}
        .auth-tab{border:none;background:transparent;padding:8px 10px;border-radius:10px;cursor:pointer;font-weight:600;color:var(--muted)}
        .auth-tab.active{color:var(--text);background:rgba(37,99,235,.08)}
        .auth-close{border:none;background:transparent;font-size:22px;cursor:pointer;color:#475569}
        .auth-body{padding:16px}
        .field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
        .field label{font-size:13px;color:var(--muted)}
        .field input{padding:10px 12px;border:1px solid var(--line);border-radius:12px;font-size:14px;background:transparent;color:var(--text)}
        .radio{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text)}
        .auth-error{color:#ef4444;background:#fef2f2;border:1px solid #fecaca;padding:8px 10px;border-radius:10px;font-size:13px;margin-bottom:8px}
      `}</style>
    </div>
  );
}

/* ========= SMARTBOT МОДАЛ (твой локальный демо-бот, можно позже заменить на Denser) ========= */
function SmartBotModal({ open, onClose, job }) {
  const [step, setStep] = useState(0);
  const [candidate, setCandidate] = useState({ name: "", city: "", exp: "", format: "" });
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const push = (sender, html) => setMessages((arr) => [...arr, { sender, html }]);

  const setQuick = (labels) =>
    labels.map((label) => (
      <button key={label} className="sb-quick-btn" onClick={() => handleUser(label)} type="button">
        {label}
      </button>
    ));

  const normalize = (v) => {
    const t = (v || "").toLowerCase().trim();
    if (["да", "y", "yes", "ага", "угу", "ок", "+"].includes(t)) return "да";
    if (["нет", "n", "no", "-", "неа"].includes(t)) return "нет";
    return t;
  };

  const ask = () => {
    if (step === 0) push("bot", `Спасибо за интерес к вакансии «${esc(job.title)}». Как вас зовут?`);
    if (step === 1) push("bot", `Вы сейчас в городе ${esc(job.city)}?`);
    if (step === 2) push("bot", `Есть минимум ${esc(job.exp)}?`);
    if (step === 3) push("bot", `Формат ${esc(job.format)}. Подходит?`);
    if (step === 4) {
      push("bot", "Спасибо! Оцениваю вашу релевантность…");
      finish();
    }
  };

  const finish = () => {
    let score = 100;
    if (candidate.city !== "да") score -= 30;
    if (candidate.exp !== "да") score -= 40;
    if (candidate.format !== "да") score -= 30;
    if (score < 0) score = 0;

    const tone = score >= 80 ? "good" : score >= 60 ? "warn" : "bad";
    push("bot", `Релевантность: <span class="score ${tone}">${score}%</span>`);
    push("bot", "Можете задать вопросы по вакансии (демо-режим без сервера).");

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

    setStep(999);
  };

  const handleUser = (text) => {
    const v = (text || "").trim();
    if (!v) return;
    push("user", esc(v));

    if (step === 0) { setCandidate((c) => ({ ...c, name: v })); setStep(1); return; }
    if (step === 1) { setCandidate((c) => ({ ...c, city: normalize(v) })); setStep(2); return; }
    if (step === 2) { setCandidate((c) => ({ ...c, exp: normalize(v) })); setStep(3); return; }
    if (step === 3) { setCandidate((c) => ({ ...c, format: normalize(v) })); setStep(4); return; }

    const canned = [
      "Принято! Передам рекрутеру.",
      "Готов ответить на любые уточняющие вопросы.",
      "График: будни, с 10:00 до 19:00; испытательный срок 2 месяца.",
      "План продаж и CRM — предоставим при онбординге.",
    ];
    push("bot", canned[Math.floor(Math.random() * canned.length)]);
  };

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setCandidate({ name: "", city: "", exp: "", format: "" });
    setMessages([]);
  }, [open, job?.id]);

  useEffect(() => { if (open) ask(); }, [step, open]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  if (!open) return null;

  return (
    <div className="sb-backdrop" role="dialog" aria-modal="true" aria-labelledby="sb-title">
      <div className="sb-modal">
        <div className="sb-head">
          <div className="sb-title" id="sb-title">🤖 SmartBot — быстрый скрининг</div>
          <button className="sb-close" aria-label="Закрыть" onClick={onClose}>×</button>
        </div>
        <div className="sb-body">
          <div className="sb-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={clsx(m.sender === "bot" ? "sb-bot" : "sb-user")}
                dangerouslySetInnerHTML={{ __html: `<b>${m.sender === "bot" ? "SmartBot" : "Вы"}:</b> ${m.html}` }} />
            ))}
          </div>
          <div className="sb-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Введите ответ..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = e.currentTarget.value;
                  e.currentTarget.value = "";
                  handleUser(v);
                }
              }}
            />
            <button onClick={() => {
              const el = inputRef.current;
              const v = el?.value?.trim();
              if (!v) return;
              el.value = "";
              handleUser(v);
            }}>
              Отправить
            </button>
          </div>
          <div className="sb-quick">{[1, 2, 3].includes(step) ? setQuick(["Да", "Нет"]) : null}</div>
        </div>
      </div>

      <style jsx global>{`
        .sb-backdrop{position:fixed;inset:0;background:var(--overlay);display:flex;align-items:center;justify-content:center;z-index:50}
        .sb-modal{width:min(720px,94vw);background:var(--card);border-radius:16px;border:1px solid var(--line);box-shadow:0 20px 60px rgba(2,8,23,.25);overflow:hidden}
        .sb-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f8fafc;border-bottom:1px solid var(--line)}
        [data-theme="dark"] .sb-head{background:#0b1424}
        .sb-title{font-weight:600}
        .sb-close{border:none;background:transparent;font-size:20px;line-height:1;cursor:pointer;color:#94a3b8}
        .sb-body{padding:12px 16px}
        .sb-messages{height:360px;overflow:auto;display:flex;flex-direction:column;gap:10px;padding-right:4px}
        .sb-bot,.sb-user{max-width:78%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.4}
        .sb-bot{background:#f1f5f9;align-self:flex-start}[data-theme="dark"] .sb-bot{background:#122033}
        .sb-user{background:#dbeafe;align-self:flex-end}[data-theme="dark"] .sb-user{background:#1d3a6a}
        .sb-input{display:flex;gap:8px;margin-top:12px}
        .sb-input input{flex:1;padding:10px 12px;border:1px solid var(--line);border-radius:12px;font-size:14px;background:transparent;color:var(--text)}
        .sb-input button{padding:10px 12px;border-radius:12px;border:none;background:var(--brand);color:#fff;font-weight:600;cursor:pointer}
        .sb-quick{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
        .sb-quick-btn{padding:6px 10px;border:1px solid var(--line);background:transparent;border-radius:999px;cursor:pointer;font-size:13px;color:var(--text)}
        .score{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600}
        .score.good{background:var(--good-bg);color:var(--good-t);border:1px solid var(--good-br)}
        .score.warn{background:var(--warn-bg);color:var(--warn-t);border:1px solid var(--warn-br)}
        .score.bad{background:var(--bad-bg);color:var(--bad-t);border:1px solid var(--bad-br)}
      `}</style>
    </div>
  );
}

/* ========= ТАБЛИЦА РАБОТОДАТЕЛЯ ========= */
function EmployerTable() {
  const [rows, setRows] = useState([]);

  const load = () => {
    const data = JSON.parse(localStorage.getItem("smartbot_candidates") || "[]")
      .slice()
      .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0))); // сортировка по убыванию %
    setRows(data);
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!rows.length) return alert("Нет данных для экспорта");
    const headers = ["name", "city", "exp", "format", "score", "jobId", "jobTitle", "date"];
    const lines = [headers.join(",")];
    rows.forEach((o) => {
      const row = headers.map((k) => `"${(o[k] ?? "").toString().replace(/"/g, '""')}"`).join(",");
      lines.push(row);
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url; a.download = `smartbot_candidates_${ts}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const clearAll = () => {
    if (!confirm("Удалить все сохранённые отклики?")) return;
    localStorage.removeItem("smartbot_candidates");
    load();
  };

  const tone = (score) => (score >= 80 ? "b-good" : score >= 60 ? "b-warn" : "b-bad");

  return (
    <div className="card">
      <div className="toolbar">
        <button className="btn btn-outline" onClick={exportCSV}>Экспорт CSV</button>
        <button className="btn btn-outline" onClick={load}>Обновить</button>
        <button className="btn btn-outline" onClick={clearAll}>Очистить</button>
      </div>

      <div style={{ overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Имя</th><th>Вакансия</th><th>Релевантность</th><th>Индикатор</th><th>Ответы</th><th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                  Пока нет данных. Пройдите скрининг через «Откликнуться».
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{esc(r.name)}</td>
                <td>{esc(r.jobTitle || "")}</td>
                <td><span className={clsx("badge", tone(Number(r.score) || 0))}>{Number(r.score) || 0}%</span></td>
                <td>
                  <div style={{ height: 8, background: "var(--line)", borderRadius: 999, overflow: "hidden", width: 140 }}>
                    <div style={{
                      height: 8,
                      width: `${Math.max(0, Math.min(100, Number(r.score) || 0))}%`,
                      background: "#60a5fa"
                    }} />
                  </div>
                </td>
                <td style={{ color: "var(--muted)", fontSize: 13 }}>
                  город: {esc(r.city || "-")}; опыт: {esc(r.exp || "-")}; формат: {esc(r.format || "-")}
                </td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(r.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========= ГЛАВНАЯ СТРАНИЦА ========= */
export default function Page() {
  const [theme, setTheme] = useState("light");
  const [view, setView] = useState("jobs");
  const [modalOpen, setModalOpen] = useState(false);
  const [job, setJob] = useState(JOBS[0]);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [q, setQ] = useState(""); // поисковый запрос

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme);

    const cur = localStorage.getItem("jb_current");
    if (cur) {
      try {
        const u = JSON.parse(cur);
        setUser(u);
        // если соискатель, принудительно на вкладку вакансий
        if (u.role === "applicant") setView("jobs");
      } catch {}
    }
  }, []);

  const switchTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const openSmartBot = (j) => { setJob(j); setModalOpen(true); };

  const logout = () => { localStorage.removeItem("jb_current"); setUser(null); setView("jobs"); };

  // фильтрация вакансий
  const filteredJobs = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return JOBS;
    return JOBS.filter((j) =>
      [j.title, j.city, j.format, j.exp, j.salary].join(" ").toLowerCase().includes(t)
    );
  }, [q]);

  const canSeeEmployer = !user || user.role === "employer"; // работодатель — да; соискатель — нет

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <div className="logo">JobBoard</div>

          {/* Поиск */}
          <div className="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск вакансий (название, город, формат, опыт)…"
            />
          </div>

          <div className="nav">
            <button className={clsx(view === "jobs" && "active")} onClick={() => setView("jobs")}>
              Вакансии
            </button>

            {canSeeEmployer && (
              <button className={clsx(view === "employer" && "active")} onClick={() => setView("employer")}>
                Работодатель
              </button>
            )}

            <button onClick={switchTheme} title="Светлая/тёмная тема">Тема</button>

            {/* Блок пользователя */}
            {!user ? (
              <button className="btn btn-outline" onClick={() => setAuthOpen(true)}>Войти</button>
            ) : (
              <div className="userbox">
                <div className="avatar">{(user.firstName || "U").slice(0,1).toUpperCase()}</div>
                <div className="uinfo">
                  <div className="uname">{user.firstName} {user.lastName}</div>
                  <div className="umail">{user.email} • {user.role === "employer" ? "Работодатель" : "Соискатель"}</div>
                </div>
                <button className="btn btn-outline" onClick={logout}>Выход</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div>
            <h1>Найдите работу мечты</h1>
            <p>Поиск, быстрый отклик и умный скрининг через SmartBot.</p>
          </div>
          <div className="pill">Демо-версия (фронтенд only)</div>
        </section>

        {/* ВАКАНСИИ */}
        {view === "jobs" && (
          <section>
            {filteredJobs.length === 0 ? (
              <div className="card" style={{ color: "var(--muted)" }}>
                Ничего не найдено. Попробуйте изменить запрос.
              </div>
            ) : (
              <div className="grid">
                {filteredJobs.map((j, idx) => (
                  <article className={clsx("card", idx < 2 ? "col-6" : "col-4")} key={j.id}>
                    <h3 className="title">{j.title}</h3>
                    <div className="meta">
                      <span className="pill">{j.city}</span>
                      <span className="pill">{j.exp}</span>
                      <span className="pill">{j.format}</span>
                      {j.salary && <span className="pill">{j.salary}</span>}
                    </div>
                    <div className="row">
                      <div><strong>Обязанности:</strong> коммуникация, отчётность, командная работа</div>
                      <div><strong>Требования:</strong> дисциплина, обучаемость, ответственность</div>
                    </div>
                    <div className="actions">
                      <button className="btn btn-primary" onClick={() => openSmartBot(j)}>Откликнуться</button>
                      <button className="btn btn-outline" onClick={() => openSmartBot(j)}>Быстрый отклик</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* РАБОТОДАТЕЛЬ */}
        {view === "employer" && canSeeEmployer && (
          <section>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 className="title" style={{ marginBottom: 8 }}>Отклики SmartBot (отсортированы по убыванию релевантности)</h3>
              <p className="muted" style={{ color: "var(--muted)", margin: 0 }}>
                Здесь появляются кандидаты после прохождения скрининга.
              </p>
            </div>
            <EmployerTable />
          </section>
        )}

        <p className="foot">© 2025 JobBoard Demo. Данные авторизации и отклики хранятся только в вашем браузере (localStorage).</p>
      </div>

      {/* Модалки */}
      <SmartBotModal open={modalOpen} job={job} onClose={() => setModalOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={(u) => { setUser(u); if (u.role === "applicant") setView("jobs"); }} />

      {/* Глобальные стили страницы */}
      <style jsx global>{`
        :root{
          --bg:#f6f8fb; --card:#fff; --text:#0f172a; --muted:#64748b; --brand:#2563eb; --brand-600:#1e4ed8; --line:#e2e8f0; --pill:#eff6ff;
          --chip-blue:#1e3a8a; --shadow:0 4px 16px rgba(2,8,23,.04); --shadow-lg:0 10px 28px rgba(2,8,23,.08); --overlay:rgba(2,8,23,.5);
          --table-stripe:#fafafa; --good-bg:#ecfdf5; --good-br:#a7f3d0; --good-t:#065f46;
          --warn-bg:#fffbeb; --warn-br:#fde68a; --warn-t:#92400e;
          --bad-bg:#fef2f2; --bad-br:#fecaca; --bad-t:#991b1b;
        }
        [data-theme="dark"]{
          --bg:#0b1220; --card:#0f172a; --text:#e5efff; --muted:#94a3b8; --line:#1e293b; --pill:#0b2a57; --chip-blue:#93c5fd;
          --shadow:0 4px 16px rgba(0,0,0,.3); --shadow-lg:0 10px 28px rgba(0,0,0,.45); --overlay:rgba(0,0,0,.6);
          --table-stripe:#0b1627;
        }
        *{box-sizing:border-box}
        html,body{margin:0;height:100%}
        body{font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text)}
        a{text-decoration:none;color:inherit}
        .container{max-width:1100px;margin:0 auto;padding:24px}
        /* Header */
        .header{position:sticky;top:0;z-index:10;backdrop-filter:saturate(1.3) blur(6px);background:rgba(255,255,255,.85);border-bottom:1px solid var(--line)}
        [data-theme="dark"] .header{background:rgba(15,23,42,.8)}
        .header-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:16px;padding:12px 24px}
        .logo{font-weight:700}
        .nav{margin-left:auto;display:flex;gap:10px;align-items:center}
        .nav button{font-size:14px;color:var(--muted);border:none;background:transparent;padding:8px 10px;border-radius:10px;cursor:pointer}
        .nav button.active{color:var(--text);background:rgba(37,99,235,.08)}
        .userbox{display:flex;align-items:center;gap:10px;margin-left:8px}
        .avatar{width:32px;height:32px;border-radius:50%;background:#e2e8f0;color:#0f172a;display:flex;align-items:center;justify-content:center;font-weight:700}
        [data-theme="dark"] .avatar{background:#1e293b;color:#e5efff}
        .uinfo{display:flex;flex-direction:column;line-height:1}
        .uname{font-weight:600;font-size:13px}
        .umail{font-size:12px;color:var(--muted)}
        /* Search */
        .search{margin-left:24px;flex:1;max-width:420px}
        .search input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:transparent;color:var(--text);font-size:14px}
        /* Hero */
        .hero{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:24px 0}
        .hero h1{margin:0 0 6px 0;font-size:28px}
        .hero p{margin:0;color:var(--muted)}
        /* Grid */
        .grid{display:grid;gap:16px;grid-template-columns:repeat(12,1fr)}
        .col-6{grid-column:span 6}.col-4{grid-column:span 4}
        @media (max-width:900px){.col-6,.col-4{grid-column:span 12}.hero{flex-direction:column;align-items:flex-start}}
        /* Card vacancy */
        .card{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:18px;transition:box-shadow .2s, transform .15s}
        .card:hover{box-shadow:var(--shadow-lg);transform:translateY(-1px)}
        .title{font-weight:600;margin:0 0 6px 0}
        .meta{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
        .pill{background:var(--pill); color:var(--chip-blue); border:1px solid #dbeafe; padding:6px 10px; border-radius:999px; font-size:12px}
        [data-theme="dark"] .pill{border-color:#1e3a8a}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;color:var(--muted);font-size:14px}
        .actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
        .btn{border:none;cursor:pointer;border-radius:12px;padding:10px 14px;font-weight:600;font-size:14px;transition:filter .15s, background .2s, border-color .2s}
        .btn-primary{background:var(--brand); color:#fff}.btn-primary:hover{background:#1e4ed8}
        .btn-outline{background:transparent;border:1px solid var(--brand); color:var(--brand)}.btn-outline:hover{background:rgba(37,99,235,.08)}
        /* Footer */
        .foot{margin:40px 0 20px;color:var(--muted);font-size:13px;text-align:center}
        /* Employer */
        .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
        .table{width:100%;border-collapse:collapse;border:1px solid var(--line);border-radius:12px;overflow:hidden}
        .table th,.table td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;font-size:14px}
        .table th{background:#f8fafc;color:var(--muted);font-weight:600}
        [data-theme="dark"] .table th{background:#0b1424}
        .table tr:nth-child(even){background:var(--table-stripe)}
        .badge{padding:4px 8px;border-radius:999px;font-weight:600;font-size:12px;color:#fff}
        .b-good{background:#10b981}.b-warn{background:#f59e0b}.b-bad{background:#ef4444}
      `}</style>
    </>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/* ========= ДАННЫЕ: вакансии (дефолтные) ========= */
const JOBS_DEFAULT = [
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

/* ========= ДЕМО-СОИСКАТЕЛИ ========= */
const SEED_CANDIDATES = [/* ... твои 12 кандидатов из прошлого сообщения без изменений ... */];

/* ========= HELPERS ========= */
const clsx = (...xs) => xs.filter(Boolean).join(" ");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

/* ========= AUTH ========= */
function AuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birth, setBirth] = useState("");
  const [role, setRole] = useState("applicant");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("login");
    setFirstName("");
    setLastName("");
    setBirth("");
    setRole("applicant");
    setEmail("");
    setPass("");
    setError("");
  }, [open]);

  if (!open) return null;
  const validBirth = (v) => /^(\d{2})\.(\d{2})\.(\d{4})$/.test(v);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const users = JSON.parse(localStorage.getItem("jb_users") || "{}");
    const hash = btoa(pass);
    if (mode === "register") {
      if (!firstName.trim()) return setError("Введите имя");
      if (!lastName.trim()) return setError("Введите фамилию");
      if (!validBirth(birth)) return setError("Дата рождения в формате дд.мм.гггг");
      if (!email.includes("@") || !email.endsWith("@gmail.com")) return setError("Введите корректный Gmail");
      if (pass.length < 4) return setError("Минимум 4 символа");
      if (users[email]) return setError("Пользователь уже существует");
      const user = { firstName: firstName.trim(), lastName: lastName.trim(), birth, role, email, passHash: hash };
      users[email] = user;
      localStorage.setItem("jb_users", JSON.stringify(users));
      localStorage.setItem("jb_current", JSON.stringify(user));
      onAuth(user);
      onClose();
      return;
    }
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
          <button className="auth-close" onClick={onClose}>
            ×
          </button>
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
                  <input type="radio" name="role" value="applicant" checked={role === "applicant"} onChange={() => setRole("applicant")} /> Соискатель
                </label>
                <label className="radio">
                  <input type="radio" name="role" value="employer" checked={role === "employer"} onChange={() => setRole("employer")} /> Работодатель
                </label>
              </div>
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: 8 }}>
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
          <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            Демоверсия: данные только в вашем браузере.
          </div>
        </form>
      </div>

      <style jsx global>{`
        .auth-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 8, 23, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .auth-modal {
          width: min(520px, 94vw);
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(2, 8, 23, 0.25);
          overflow: hidden;
        }
        .auth-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f1f5f9;
          border-bottom: 1px solid var(--line);
        }
        [data-theme="dark"] .auth-head {
          background: #0b1424;
        }
        .auth-tabs {
          display: flex;
          gap: 8px;
        }
        .auth-tab {
          border: none;
          background: transparent;
          padding: 8px 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          color: var(--muted);
        }
        .auth-tab.active {
          color: var(--text);
          background: rgba(37, 99, 235, 0.08);
        }
        .auth-close {
          border: none;
          background: transparent;
          font-size: 22px;
          cursor: pointer;
          color: #475569;
        }
        .auth-body {
          padding: 16px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .field label {
          font-size: 13px;
          color: var(--muted);
        }
        .field input {
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 12px;
          font-size: 14px;
          background: transparent;
          color: var(--text);
        }
        .radio {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text);
        }
        .auth-error {
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}

/* ========= МОДАЛКА «ДОБАВИТЬ СОИСКАТЕЛЯ» ========= */
// (без изменений — как у тебя было)
function AddCandidateModal({ open, onClose, onAdd }) {
  /* ... полный код AddCandidateModal из твоей версии, без правок ... */
}

/* ========= МОДАЛКА «ДОБАВИТЬ ВАКАНСИЮ» ========= */
function AddJobModal({ open, onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [exp, setExp] = useState("");
  const [format, setFormat] = useState("");
  const [salary, setSalary] = useState("");
  const [duties, setDuties] = useState("");
  const [reqs, setReqs] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setCity("");
    setExp("");
    setFormat("");
    setSalary("");
    setDuties("");
    setReqs("");
    setError("");
  }, [open]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Укажите профессию / должность");
    if (!city.trim()) return setError("Укажите город");

    const job = {
      id: Date.now(),
      title: title.trim(),
      city: city.trim(),
      exp: exp.trim(),
      format: format.trim(),
      salary: salary.trim(),
      duties: duties
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      requirements: reqs
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onAdd(job);
    onClose();
  };

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true">
      <div className="auth-modal" style={{ width: "min(820px,96vw)" }}>
        <div className="auth-head">
          <div style={{ fontWeight: 600 }}>Добавить вакансию</div>
          <button className="auth-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="auth-body" onSubmit={submit}>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Профессия / Должность*</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Frontend Developer" />
            </div>
            <div className="field">
              <label>Город*</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Алматы" />
            </div>
            <div className="field">
              <label>Стаж / Требуемый опыт</label>
              <input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="от 2 лет / Middle" />
            </div>
            <div className="field">
              <label>График / Формат</label>
              <input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Полный день / Гибрид / Full Remote" />
            </div>
            <div className="field" style={{ gridColumn: "span 2" }}>
              <label>Зарплата</label>
              <input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="до 900 000 ₸" />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Обязанности (каждая строка — отдельный пункт)</label>
              <textarea
                rows={5}
                style={{ resize: "vertical", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 12, background: "transparent", color: "var(--text)" }}
                value={duties}
                onChange={(e) => setDuties(e.target.value)}
                placeholder={`коммуникация с клиентами\nотчётность в CRM\nсовместная работа с командой`}
              />
            </div>
            <div className="field">
              <label>Требования (списком)</label>
              <textarea
                rows={5}
                style={{ resize: "vertical", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 12, background: "transparent", color: "var(--text)" }}
                value={reqs}
                onChange={(e) => setReqs(e.target.value)}
                placeholder={`дисциплина\nобучаемость\nответственность`}
              />
            </div>
          </div>

          {error && <div className="auth-error" style={{ marginTop: 8 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========= ПРЕДПРОСМОТР КАНДИДАТА ========= */
// (без изменений — как у тебя было)
function CandidatePreview({ open, onClose, candidate }) {
  /* ... твой прежний код CandidatePreview ... */
}

/* ========= SMARTBOT ========= */
// (оставил твою улучшенную версию с универсальным парсером ответа)
function SmartBotModal({ open, onClose, job, candidate = null }) {
  /* ... твой полный код SmartBotModal без изменений ... */
}

/* ========= ТАБЛИЦА ОТКЛИКОВ ========= */
function EmployerTable() {
  /* ... твой прежний код EmployerTable (с Обновить/Очистить/Скачать PDF) ... */
}

/* ========= ОСНОВНАЯ СТРАНИЦА ========= */
export default function Page() {
  const [theme, setTheme] = useState("light");

  // >>> заменяем константу JOBS на состояние jobs (с персистом)
  const [jobs, setJobs] = useState(JOBS_DEFAULT);

  const [view, setView] = useState("jobs"); // jobs | employer
  const [mode, setMode] = useState("find_job"); // find_job | find_employee
  const [modalOpen, setModalOpen] = useState(false);
  const [job, setJob] = useState(JOBS_DEFAULT[0]);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [q, setQ] = useState("");
  const [candOpen, setCandOpen] = useState(false);
  const [cand, setCand] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addJobOpen, setAddJobOpen] = useState(false); // <<< новая модалка
  const [candidates, setCandidates] = useState(SEED_CANDIDATES);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme);

    // кандидаты
    const savedC = localStorage.getItem("jb_candidates");
    if (savedC) {
      try {
        setCandidates(JSON.parse(savedC));
      } catch {
        setCandidates(SEED_CANDIDATES);
      }
    } else {
      localStorage.setItem("jb_candidates", JSON.stringify(SEED_CANDIDATES));
      setCandidates(SEED_CANDIDATES);
    }

    // >>> вакансии
    const savedJ = localStorage.getItem("jb_jobs");
    if (savedJ) {
      try {
        const js = JSON.parse(savedJ);
        setJobs(js);
        if (js.length) setJob(js[0]);
      } catch {
        setJobs(JOBS_DEFAULT);
      }
    } else {
      localStorage.setItem("jb_jobs", JSON.stringify(JOBS_DEFAULT));
      setJobs(JOBS_DEFAULT);
    }

    const cur = localStorage.getItem("jb_current");
    if (cur) {
      try {
        const u = JSON.parse(cur);
        setUser(u);
        if (u.role === "applicant") setView("jobs");
      } catch {}
    }
  }, []);

  const persistCandidates = (arr) => {
    setCandidates(arr);
    localStorage.setItem("jb_candidates", JSON.stringify(arr));
  };

  const persistJobs = (arr) => {
    setJobs(arr);
    localStorage.setItem("jb_jobs", JSON.stringify(arr));
  };

  const handleAddCandidate = (c) => {
    const next = [c, ...candidates];
    persistCandidates(next);
  };

  const handleAddJob = (j) => {
    const next = [j, ...jobs];
    persistJobs(next);
    setJob(j);
  };

  const switchTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const logout = () => {
    localStorage.removeItem("jb_current");
    setUser(null);
    setView("jobs");
  };

  // поиск
  const filteredJobs = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return jobs;
    return jobs.filter((j) => [j.title, j.city, j.format, j.exp, j.salary, (j.duties || []).join(" "), (j.requirements || []).join(" ")].join(" ").toLowerCase().includes(t));
  }, [q, jobs]);

  const filteredCandidates = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return candidates;
    return candidates.filter((c) => [c.name, c.profession, c.country, c.city, c.desiredSalary, c.experience].join(" ").toLowerCase().includes(t));
  }, [q, candidates]);

  const canSeeEmployer = !user || user.role === "employer";

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <div className="logo">JobBoard</div>

          <div className="mode">
            <button className={clsx("seg", mode === "find_job" && "seg-active")} onClick={() => setMode("find_job")}>
              Найти работу
            </button>
            <button className={clsx("seg", mode === "find_employee" && "seg-active")} onClick={() => setMode("find_employee")}>
              Найти сотрудника
            </button>
          </div>

          <div className="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={mode === "find_job" ? "Поиск вакансий…" : "Поиск по соискателям…"} />
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
            <button onClick={switchTheme} title="Светлая/тёмная тема">
              Тема
            </button>
            {!user ? (
              <button className="btn btn-outline" onClick={() => setAuthOpen(true)}>
                Войти
              </button>
            ) : (
              <div className="userbox">
                <div className="avatar">{(user.firstName || "U").slice(0, 1).toUpperCase()}</div>
                <div className="uinfo">
                  <div className="uname">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="umail">
                    {user.email} • {user.role === "employer" ? "Работодатель" : "Соискатель"}
                  </div>
                </div>
                <button className="btn btn-outline" onClick={logout}>
                  Выход
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div>
            <h1>{mode === "find_job" ? "Найдите работу мечты" : "Найдите подходящего сотрудника"}</h1>
            <p>{mode === "find_job" ? "Лаконичный интерфейс, быстрый отклик и умный скрининг через SmartBot." : "Смотрите карточки соискателей, открывайте резюме и изучайте опыт. Работодатели могут добавлять новых соискателей и вакансии."}</p>
          </div>
          <div className="pill">Демо-версия (фронтенд only)</div>
        </section>

        {/* === Найти работу === */}
        {mode === "find_job" && (
          <>
            {view === "jobs" && (
              <section>
                <div className="card" style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="title" style={{ margin: 0 }}>
                    Список вакансий
                  </div>
                  {user?.role === "employer" && (
                    <button className="btn btn-primary" onClick={() => setAddJobOpen(true)}>
                      Добавить вакансию
                    </button>
                  )}
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="card" style={{ color: "var(--muted)" }}>
                    Ничего не найдено. Измените запрос.
                  </div>
                ) : (
                  <div className="grid">
                    {filteredJobs.map((j, idx) => (
                      <article className={clsx("card", idx < 2 ? "col-6" : "col-4")} key={j.id}>
                        <h3 className="title">{j.title}</h3>
                        <div className="meta">
                          <span className="pill">{j.city}</span>
                          <span className="pill">{j.exp || "опыт не указан"}</span>
                          <span className="pill">{j.format || "формат не указан"}</span>
                          {j.salary && <span className="pill">{j.salary}</span>}
                        </div>
                        <div className="row">
                          <div>
                            <strong>Обязанности:</strong>{" "}
                            {Array.isArray(j.duties) && j.duties.length ? j.duties.join(", ") : "коммуникация, отчётность, командная работа"}
                          </div>
                          <div>
                            <strong>Требования:</strong>{" "}
                            {Array.isArray(j.requirements) && j.requirements.length ? j.requirements.join(", ") : "дисциплина, обучаемость, ответственность"}
                          </div>
                        </div>
                        <div className="actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setJob(j);
                              setModalOpen(true);
                            }}
                          >
                            Откликнуться
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => {
                              setJob(j);
                              setModalOpen(true);
                            }}
                          >
                            Быстрый отклик
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {view === "employer" && canSeeEmployer && (
              <section>
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 className="title" style={{ marginBottom: 8 }}>
                    Отклики SmartBot (лучшие сверху)
                  </h3>
                  <p className="muted" style={{ color: "var(--muted)", margin: 0 }}>
                    Отсюда можно анализировать релевантность.
                  </p>
                </div>
                <EmployerTable />
              </section>
            )}
          </>
        )}

        {/* === Найти сотрудника === */}
        {mode === "find_employee" && (
          <section>
            <div className="card" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="title" style={{ margin: 0 }}>
                Список соискателей
              </div>
              {user?.role === "employer" && (
                <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
                  Добавить соискателя
                </button>
              )}
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="card" style={{ color: "var(--muted)" }}>Соискатели не найдены.</div>
            ) : (
              <div className="grid">
                {filteredCandidates.map((c) => (
                  <article className="card col-6" key={c.id}>
                    <h3 className="title">{c.name}</h3>
                    <div className="meta">
                      <span className="pill">{c.profession}</span>
                      <span className="pill">
                        {c.country}, {c.city}
                      </span>
                      <span className="pill">Желаемая: {c.desiredSalary || "—"}</span>
                      <span className="pill">Опыт: {c.experience || "—"}</span>
                    </div>
                    <div className="actions">
                      <button className="btn btn-primary" onClick={() => { setCand(c); setCandOpen(true); }}>
                        Предпросмотр
                      </button>

                      {user?.role === "employer" && (
                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            setJob(jobs[0] || JOBS_DEFAULT[0]);
                            setCand(c);
                            setModalOpen(true);
                          }}
                        >
                          Оценить SmartBot
                        </button>
                      )}

                      {c.email && (
                        <a className="btn btn-outline" href={`mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent("Предложение сотрудничества")}`}>
                          Написать
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <p className="foot">© 2025 JobBoard Demo. Данные на странице — демонстрационные (кандидаты и вакансии сохраняются в вашем браузере).</p>
      </div>

      {/* Модалки */}
      <SmartBotModal
        open={modalOpen}
        job={job}
        candidate={cand}
        onClose={() => {
          setModalOpen(false);
          setCand(null);
        }}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={(u) => { setUser(u); if (u.role === "applicant") setView("jobs"); }} />
      <CandidatePreview open={candOpen} onClose={() => setCandOpen(false)} candidate={cand} />
      <AddCandidateModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={(c) => handleAddCandidate(c)} />
      <AddJobModal open={addJobOpen} onClose={() => setAddJobOpen(false)} onAdd={(j) => handleAddJob(j)} />

      {/* Стили */}
      <style jsx global>{`
        :root{
          --bg:#f6f8fb; --card:#fff; --text:#0f172a; --muted:#64748b; --brand:#2563eb; --brand-600:#1e4ed8; --line:#e2e8f0; --pill:#eff6ff;
          --chip-blue:#1e3a8a; --shadow:0 4px 16px rgba(2,8,23,.04); --shadow-lg:0 10px 28px rgba(2,8,23,.08); --overlay:rgba(2,8,23,.5);
          --table-stripe:#fafafa; --good-bg:#ecfdf5; --good-br:#a7f3d0; --good-t:#065f46; --warn-bg:#fffbeb; --warn-br:#fde68a; --warn-t:#92400e; --bad-bg:#fef2f2; --bad-br:#fecaca; --bad-t:#991b1b;
        }
        [data-theme="dark"]{
          --bg:#0b1220; --card:#0f172a; --text:#e5efff; --muted:#94a3b8; --line:#1e293b; --pill:#0b2a57; --chip-blue:#93c5fd;
          --shadow:0 4px 16px rgba(0,0,0,.3); --shadow-lg:0 10px 28px rgba(0,0,0,.45); --overlay:rgba(0,0,0,.6); --table-stripe:#0b1627;
        }
        *{box-sizing:border-box}
        html,body{margin:0;height:100%}
        body{font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text)}
        a{text-decoration:none;color:inherit}
        .container{max-width:1100px;margin:0 auto;padding:24px} /* фикс "авто" -> auto */
        .header{position:sticky;top:0;z-index:10;backdrop-filter:saturate(1.3) blur(6px);background:rgba(255,255,255,.85);border-bottom:1px solid var(--line)}
        [data-theme="dark"] .header{background:rgba(15,23,42,.8)}
        .header-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:10px 16px}
        .logo{font-weight:700}
        .mode{margin-left:8px;display:flex;border:1px solid var(--line);border-radius:12px;overflow:hidden}
        .seg{border:none;background:transparent;padding:8px 12px;font-weight:600;color:var(--muted);cursor:pointer}
        .seg-active{background:rgba(37,99,235,.08);color:var(--text)}
        .search{margin-left:12px;flex:1;max-width:520px}
        .search input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:transparent;color:var(--text);font-size:14px}
        .nav{margin-left:auto;display:flex;gap:8px;align-items:center}
        .nav button{font-size:14px;color:var(--muted);border:none;background:transparent;padding:8px 10px;border-radius:10px;cursor:pointer}
        .nav button.active{color:var(--text);background:rgba(37,99,235,.08)}
        .userbox{display:flex;align-items:center;gap:10px;margin-left:8px}
        .avatar{width:32px;height:32px;border-radius:50%;background:#e2e8f0;color:#0f172a;display:flex;align-items:center;justify-content:center;font-weight:700}
        [data-theme="dark"] .avatar{background:#1e293b;color:#e5efff}
        .uinfo{display:flex;flex-direction:column;line-height:1}
        .uname{font-weight:600;font-size:13px}
        .umail{font-size:12px;color:var(--muted)}
        .hero{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:24px 0}
        .hero h1{margin:0 0 6px 0;font-size:28px}
        .hero p{margin:0;color:var(--muted)}
        .grid{display:grid;gap:16px;grid-template-columns:repeat(12,1fr)}
        .col-6{grid-column:span 6}.col-4{grid-column:span 4}
        @media (max-width:900px){.col-6,.col-4{grid-column:span 12}.hero{flex-direction:column;align-items:flex-start}}
        .card{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:18px;transition:box-shadow .2s, transform .15s}
        .card:hover{box-shadow:var(--shadow-lg);transform:translateY(-1px)}
        .title{font-weight:600;margin:0 0 6px 0}
        .meta{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
        .pill{background:var(--pill); color:#1e3a8a; border:1px solid #dbeafe; padding:6px 10px; border-radius:999px; font-size:12px}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;color:var(--muted);font-size:14px}
        .actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
        .btn{border:none;cursor:pointer;border-radius:12px;padding:10px 14px;font-weight:600;font-size:14px;transition:filter .15s, background .2s, border-color .2s}
        .btn-primary{background:var(--brand); color:#fff}.btn-primary:hover{background:#1e4ed8}
        .btn-outline{background:transparent;border:1px solid var(--brand); color:var(--brand)}.btn-outline:hover{background:rgba(37,99,235,.08)}
        .foot{margin:40px 0 20px;color:var(--muted);font-size:13px;text-align:center}
        .table{width:100%;border-collapse:collapse;border:1px solid var(--line);border-radius:12px;overflow:hidden}
        .table th,.table td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;font-size:14px}
        .table th{background:#f8fafc;color:var(--muted);font-weight:600}
        [data-theme="dark"] .table th{background:#0b1424}
        .table tr:nth-child(even){background:var(--table-stripe)}
        .badge{padding:4px 8px;border-radius:999px;font-weight:600;font-size:12px;color:#fff}
        .b-good{background:#10b981}.b-warn{background:#f59e0b}.b-bad{background:#ef4444}
        .grid .field{display:flex;flex-direction:column;gap:6px}
      `}</style>
    </>
  );
}

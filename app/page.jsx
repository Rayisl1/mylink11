"use client";
import { useEffect, useState } from "react";

/* ========= ДАННЫЕ ДЛЯ КАРТОЧЕК ========= */
const JOBS = [
  { id: 1, title: "Менеджер по продажам", city: "Алматы", exp: "от 2 лет", format: "Полный день", salary: "от 300 000 ₸" },
  { id: 2, title: "Маркетолог Performance", city: "Астана", exp: "от 3 лет", format: "Гибрид", salary: "от 600 000 ₸" },
  { id: 3, title: "UI/UX Дизайнер", city: "Шымкент", exp: "от 2 лет", format: "Гибрид", salary: "" },
  { id: 4, title: "Backend Developer (Node.js)", city: "Алматы", exp: "Middle+", format: "Full Remote", salary: "" },
  { id: 5, title: "Product Manager", city: "Астана", exp: "Senior", format: "Офис", salary: "" }
];

/* ========= ВСПОМОГАТЕЛЬНОЕ ========= */
const clsx = (...xs) => xs.filter(Boolean).join(" ");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

/* ========= DENSER AI МОДАЛ (IFRAME) ========= */
function DenserModal({ open, onClose, job }) {
  if (!open) return null;

  // Можно пробрасывать контекст вакансии в query (если захочешь читать в Denser):
  const src = `https://denser.ai/u/embed/chatbot_m4fa8am5rdvu83c041mj7?job=${encodeURIComponent(
    `${job?.title || ""} • ${job?.city || ""} • ${job?.exp || ""} • ${job?.format || ""}`
  )}`;

  return (
    <div className="sb-backdrop" role="dialog" aria-modal="true">
      <div className="sb-modal" style={{ width: "min(820px,94vw)", height: "82vh" }}>
        <div className="sb-head">
          <div className="sb-title">🤖 Denser AI — {job?.title || "SmartBot"}</div>
          <button className="sb-close" onClick={onClose}>×</button>
        </div>
        <iframe
          src={src}
          width="100%"
          height="100%"
          title="Denser SmartBot"
          style={{ border: "none", flexGrow: 1 }}
          allow="clipboard-write; microphone; camera"
        />
      </div>

      {/* Локальные стили модалки */}
      <style jsx global>{`
        .sb-backdrop{position:fixed;inset:0;background:rgba(2,8,23,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
        .sb-modal{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 60px rgba(2,8,23,.25);display:flex;flex-direction:column;overflow:hidden}
        .sb-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f1f5f9;border-bottom:1px solid var(--line)}
        [data-theme="dark"] .sb-head{background:#0b1424}
        .sb-title{font-weight:600}
        .sb-close{border:none;background:transparent;font-size:22px;cursor:pointer;color:#475569}
      `}</style>
    </div>
  );
}

/* ========= ТАБЛИЦА РАБОТОДАТЕЛЯ ========= */
function EmployerTable() {
  const [rows, setRows] = useState([]);

  const load = () => {
    const data = JSON.parse(localStorage.getItem("smartbot_candidates") || "[]").slice().reverse();
    setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const exportCSV = () => {
    if (!rows.length) {
      alert("Нет данных для экспорта");
      return;
    }
    const headers = ["name", "city", "exp", "format", "score", "jobId", "jobTitle", "date"];
    const lines = [headers.join(",")];
    rows.forEach((o) => {
      const row = headers
        .map((k) => `"${(o[k] ?? "").toString().replace(/"/g, '""')}"`)
        .join(",");
      lines.push(row);
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `smartbot_candidates_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
              <th>Имя</th>
              <th>Вакансия</th>
              <th>Релевантность</th>
              <th>Индикатор</th>
              <th>Ответы</th>
              <th>Дата</th>
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
                <td>
                  <span className={clsx("badge", tone(Number(r.score) || 0))}>
                    {Number(r.score) || 0}%
                  </span>
                </td>
                <td>
                  <div style={{ height: 8, background: "var(--line)", borderRadius: 999, overflow: "hidden", width: 140 }}>
                    <div
                      style={{
                        height: 8,
                        width: `${Math.max(0, Math.min(100, Number(r.score) || 0))}%`,
                        background: "#60a5fa"
                      }}
                    />
                  </div>
                </td>
                <td style={{ color: "var(--muted)", fontSize: 13 }}>
                  город: {esc(r.city || "-")}; опыт: {esc(r.exp || "-")}; формат: {esc(r.format || "-")}
                </td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>
                  {new Date(r.date).toLocaleString()}
                </td>
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

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.body.setAttribute("data-theme", saved);
  }, []);

  const switchTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const openSmartBot = (j) => {
    setJob(j);
    setModalOpen(true);
  };

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <div className="logo">JobBoard</div>
          <div className="nav">
            <button
              className={clsx(view === "jobs" && "active")}
              onClick={() => setView("jobs")}
            >
              Вакансии
            </button>
            <button
              className={clsx(view === "employer" && "active")}
              onClick={() => setView("employer")}
            >
              Работодатель
            </button>
            <button onClick={switchTheme} title="Светлая/тёмная тема">Тема</button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div>
            <h1>Найдите работу мечты</h1>
            <p>Лаконичный интерфейс, быстрый отклик и умный скрининг через SmartBot.</p>
          </div>
          <div className="pill">Демо-версия</div>
        </section>

        {/* ВАКАНСИИ */}
        {view === "jobs" && (
          <section>
            <div className="grid">
              {JOBS.slice(0, 2).map((j) => (
                <article className="card col-6" key={j.id}>
                  <h3 className="title">{j.title}</h3>
                  <div className="meta">
                    <span className="pill">{j.city}</span>
                    <span className="pill">{j.exp}</span>
                    <span className="pill">{j.format}</span>
                    {j.salary && <span className="pill">{j.salary}</span>}
                  </div>
                  <div className="row">
                    <div><strong>Обязанности:</strong> работа с лидами, звонки, CRM</div>
                    <div><strong>Требования:</strong> уверенная речь, дисциплина</div>
                  </div>
                  <div className="actions">
                    <button className="btn btn-primary" onClick={() => openSmartBot(j)}>Откликнуться</button>
                    <button className="btn btn-outline" onClick={() => openSmartBot(j)}>Быстрый отклик</button>
                  </div>
                </article>
              ))}

              {JOBS.slice(2).map((j) => (
                <article className="card col-4" key={j.id}>
                  <h3 className="title">{j.title}</h3>
                  <div className="meta">
                    <span className="pill">{j.city}</span>
                    <span className="pill">{j.exp}</span>
                    <span className="pill">{j.format}</span>
                  </div>
                  <div className="actions">
                    <button className="btn btn-primary" onClick={() => openSmartBot(j)}>Откликнуться</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* РАБОТОДАТЕЛЬ */}
        {view === "employer" && (
          <section>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 className="title" style={{ marginBottom: 8 }}>Отклики SmartBot</h3>
              <p className="muted" style={{ color: "var(--muted)", margin: 0 }}>
                Здесь появляются кандидаты после прохождения скрининга в виджете (если используешь локальный виджет).
              </p>
            </div>
            <EmployerTable />
          </section>
        )}

        <p className="foot">© 2025 JobBoard Demo.</p>
      </div>

      {/* Denser AI modal */}
      <DenserModal open={modalOpen} job={job} onClose={() => setModalOpen(false)} />

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
        .container{max-width:1100px;margin:0 auto;padding:24px}
        /* Header */
        .header{position:sticky;top:0;z-index:10;backdrop-filter:saturate(1.3) blur(6px);background:rgba(255,255,255,.85);border-bottom:1px solid var(--line)}
        [data-theme="dark"] .header{background:rgba(15,23,42,.8)}
        .header-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:16px;padding:12px 24px}
        .logo{font-weight:700}
        .nav{margin-left:auto;display:flex;gap:10px}
        .nav button{font-size:14px;color:var(--muted);border:none;background:transparent;padding:8px 10px;border-radius:10px;cursor:pointer}
        .nav button.active{color:var(--text);background:rgba(37,99,235,.08)}
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
        .pill{background:var(--pill); color:#1e3a8a; border:1px solid #dbeafe; padding:6px 10px; border-radius:999px; font-size:12px}
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

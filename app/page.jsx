"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/* ========= ВАКАНСИИ (seed) ========= */
const SEED_JOBS = [
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
const SEED_CANDIDATES = [
  {
    id: "c1",
    name: "Darkhan Serikbay",
    profession: "Research Assistant — Social Robotics / Full-Stack Trainee",
    desiredSalary: "от 400 000 ₸",
    country: "Казахстан",
    city: "Астана",
    experience: "1 год 1 месяц",
    email: "aruzhan@example.com",
    resumeUrl: "#",
    work: [
      { period: "авг 2025 — наст. время", company: "HRI Lab at Nazarbayev University", title: "Research Assistant – Social Robotics Projects" },
      { period: "апр 2025 — наст. время", company: "NU ACM Student Chapter", title: "Vice Chair – ACM-W Student Chapter" },
      { period: "июн 2025 — авг 2025", company: "nFactorial Incubator", title: "Full-Stack Development Trainee" },
      { period: "июн 2025 — авг 2025", company: "Novators LLP", title: "Software Development Intern" },
    ],
    education: [{ degree: "Бакалавр", place: "Nazarbayev University", field: "Computer Science" }],
  },
  {
    id: "c2",
    name: "Bakhtiyar Koishin",
    profession: "Frontend Developer (React/Next.js)",
    desiredSalary: "от 800 000 ₸",
    country: "Казахстан",
    city: "Алматы",
    experience: "3 года",
    email: "dias.front@example.com",
    resumeUrl: "#",
    work: [
      { period: "2023 — 2025", company: "FinTech KZ", title: "Frontend Developer (React, Next.js, Tailwind)" },
      { period: "2022 — 2023", company: "Retail Cloud", title: "Junior Frontend Developer" },
    ],
    education: [{ degree: "Бакалавр", place: "SDU", field: "Information Systems" }],
  },
  {
    id: "c3",
    name: "Nurislam Aldabergenuly",
    profession: "HR Generalist",
    desiredSalary: "от 1 000 000 ₸",
    country: "Казахстан",
    city: "Караганда",
    experience: "2+ года",
    email: "nurss.aldb@gmail.com",
    resumeUrl: "#",
    work: [
      { period: "2024 — 2025", company: "TechStart", title: "HR Generalist" },
      { period: "2023 — 2024", company: "MarketLab", title: "HR Specialist" },
    ],
    education: [{ degree: "Бакалавр", place: "ENU", field: "Психология" }],
  },
  {
    id: "c4",
    name: "Islam Turganbay",
    profession: "Backend Developer (Node.js/NestJS)",
    desiredSalary: "от 900 000 ₸",
    country: "Казахстан",
    city: "Астана",
    experience: "4 года",
    email: "maksat.backend@example.com",
    resumeUrl: "#",
    work: [
      { period: "2022 — 2025", company: "Gov Digital", title: "Backend Engineer (Node.js, PostgreSQL, Redis)" },
      { period: "2020 — 2022", company: "ERP Systems", title: "Software Engineer" },
    ],
    education: [{ degree: "Бакалавр", place: "ENU", field: "Информатика" }],
  },
  { id: "c5", name: "Elina Karim", profession: "UI/UX Designer", desiredSalary: "от 600 000 ₸", country: "Казахстан", city: "Алматы", experience: "2 года", email: "elina.uiux@example.com", resumeUrl: "#", work: [{ period: "2023 — 2025", company: "E-comm Group", title: "Product Designer" }, { period: "2022 — 2023", company: "Creative Studio", title: "Junior UI/UX Designer" }], education: [{ degree: "Бакалавр", place: "KBTU", field: "Digital Design" }]},
  { id: "c6", name: "Nurlan Seitov", profession: "DevOps Engineer (AWS/K8s)", desiredSalary: "от 1 200 000 ₸", country: "Казахстан", city: "Алматы", experience: "5 лет", email: "nurlan.devops@example.com", resumeUrl: "#", work: [{ period: "2021 — 2025", company: "CloudOps KZ", title: "DevOps Engineer" }, { period: "2019 — 2021", company: "MediaTech", title: "SysAdmin → DevOps" }], education: [{ degree: "Бакалавр", place: "IITU", field: "Computer Engineering" }]},
  { id: "c7", name: "Dana Kudaibergen", profession: "Data Analyst / BI", desiredSalary: "от 700 000 ₸", country: "Казахстан", city: "Астана", experience: "2 года", email: "dana.bi@example.com", resumeUrl: "#", work: [{ period: "2023 — 2025", company: "Retail Analytics", title: "Data Analyst (SQL, Power BI, Python)" }], education: [{ degree: "Бакалавр", place: "NU", field: "Mathematics" }]},
  { id: "c8", name: "Adil Rakhim", profession: "SMM / Content", desiredSalary: "от 350 000 ₸", country: "Казахстан", city: "Алматы", experience: "1.5 года", email: "adil.smm@example.com", resumeUrl: "#", work: [{ period: "2024 — 2025", company: "Fashion Hub", title: "SMM Specialist" }, { period: "2023 — 2024", company: "Startup Media", title: "Content Creator" }], education: [{ degree: "Бакалавр", place: "KazNU", field: "Журналистика" }]},
  { id: "c9", name: "Aruzhan Yesen", profession: "QA Engineer", desiredSalary: "от 600 000 ₸", country: "Казахстан", city: "Караганда", experience: "3 года", email: "aruzhan.qa@example.com", resumeUrl: "#", work: [{ period: "2022 — 2025", company: "MobileSoft", title: "QA Engineer (Manual+API, Postman)" }], education: [{ degree: "Бакалавр", place: "KarSU", field: "CS" }]},
  { id: "c10", name: "Samat Alimov", profession: "Product Manager", desiredSalary: "от 1 000 000 ₸", country: "Казахстан", city: "Астана", experience: "4+ года", email: "samat.pm@example.com", resumeUrl: "#", work: [{ period: "2023 — 2025", company: "PayTech", title: "Product Manager" }, { period: "2021 — 2023", company: "Marketplace", title: "Associate PM" }], education: [{ degree: "Бакалавр", place: "KIMEP", field: "Business & IT" }]},
  { id: "c11", name: "Aizada Utepova", profession: "HR Generalist / Talent Acquisition", desiredSalary: "от 550 000 ₸", country: "Казахстан", city: "Алматы", experience: "2 года", email: "aizada.hr@example.com", resumeUrl: "#", work: [{ period: "2023 — 2025", company: "TechHub", title: "HR Generalist" }], education: [{ degree: "Бакалавр", place: "ALMAU", field: "Human Resources" }]},
  { id: "c12", name: "Timur Bayandin", profession: "Sales Manager (B2B)", desiredSalary: "от 500 000 ₸ + бонус", country: "Казахстан", city: "Алматы", experience: "3+ года", email: "timur.sales@example.com", resumeUrl: "#", work: [{ period: "2022 — 2025", company: "SaaS Pro", title: "B2B Sales Manager (CRM, холодные/тёплые лиды)" }], education: [{ degree: "Бакалавр", place: "KazGU", field: "Маркетинг" }]},
];

/* ========= HELPERS ========= */
const clsx = (...xs) => xs.filter(Boolean).join(" ");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

/* ========= AUTH ========= */
function AuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [birth,     setBirth]     = useState("");
  const [role,      setRole]      = useState("applicant");
  const [email,     setEmail]     = useState("");
  const [pass,      setPass]      = useState("");
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("login"); setFirstName(""); setLastName(""); setBirth(""); setRole("applicant");
    setEmail(""); setPass(""); setError("");
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
      if (!lastName.trim())  return setError("Введите фамилию");
      if (!validBirth(birth)) return setError("Дата рождения в формате дд.мм.гггг");
      if (!email.includes("@") || !email.endsWith("@gmail.com")) return setError("Введите корректный Gmail");
      if (pass.length < 4) return setError("Минимум 4 символа");
      if (users[email]) return setError("Пользователь уже существует");
      const user = { firstName: firstName.trim(), lastName: lastName.trim(), birth, role, email, passHash: hash };
      users[email] = user;
      localStorage.setItem("jb_users", JSON.stringify(users));
      localStorage.setItem("jb_current", JSON.stringify(user));
      onAuth(user); onClose(); return;
    }
    const u = users[email];
    if (!u || u.passHash !== hash) return setError("Неверный email или пароль");
    localStorage.setItem("jb_current", JSON.stringify(u));
    onAuth(u); onClose();
  };

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true">
      <div className="auth-modal">
        <div className="auth-head">
          <div className="auth-tabs">
            <button className={clsx("auth-tab", mode === "login" && "active")} onClick={() => setMode("login")}>Вход</button>
            <button className={clsx("auth-tab", mode === "register" && "active")} onClick={() => setMode("register")}>Регистрация</button>
          </div>
          <button className="auth-close" onClick={onClose}>×</button>
        </div>
        <form className="auth-body" onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="field"><label>Имя</label><input value={firstName} onChange={(e)=>setFirstName(e.target.value)} placeholder="Иван"/></div>
              <div className="field"><label>Фамилия</label><input value={lastName} onChange={(e)=>setLastName(e.target.value)} placeholder="Иванов"/></div>
              <div className="field"><label>Дата рождения (дд.мм.гггг)</label><input value={birth} onChange={(e)=>setBirth(e.target.value)} placeholder="31.12.2000"/></div>
            </>
          )}
          <div className="field"><label>Gmail</label><input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@gmail.com"/></div>
          <div className="field"><label>Пароль</label><input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="••••"/></div>
          {mode === "register" && (
            <div className="field">
              <label>Роль</label>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <label className="radio"><input type="radio" name="role" value="applicant" checked={role==="applicant"} onChange={()=>setRole("applicant")}/> Соискатель</label>
                <label className="radio"><input type="radio" name="role" value="employer" checked={role==="employer"} onChange={()=>setRole("employer")}/> Работодатель</label>
              </div>
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-primary" type="submit" style={{width:"100%",marginTop:8}}>{mode==="login"?"Войти":"Зарегистрироваться"}</button>
          <div className="muted" style={{marginTop:12,fontSize:12}}>Демоверсия: данные только в вашем браузере.</div>
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

/* ========= МОДАЛКА «ДОБАВИТЬ СОИСКАТЕЛЯ» ========= */
function AddCandidateModal({ open, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [country, setCountry] = useState("Казахстан");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [email, setEmail] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [workText, setWorkText] = useState("");
  const [eduText, setEduText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(""); setProfession(""); setDesiredSalary("");
    setCountry("Казахстан"); setCity(""); setExperience("");
    setEmail(""); setResumeUrl(""); setWorkText(""); setEduText(""); setError("");
  }, [open]);

  if (!open) return null;

  const parseWork = (txt) =>
    txt.split("\n").map(s=>s.trim()).filter(Boolean).map(line=>{
      const [period, company, title] = line.split("|").map(x=>x?.trim()||"");
      return { period, company, title };
    });

  const parseEdu = (txt) =>
    txt.split("\n").map(s=>s.trim()).filter(Boolean).map(line=>{
      const [degree, place, field] = line.split("|").map(x=>x?.trim()||"");
      return { degree, place, field };
    });

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Укажите ФИО");
    if (!profession.trim()) return setError("Укажите профессию");
    if (!city.trim()) return setError("Укажите город");
    const c = {
      id: "c_" + Math.random().toString(36).slice(2,9),
      name: name.trim(),
      profession: profession.trim(),
      desiredSalary: desiredSalary.trim(),
      country: country.trim(),
      city: city.trim(),
      experience: experience.trim(),
      email: email.trim(),
      resumeUrl: resumeUrl.trim(),
      work: parseWork(workText),
      education: parseEdu(eduText),
    };
    onAdd(c);
    onClose();
  };

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true">
      <div className="auth-modal" style={{width:"min(820px,96vw)"}}>
        <div className="auth-head">
          <div style={{fontWeight:600}}>Добавить соискателя</div>
          <button className="auth-close" onClick={onClose}>×</button>
        </div>
        <form className="auth-body" onSubmit={submit}>
          <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div className="field"><label>ФИО*</label><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Иван Иванов"/></div>
            <div className="field"><label>Профессия*</label><input value={profession} onChange={(e)=>setProfession(e.target.value)} placeholder="Frontend Developer"/></div>
            <div className="field"><label>Желаемая зарплата</label><input value={desiredSalary} onChange={(e)=>setDesiredSalary(e.target.value)} placeholder="от 500 000 ₸"/></div>
            <div className="field"><label>Страна</label><input value={country} onChange={(e)=>setCountry(e.target.value)} placeholder="Казахстан"/></div>
            <div className="field"><label>Город*</label><input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Алматы"/></div>
            <div className="field"><label>Опыт</label><input value={experience} onChange={(e)=>setExperience(e.target.value)} placeholder="2 года"/></div>
            <div className="field"><label>Email</label><input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="user@example.com"/></div>
            <div className="field"><label>Ссылка на резюме (PDF/Drive)</label><input value={resumeUrl} onChange={(e)=>setResumeUrl(e.target.value)} placeholder="https://..."/></div>
          </div>

          <div className="field">
            <label>Опыт работы (каждая строка: <strong>period | company | title</strong>)</label>
            <textarea rows={6} style={{resize:"vertical", padding:"10px 12px", border:"1px solid var(--line)", borderRadius:12, background:"transparent", color:"var(--text)"}}
              value={workText} onChange={(e)=>setWorkText(e.target.value)}
              placeholder={`авг 2025 — наст. время | HRI Lab at Nazarbayev University | Research Assistant\nиюн 2025 — авг 2025 | nFactorial Incubator | Full-Stack Trainee`} />
          </div>

          <div className="field">
            <label>Образование (каждая строка: <strong>degree | place | field</strong>)</label>
            <textarea rows={4} style={{resize:"vertical", padding:"10px 12px", border:"1px solid var(--line)", borderRadius:12, background:"transparent", color:"var(--text)"}}
              value={eduText} onChange={(e)=>setEduText(e.target.value)}
              placeholder={`Бакалавр | Nazarbayev University | Computer Science`} />
          </div>

          {error && <div className="auth-error">{error}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========= МОДАЛКА «ДОБАВИТЬ ВАКАНСИЮ» ========= */
function AddJobModal({ open, onClose, onAdd }) {
  const [title,  setTitle]  = useState("");
  const [city,   setCity]   = useState("");
  const [exp,    setExp]    = useState("");
  const [format, setFormat] = useState("");
  const [salary, setSalary] = useState("");
  const [duties, setDuties] = useState("");
  const [reqs,   setReqs]   = useState("");
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(""); setCity(""); setExp(""); setFormat(""); setSalary(""); setDuties(""); setReqs(""); setError("");
  }, [open]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Укажите профессию / должность");
    if (!city.trim())  return setError("Укажите город");
    onAdd({
      id: "j_" + Math.random().toString(36).slice(2,9),
      title: title.trim(),
      city: city.trim(),
      exp: exp.trim(),
      format: format.trim(),
      salary: salary.trim(),
      duties: duties.split("\n").map(s=>s.trim()).filter(Boolean),
      reqs:   reqs.split("\n").map(s=>s.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true">
      <div className="auth-modal" style={{width:"min(820px,96vw)"}}>
        <div className="auth-head">
          <div style={{fontWeight:600}}>Добавить вакансию</div>
          <button className="auth-close" onClick={onClose}>×</button>
        </div>
        <form className="auth-body" onSubmit={submit}>
          <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div className="field"><label>Профессия / Должность*</label><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Frontend Developer"/></div>
            <div className="field"><label>Город*</label><input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Алматы"/></div>
            <div className="field"><label>Стаж / Требуемый опыт</label><input value={exp} onChange={(e)=>setExp(e.target.value)} placeholder="от 2 лет / Middle"/></div>
            <div className="field"><label>График / Формат</label><input value={format} onChange={(e)=>setFormat(e.target.value)} placeholder="Полный день / Гибрид / Full Remote"/></div>
            <div className="field" style={{gridColumn:"span 2"}}><label>Зарплата</label><input value={salary} onChange={(e)=>setSalary(e.target.value)} placeholder="до 900 000 ₸"/></div>
          </div>

          <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div className="field">
              <label>Обязанности (каждая строка — отдельный пункт)</label>
              <textarea rows={5} value={duties} onChange={(e)=>setDuties(e.target.value)}
                style={{resize:"vertical", padding:"10px 12px", border:"1px solid var(--line)", borderRadius:12, background:"transparent", color:"var(--text)"}}
                placeholder={`коммуникация с клиентами\nотчётность в CRM\nсовместная работа с командой`} />
            </div>
            <div className="field">
              <label>Требования (каждая строка — отдельный пункт)</label>
              <textarea rows={5} value={reqs} onChange={(e)=>setReqs(e.target.value)}
                style={{resize:"vertical", padding:"10px 12px", border:"1px solid var(--line)", borderRadius:12, background:"transparent", color:"var(--text)"}}
                placeholder={`дисциплина\nобучаемость\nответственность`} />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========= МОДАЛКА ПРЕДПРОСМОТРА СОИСКАТЕЛЯ ========= */
function CandidatePreview({ open, onClose, candidate }) {
  if (!open || !candidate) return null;
  return (
    <div className="sb-backdrop" role="dialog" aria-modal="true" aria-labelledby="cand-title">
      <div className="sb-modal" style={{width:"min(760px,94vw)"}}>
        <div className="sb-head">
          <div className="sb-title" id="cand-title">👤 Предпросмотр соискателя</div>
          <button className="sb-close" onClick={onClose}>×</button>
        </div>
        <div className="sb-body">
          <div className="card" style={{marginBottom:12}}>
            <h3 className="title" style={{marginBottom:6}}>{candidate.name}</h3>
            <div className="meta" style={{marginBottom:6}}>
              <span className="pill">{candidate.profession}</span>
              <span className="pill">{candidate.country}, {candidate.city}</span>
              <span className="pill">Желаемая: {candidate.desiredSalary || "—"}</span>
              <span className="pill">Опыт: {candidate.experience || "—"}</span>
            </div>
            <div className="actions" style={{marginTop:8}}>
              {candidate.resumeUrl && (
                <a className="btn btn-outline" href={candidate.resumeUrl} target="_blank" rel="noreferrer">Открыть резюме</a>
              )}
              {candidate.email && (
                <a className="btn btn-primary" href={`mailto:${encodeURIComponent(candidate.email)}?subject=${encodeURIComponent("Вакансия / предложение сотрудничества")}`}>
                  Написать кандидату
                </a>
              )}
            </div>
          </div>

          <div className="grid">
            <div className="card col-6">
              <h4 className="title" style={{marginBottom:8}}>Сведения о работе</h4>
              <ul style={{margin:0, paddingLeft:18}}>
                {candidate.work?.map((w, i) => (
                  <li key={i} style={{marginBottom:8}}>
                    <div style={{fontWeight:600}}>{w.title}</div>
                    <div style={{color:"var(--muted)"}}>{w.company}</div>
                    <div style={{fontSize:12, color:"var(--muted)"}}>{w.period}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card col-6">
              <h4 className="title" style={{marginBottom:8}}>Образование</h4>
              <ul style={{margin:0, paddingLeft:18}}>
                {candidate.education?.map((e, i) => (
                  <li key={i} style={{marginBottom:8}}>
                    <div style={{fontWeight:600}}>{e.degree}</div>
                    <div style={{color:"var(--muted)"}}>{e.place}</div>
                    <div style={{fontSize:12, color:"var(--muted)"}}>{e.field}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .sb-backdrop{position:fixed;inset:0;background:var(--overlay);display:flex;align-items:center;justify-content:center;z-index:60}
        .sb-modal{background:var(--card);border-radius:16px;border:1px solid var(--line);box-shadow:0 20px 60px rgba(2,8,23,.25);overflow:hidden}
        .sb-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f8fafc;border-bottom:1px solid var(--line)}
        [data-theme="dark"] .sb-head{background:#0b1424}
        .sb-title{font-weight:600}
        .sb-close{border:none;background:transparent;font-size:20px;line-height:1;cursor:pointer;color:#94a3b8}
        .sb-body{padding:12px 16px}
      `}</style>
    </div>
  );
}

/* ========= SMARTBOT (автоформула + Gemini API при диалоге) ========= */
function SmartBotModal({ open, onClose, job, candidate = null }) {
  const [messages, setMessages] = useState([]);
  const [replying, setReplying] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [signals, setSignals] = useState({ city: "неизвестно", exp: "неизвестно", format: "неизвестно" });
  const [finalScore, setFinalScore] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMessages([]); setSignals({ city: "неизвестно", exp: "неизвестно", format: "неизвестно" }); setFinalScore(null);

    if (candidate) {
      const score = computeAutoScore(candidate, job);
      setMessages([{ role: "assistant", content: `Автоматическая оценка кандидата «${candidate.name}» для вакансии «${job.title}»: ${score}%` }]);
      setSignals({ city: candidate.city || "неизвестно", exp: candidate.experience || "неизвестно", format: job.format || "неизвестно" });
      setFinalScore(score);
      saveApplication(score, candidate);
      return;
    }
    askGemini([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job?.id, candidate?.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function parseYears(text){ if(!text) return 0; const m=String(text).match(/(\d+(\.\d+)?)/); return m?Number(m[1]):0; }
  function scoreKeywordMatch(c, j){ const jt=(j.title||"").toLowerCase(); const pf=(c.profession||"").toLowerCase(); if(!jt||!pf) return 0; let s=0; if(pf.includes(jt)||jt.includes(pf)) s+=40; const ks=jt.split(/\W+/).filter(Boolean); let m=0; for(const k of ks) if(pf.includes(k)) m++; s+=Math.min(30,m*6); return s; }
  function computeAutoScore(c,j){ let score=50; if(c.city&&j.city&&c.city.toLowerCase()===j.city.toLowerCase()) score+=15; score+=scoreKeywordMatch(c,j);
    const cy=parseYears(c.experience); let ry=0; if(j.exp){ const m=String(j.exp).match(/(\d+)/); if(m) ry=Number(m[1]); else if(/senior/i.test(j.exp)) ry=5; else if(/middle\+?/i.test(j.exp)) ry=3; else if(/middle/i.test(j.exp)) ry=2; else if(/junior/i.test(j.exp)) ry=.5; }
    if(ry>0){ if(cy>=ry) score+=15; else score-=Math.min(20,(ry-cy)*6); }
    if(c.desiredFormat&&j.format&&c.desiredFormat.toLowerCase().includes(j.format.toLowerCase())) score+=5;
    return Math.round(Math.max(0,Math.min(100,score)));
  }

  function saveApplication(score, candParam=null){
    const all = JSON.parse(localStorage.getItem("smartbot_candidates") || "[]");
    const currentUser = JSON.parse(localStorage.getItem("jb_current") || "null");
    const candidateName = candParam ? candParam.name : (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Кандидат");
    const candidateEmail = candParam?.email || currentUser?.email || "";
    all.push({
      name: candidateName,
      email: candidateEmail,
      city: candParam?.city || signals.city,
      exp: candParam?.experience || signals.exp,
      format: signals.format,
      score: Number(score) || 0,
      jobId: job.id, jobTitle: job.title,
      date: new Date().toISOString(),
    });
    localStorage.setItem("smartbot_candidates", JSON.stringify(all));
  }

  async function askGemini(history){
    setReplying(true);
    try{
      const u = JSON.parse(localStorage.getItem("jb_current") || "null");
      const profile = u ? { name: `${u.firstName||""} ${u.lastName||""}`.trim(), city:"", experience:"", profession:"", preferredFormat:"" } : {};
      const res = await fetch("/api/assistant", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ history, vacancy:{ id:job.id, title:job.title, city:job.city, exp:job.exp, format:job.format }, profile })
      });
      if(!res.ok){ setMessages(a=>[...a,{role:"assistant",content:"Извините, сервер ассистента недоступен."}]); return; }
      const data = await res.json();
      const reply = data.reply ?? data.text ?? data.message ?? data.output ?? (typeof data==="string"?data:"") ?? "Готов продолжить скрининг.";
      const rawSignals = data.signals ?? data.meta?.signals ?? data.extracted ?? data.info ?? {};
      const norm = (v)=> (typeof v==="string"?v:(v?.value ?? v?.text ?? v ?? "неизвестно"));
      const nextSignals = { city:norm(rawSignals.city ?? signals.city ?? "неизвестно"), exp:norm(rawSignals.exp ?? rawSignals.experience ?? signals.exp ?? "неизвестно"), format:norm(rawSignals.format ?? signals.format ?? "неизвестно") };
      const final = data.final_score ?? data.finalScore ?? data.score ?? data.relevance ?? null;
      const done = data.next_action==="finish" || data.done===true || typeof final==="number";
      setMessages(a=>[...a,{role:"assistant",content:reply}]); setSignals(nextSignals);
      if(done && typeof final==="number"){ setFinalScore(final); saveApplication(final); setMessages(a=>[...a,{role:"assistant",content:`Итоговая релевантность: ${final}%`}]); }
    }catch{
      setMessages(a=>[...a,{role:"assistant",content:"Произошла ошибка соединения."}]);
    }finally{ setReplying(false); }
  }

  const sendUser = (text) => {
    const v = (text || "").trim();
    if (!v || replying) return;
    setMessages((arr)=>[...arr, { role:"user", content:v }]);
    const hist = [...messages, { role:"user", content:v }].filter(m=>m.role==="user"||m.role==="assistant").map(m=>({role:m.role, content:m.content}));
    askGemini(hist);
  };

  if (!open || !job) return null;

  return (
    <div className="sb-backdrop" role="dialog" aria-modal="true" aria-labelledby="sb-title">
      <div className="sb-modal">
        <div className="sb-head">
          <div className="sb-title" id="sb-title">🤖 SmartBot — AI-скрининг</div>
          <button className="sb-close" aria-label="Закрыть" onClick={onClose}>×</button>
        </div>
        <div className="sb-body">
          <div className="card" style={{marginBottom:12}}>
            <div className="title" style={{marginBottom:6}}>{job.title}</div>
            <div className="meta">
              <span className="pill">{job.city}</span>
              <span className="pill">{job.exp}</span>
              <span className="pill">{job.format}</span>
            </div>
            <div style={{fontSize:12, color:"var(--muted)"}}>
              Сигналы: город — <b>{signals.city}</b>, опыт — <b>{signals.exp}</b>, формат — <b>{signals.format}</b>
              {finalScore !== null && <> • Итог: <b>{finalScore}%</b></>}
            </div>
          </div>

          <div className="sb-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "assistant" ? "sb-bot" : "sb-user"}
                dangerouslySetInnerHTML={{ __html: `<b>${m.role === "assistant" ? "SmartBot" : "Вы"}:</b> ${esc(m.content)}` }}/>
            ))}
            {replying && !candidate && <div className="sb-bot"><b>SmartBot:</b> печатает…</div>}
          </div>

          {!candidate && (
            <div className="sb-input">
              <input ref={inputRef} type="text" placeholder="Введите ответ..." disabled={replying}
                onKeyDown={(e)=>{ if(e.key==="Enter"){ const v=e.currentTarget.value; e.currentTarget.value=""; sendUser(v);} }}/>
              <button disabled={replying} onClick={()=>{ const el=inputRef.current; const v=el?.value?.trim(); if(!v) return; el.value=""; sendUser(v); }}>
                Отправить
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .sb-backdrop{position:fixed;inset:0;background:var(--overlay);display:flex;align-items:center;justify-content:center;z-index:50}
        .sb-modal{width:min(760px,94vw);background:var(--card);border-radius:16px;border:1px solid var(--line);box-shadow:0 20px 60px rgba(2,8,23,.25);overflow:hidden}
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
      `}</style>
    </div>
  );
}

/* ========= ТАБЛИЦА ОТКЛИКОВ ========= */
function EmployerTable() {
  const [rows, setRows] = useState([]);
  const load = () => {
    const data = JSON.parse(localStorage.getItem("smartbot_candidates") || "[]")
      .slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0));
    setRows(data);
  };
  useEffect(()=>{ load(); }, []);
  const tone = (s)=> (s>=80?"b-good":s>=60?"b-warn":"b-bad");

  const clearAll = () => {
    if (!confirm("Очистить все результаты SmartBot?")) return;
    localStorage.removeItem("smartbot_candidates");
    setRows([]);
  };

  const exportPDF = () => {
    const html = `
<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8" />
<title>Отчёт SmartBot</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 16px 0;font-size:20px}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:left}th{background:#f3f4f6}.right{text-align:right}</style>
</head><body>
<h1>Отчёт SmartBot — релевантность кандидатов</h1>
<div style="font-size:12px;margin-bottom:10px;color:#555">Сформировано: ${new Date().toLocaleString()}</div>
<table><thead><tr><th>Имя</th><th>Email</th><th>Вакансия</th><th class="right">Релевантность</th><th>Город</th><th>Опыт</th><th>Дата</th></tr></thead>
<tbody>
${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.email||"-")}</td><td>${esc(r.jobTitle||"")}</td><td class="right">${Number(r.score)||0}%</td><td>${esc(r.city||"-")}</td><td>${esc(r.exp||"-")}</td><td>${new Date(r.date).toLocaleString()}</td></tr>`).join("")}
</tbody></table><script>window.print();</script></body></html>`;
    const w = window.open("", "_blank"); w.document.open(); w.document.write(html); w.document.close();
  };

  return (
    <div className="card">
      <div style={{display:"flex", gap:8, marginBottom:12, flexWrap:"wrap"}}>
        <button className="btn btn-outline" onClick={load}>Обновить</button>
        <button className="btn btn-outline" onClick={clearAll}>Очистить</button>
        <button className="btn btn-primary" onClick={exportPDF}>Скачать PDF</button>
      </div>

      <div style={{ overflow: "auto" }}>
        <table className="table">
          <thead><tr><th>Имя</th><th>Email</th><th>Вакансия</th><th>Релевантность</th><th>Индикатор</th><th>Дата</th></tr></thead>
          <tbody>
            {!rows.length ? (
              <tr><td colSpan={6} style={{textAlign:"center", color:"var(--muted)", padding:18}}>Пока нет данных</td></tr>
            ) : rows.map((r,i)=>(
              <tr key={i}>
                <td>{esc(r.name)}</td>
                <td>{esc(r.email||"-")}</td>
                <td>{esc(r.jobTitle||"")}</td>
                <td><span className={clsx("badge", tone(Number(r.score)||0))}>{Number(r.score)||0}%</span></td>
                <td>
                  <div style={{height:8, background:"var(--line)", borderRadius:999, overflow:"hidden", width:140}}>
                    <div style={{height:8, width:`${Math.max(0,Math.min(100,Number(r.score)||0))}%`, background:"#60a5fa"}}/>
                  </div>
                </td>
                <td style={{fontSize:12, color:"var(--muted)"}}>{new Date(r.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========= СТРАНИЦА ========= */
export default function Page() {
  const [theme, setTheme] = useState("light");
  const [view, setView] = useState("jobs");        // jobs | employer
  const [mode, setMode] = useState("find_job");    // find_job | find_employee
  const [modalOpen, setModalOpen] = useState(false);
  const [job, setJob] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [q, setQ] = useState("");
  const [candOpen, setCandOpen] = useState(false);
  const [cand, setCand] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addJobOpen, setAddJobOpen] = useState(false);

  const [candidates, setCandidates] = useState(SEED_CANDIDATES);
  const [jobs, setJobs] = useState(SEED_JOBS);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme);

    const savedC = localStorage.getItem("jb_candidates");
    if (savedC) {
      try { setCandidates(JSON.parse(savedC)); } catch { setCandidates(SEED_CANDIDATES); }
    } else {
      localStorage.setItem("jb_candidates", JSON.stringify(SEED_CANDIDATES));
      setCandidates(SEED_CANDIDATES);
    }

    const savedJ = localStorage.getItem("jb_jobs");
    if (savedJ) {
      try { setJobs(JSON.parse(savedJ)); } catch { setJobs(SEED_JOBS); }
    } else {
      localStorage.setItem("jb_jobs", JSON.stringify(SEED_JOBS));
      setJobs(SEED_JOBS);
    }

    const cur = localStorage.getItem("jb_current");
    if (cur) { try { const u = JSON.parse(cur); setUser(u); if (u.role === "applicant") setView("jobs"); } catch {} }
  }, []);

  const persistCandidates = (arr) => { setCandidates(arr); localStorage.setItem("jb_candidates", JSON.stringify(arr)); };
  const persistJobs = (arr) => { setJobs(arr); localStorage.setItem("jb_jobs", JSON.stringify(arr)); };

  const switchTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); document.body.setAttribute("data-theme", next); localStorage.setItem("theme", next);
  };
  const logout = () => { localStorage.removeItem("jb_current"); setUser(null); setView("jobs"); };

  const filteredJobs = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return jobs;
    return jobs.filter((j) => [j.title, j.city, j.format, j.exp, j.salary, (j.duties||[]).join(" "), (j.reqs||[]).join(" ")].join(" ").toLowerCase().includes(t));
  }, [q, jobs]);

  const filteredCandidates = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return candidates;
    return candidates.filter((c) =>
      [c.name, c.profession, c.country, c.city, c.desiredSalary, c.experience].join(" ").toLowerCase().includes(t)
    );
  }, [q, candidates]);

  const canSeeEmployer = !user || user.role === "employer";
  const handleAddCandidate = (c) => { const next=[c, ...candidates]; persistCandidates(next); };
  const handleAddJob = (j) => { const next=[j, ...jobs]; persistJobs(next); };

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <div className="logo">JobBoard</div>

          <div className="mode">
            <button className={clsx("seg", mode==="find_job" && "seg-active")} onClick={()=>setMode("find_job")}>Найти работу</button>
            <button className={clsx("seg", mode==="find_employee" && "seg-active")} onClick={()=>setMode("find_employee")}>Найти сотрудника</button>
          </div>

          <div className="search">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={mode==="find_job" ? "Поиск вакансий…" : "Поиск по соискателям…"} />
          </div>

          <div className="nav">
            <button className={clsx(view==="jobs"&&"active")} onClick={()=>setView("jobs")}>Вакансии</button>
            {canSeeEmployer && <button className={clsx(view==="employer"&&"active")} onClick={()=>setView("employer")}>Работодатель</button>}
            <button onClick={switchTheme} title="Светлая/тёмная тема">Тема</button>
            {!user ? (
              <button className="btn btn-outline" onClick={()=>setAuthOpen(true)}>Войти</button>
            ) : (
              <div className="userbox">
                <div className="avatar">{(user.firstName||"U").slice(0,1).toUpperCase()}</div>
                <div className="uinfo">
                  <div className="uname">{user.firstName} {user.lastName}</div>
                  <div className="umail">{user.email} • {user.role==="employer"?"Работодатель":"Соискатель"}</div>
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
            <h1>{mode==="find_job" ? "Найдите работу мечты" : "Найдите подходящего сотрудника"}</h1>
            <p>{mode==="find_job"
              ? "Лаконичный интерфейс, быстрый отклик и умный скрининг через SmartBot."
              : "Смотрите карточки соискателей, открывайте резюме и изучайте опыт. Работодатели могут добавлять новых соискателей."}
            </p>
          </div>
          <div className="pill">Демо-версия (фронтенд only)</div>
        </section>

        {/* === Найти работу === */}
        {mode === "find_job" && (
          <>
            {view === "jobs" && (
              <section>
                <div className="card" style={{marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div className="title" style={{margin:0}}>Список вакансий</div>
                  {user?.role === "employer" && (
                    <button className="btn btn-primary" onClick={()=>setAddJobOpen(true)}>Добавить вакансию</button>
                  )}
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="card" style={{ color: "var(--muted)" }}>Ничего не найдено. Измените запрос.</div>
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
                          <div>
                            <strong>Обязанности:</strong>{" "}
                            {Array.isArray(j.duties) && j.duties.length ? j.duties.join(", ") : "коммуникация, отчётность, командная работа"}
                          </div>
                          <div>
                            <strong>Требования:</strong>{" "}
                            {Array.isArray(j.reqs) && j.reqs.length ? j.reqs.join(", ") : "дисциплина, обучаемость, ответственность"}
                          </div>
                        </div>
                        <div className="actions">
                          <button className="btn btn-primary" onClick={()=>{ setJob(j); setModalOpen(true); }}>Откликнуться</button>
                          <button className="btn btn-outline" onClick={()=>{ setJob(j); setModalOpen(true); }}>Быстрый отклик</button>
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
                  <h3 className="title" style={{ marginBottom: 8 }}>Отклики SmartBot (лучшие сверху)</h3>
                  <p className="muted" style={{ color: "var(--muted)", margin: 0 }}>Отсюда можно анализировать релевантность.</p>
                </div>
                <EmployerTable />
              </section>
            )}
          </>
        )}

        {/* === Найти сотрудника === */}
        {mode === "find_employee" && (
          <section>
            <div className="card" style={{marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div className="title" style={{margin:0}}>Список соискателей</div>
              {user?.role === "employer" && (
                <button className="btn btn-primary" onClick={()=>setAddOpen(true)}>Добавить соискателя</button>
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
                      <span className="pill">{c.country}, {c.city}</span>
                      <span className="pill">Желаемая: {c.desiredSalary || "—"}</span>
                      <span className="pill">Опыт: {c.experience || "—"}</span>
                    </div>
                    <div className="actions">
                      <button className="btn btn-primary" onClick={()=>{ setCand(c); setCandOpen(true); }}>
                        Предпросмотр
                      </button>

                      {user?.role === "employer" && (
                        <button className="btn btn-outline" onClick={() => { setJob(jobs[0]); setCand(c); setModalOpen(true); }}>
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
      <SmartBotModal open={modalOpen} job={job} candidate={cand} onClose={() => { setModalOpen(false); setCand(null); }} />
      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuth={(u)=>{ setUser(u); if(u.role==="applicant") setView("jobs"); }} />
      <CandidatePreview open={candOpen} onClose={()=>setCandOpen(false)} candidate={cand} />
      <AddCandidateModal open={addOpen} onClose={()=>setAddOpen(false)} onAdd={(c)=>handleAddCandidate(c)} />
      <AddJobModal open={addJobOpen} onClose={()=>setAddJobOpen(false)} onAdd={(j)=>handleAddJob(j)} />

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
        .container{max-width:1100px;margin:0 auto;padding:24px}
        .header{position:sticky;top:0;z-index:10;backdrop-filter:saturate(1.3) blur(6px);background:rgba(255,255,255,.85);border-bottom:1px solid var(--line)}
        [data-theme="dark"] .header{background:rgba(15,23,42,.8)}
        .header-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:10px 16px}
        .logo{font-weight:700}
        .mode{margin-left:12px;display:flex;border:1px solid var(--line);border-radius:12px;overflow:hidden}
        .seg{border:none;background:transparent;padding:8px 12px;font-weight:600;color:var(--muted);cursor:pointer}
        .seg-active{background:rgba(37,99,235,.08);color:var(--text)}
        .search{margin-left:12px;flex:1}
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

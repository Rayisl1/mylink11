"use client";
import { useState } from "react";

const JOBS = [
  { id: 1, title: "Менеджер по продажам", city: "Алматы", exp: "от 2 лет", format:"Полный день", salary:"от 300 000 ₸" },
  { id: 2, title: "Маркетолог Performance", city: "Астана", exp: "от 3 лет", format:"Гибрид", salary:"от 600 000 ₸" }
];

export default function Page() {
  const [selectedJob, setSelectedJob] = useState(null);

  // Подключаем public/smartbot-widget.js как обычный <script>, а не как модуль
  const ensureSmartBotLoaded = () =>
    new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.openSmartBotModal) return resolve();

      const id = "sb-widget";
      // если тег уже добавлен — ждём инициализации
      if (document.getElementById(id)) {
        const check = setInterval(() => {
          if (window.openSmartBotModal) {
            clearInterval(check);
            resolve();
          }
        }, 50);
        setTimeout(() => { clearInterval(check); reject(new Error("SmartBot load timeout")); }, 5000);
        return;
      }

      const s = document.createElement("script");
      s.id = id;
      s.src = "/smartbot-widget.js"; // лежит в /public
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("SmartBot script failed to load"));
      document.body.appendChild(s);
    });

  const openSmartBot = async (job) => {
    setSelectedJob(job);
    await ensureSmartBotLoaded();
    window.openSmartBotModal({
      job,
      title: "🤖 SmartBot — быстрый скрининг",
      onClose: () => setSelectedJob(null)
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {JOBS.map(job => (
        <div key={job.id} className="bg-white rounded-2xl shadow p-5 hover:shadow-md transition">
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <div className="text-sm text-slate-600 mt-2 space-y-1">
            <div><b>Город:</b> {job.city}</div>
            <div><b>Опыт:</b> {job.exp}</div>
            <div><b>Формат:</b> {job.format}</div>
            <div><b>Зарплата:</b> {job.salary}</div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => openSmartBot(job)}
            >
              Откликнуться
            </button>
            <a
              href="#"
              onClick={(e)=>{e.preventDefault(); openSmartBot(job);}}
              className="px-4 py-2 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50"
            >
              Быстрый отклик
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";
import { useState } from "react";

const JOBS = [
  { id: 1, title: "Менеджер по продажам", city: "Алматы", exp: "от 2 лет", format:"Полный день", salary:"от 300 000 ₸" },
  { id: 2, title: "Маркетолог Performance", city: "Астана", exp: "от 3 лет", format:"Гибрид", salary:"от 600 000 ₸" }
];

export default function Page(){
  const [selectedJob, setSelectedJob] = useState(null);

  const openSmartBot = (job) => {
    setSelectedJob(job);
    // ленивое подключение виджета (ниже — файл public/smartbot-widget.js)
    import("/smartbot-widget.js").then(({ openSmartBotModal }) => {
      openSmartBotModal({
        job,
        title: "🤖 SmartBot — быстрый скрининг",
        onClose: () => setSelectedJob(null)
      });
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
              className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white hover:brightness-95"
              onClick={() => openSmartBot(job)}
            >
              Откликнуться
            </button>
            <a className="px-4 py-2 rounded-xl border border-[var(--brand)] text-[var(--brand)] hover:bg-blue-50"
               href="#"
               onClick={(e)=>{e.preventDefault(); openSmartBot(job)}}
            >
              Быстрый отклик
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

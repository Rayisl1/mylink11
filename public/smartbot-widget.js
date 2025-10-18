// ЛЁГКИЙ ОТДЕЛЬНЫЙ ВИДЖЕТ: не зависит от React/Next, можно вставлять куда угодно.
(function(){
  const style = `
  .sb-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.4);display:flex;align-items:center;justify-content:center;z-index:9999}
  .sb-modal{width:min(680px,92vw);background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.2);overflow:hidden;font-family:Inter,system-ui,-apple-system,Arial}
  .sb-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
  .sb-title{font-weight:600}
  .sb-close{border:none;background:transparent;font-size:20px;cursor:pointer;color:#334155}
  .sb-body{padding:12px 16px}
  .sb-messages{height:320px;overflow:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px}
  .sb-bot,.sb-user{max-width:82%;padding:8px 10px;border-radius:12px;font-size:14px;line-height:1.35}
  .sb-bot{background:#f1f5f9;align-self:flex-start}
  .sb-user{background:#dbeafe;align-self:flex-end}
  .sb-input{display:flex;gap:8px;margin-top:10px}
  .sb-input input{flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:10px}
  .sb-input button{padding:10px 14px;border-radius:10px;border:none;background:#2563eb;color:#fff;cursor:pointer}
  .sb-quick{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
  .sb-quick button{padding:6px 10px;border:1px solid #e2e8f0;background:#fff;border-radius:999px;cursor:pointer;font-size:13px}
  `;

  function el(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
  function push(mount, sender, text){
    const bubble = el('div', sender==='bot'?'sb-bot':'sb-user', `<b>${sender==='bot'?'SmartBot':'Вы'}:</b> ${text}`);
    mount.appendChild(bubble);
    mount.scrollTop = mount.scrollHeight;
  }

  async function callAssistant(messages, job){
    // ВАЖНО: ключ хранится на сервере; фронт вызывает серверный роут /api/chat.
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ messages, job })
    });
    if(!res.ok) throw new Error('Ошибка ответа ассистента');
    const data = await res.json();
    return data.reply; // строка
  }

  window.openSmartBotModal = function({ job, title="SmartBot", onClose }){
    // inject styles once
    if(!document.getElementById('sb-style')){
      const s = el('style'); s.id='sb-style'; s.innerHTML=style; document.head.appendChild(s);
    }
    const backdrop = el('div','sb-backdrop');
    const modal = el('div','sb-modal');
    const header = el('div','sb-header');
    const body = el('div','sb-body');
    const close = el('button','sb-close','×');
    const hTitle = el('div','sb-title', title);
    const messages = el('div','sb-messages');
    const inputWrap = el('div','sb-input');
    const input = el('input'); input.placeholder = 'Введите ответ...';
    const send = el('button',null,'Отправить');
    const quick = el('div','sb-quick');

    header.appendChild(hTitle); header.appendChild(close);
    inputWrap.appendChild(input); inputWrap.appendChild(send);
    body.appendChild(messages); body.appendChild(inputWrap); body.appendChild(quick);
    modal.appendChild(header); modal.appendChild(body);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const state = { step:0, candidate:{}, history:[{role:'system',content:'Ты скрининговый ассистент вакансий.'}] };

    function ask(){
      quick.innerHTML = '';
      if(state.step===0){ push(messages,'bot',`Спасибо за интерес к вакансии «${job.title}». Как вас зовут?`); }
      if(state.step===1){ push(messages,'bot',`Вы сейчас в городе ${job.city}?`); addQuick(['Да','Нет']); }
      if(state.step===2){ push(messages,'bot',`Есть минимум ${job.exp}?`); addQuick(['Да','Нет']); }
      if(state.step===3){ push(messages,'bot',`Формат ${job.format}. Подходит?`); addQuick(['Да','Нет']); }
      if(state.step===4){ push(messages,'bot','Спасибо! Оцениваю вашу релевантность…'); finish(); }
    }

    function addQuick(labels){ labels.forEach(l=>{ const b=el('button',null,l); b.onclick=()=>sendUser(l); quick.appendChild(b); }); }
    function normalize(v){ const t=(v||'').toLowerCase().trim(); if(['да','y','yes','ага','угу','ок','+'].includes(t))return'да'; if(['нет','n','no','-','неа'].includes(t))return'нет'; return t; }

    async function sendUser(text){
      if(!text) return;
      push(messages,'user', text);
      if(state.step===0){ state.candidate.name=text; state.step=1; ask(); return; }
      if(state.step===1){ state.candidate.city=normalize(text); state.step=2; ask(); return; }
      if(state.step===2){ state.candidate.exp=normalize(text); state.step=3; ask(); return; }
      if(state.step===3){ state.candidate.format=normalize(text); state.step=4; ask(); return; }

      // free-form chat with assistant after scoring:
      state.history.push({role:'user', content:text});
      try{
        const reply = await callAssistant(state.history, { id:job.id, title:job.title });
        state.history.push({role:'assistant', content:reply});
        push(messages,'bot', reply);
      }catch(err){ push(messages,'bot','Извините, сервер ассистента недоступен.'); }
    }

    async function finish(){
      // простая формула скоринга
      let score = 100;
      if(state.candidate.city!=='да') score -= 30;
      if(state.candidate.exp!=='да') score -= 40;
      if(state.candidate.format!=='да') score -= 30;
      if(score<0) score=0;

      // сохранить
      const all = JSON.parse(localStorage.getItem('smartbot_candidates')||'[]');
      all.push({ name:state.candidate.name||'Кандидат', ...state.candidate, score, jobId:job.id, jobTitle:job.title, date:new Date().toISOString() });
      localStorage.setItem('smartbot_candidates', JSON.stringify(all));

      push(messages,'bot',`Релевантность: <b>${score}%</b>`);
      push(messages,'bot','Можете задать вопросы по вакансии — я отвечу.');
      state.step = 999; // свободный режим
    }

    const sendClick = ()=>{ const v=input.value.trim(); if(!v) return; input.value=''; sendUser(v); };
    send.onclick = sendClick;
    input.addEventListener('keydown', e=>{ if(e.key==='Enter') sendClick(); });
    close.onclick = ()=>{ backdrop.remove(); onClose && onClose(); };

    ask();
  };
})();

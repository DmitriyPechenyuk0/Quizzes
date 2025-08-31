        const socket = io();
        const code = "{{ code }}";
        start.onclick = () => socket.emit("teacher:start", { code });
        next.onclick = () => socket.emit("teacher:next", { code });
        finish.onclick = () => socket.emit("teacher:finish", { code });
        socket.emit("join", { code });
        
        socket.on("room:state", (s) => { state.innerText = JSON.stringify(s, null, 2); if (s.question) renderQuestion(s.question); });
        socket.on("room:question", (q) => renderQuestion(q));
        socket.on("room:answers_progress", (p) => progress.innerText = `Ответило: ${p.answered}/${p.total}`);
        socket.on("room:question_closed", (d) => state.innerText = `Закрыт вопрос ${d.question_index}. Правильный ответ: ${Array.isArray(d.correct_answer)? d.correct_answer.join(' | ') : (d.correct_answer || 'не задан')}`);
        socket.on("room:final_results", (res) => question.innerHTML = `<h3>Итоги</h3><pre>${JSON.stringify(res, null, 2)}</pre>`);
        
        function renderQuestion(q) { question.innerHTML = `<div><strong>${q.text}</strong></div>`; }
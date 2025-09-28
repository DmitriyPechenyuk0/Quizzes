(function () {
    let socket = null;
    let code = "";

    function $(id) { return document.getElementById(id); }

    function clearUI({ keepState = false } = {}) {
      $("question").innerHTML = "";
      $("progress").innerText = "";
      if (!keepState) $("state").innerText = "";
    }

    function renderQuestion(q) {
      clearUI({ keepState: false });
      $("question").innerHTML = `<div><strong>${q.text}</strong></div>`;
    }

    function renderParticipants(participants) {
      const listEl = $("participants-list");
      const countEl = $("participants-count");
      listEl.innerHTML = "";
      countEl.textContent = `Учасники (${participants.length})`;
      participants.forEach(p => {
        const name = (p && typeof p === "object")
          ? (p.nickname || p.name || p.username || p.displayName || "Без имени")
          : (p || "Без имени");
        const div = document.createElement("div");
        div.className = "participant-item-remove-btn";
        div.innerHTML = `
          <div class="participant-item">
            <img src="/quiz/quiz_static/images/profile-avatar.svg" alt="User">
            <h3>${name}</h3>
          </div>
          <img src="/quiz/quiz_static/images/remove-btn.svg" alt="Remove-btn" data-id="${p.id}">
        `;
        div.querySelector("img[data-id]").onclick = () => socket.emit("teacher:remove_participant", { code, id: p.id });
        listEl.appendChild(div);
      });
    }

    function attachEvents() {
      $("start").onclick = () => socket.emit("teacher:start", { code });
      $("next").onclick = () => socket.emit("teacher:next", { code });
      $("finish").onclick = () => socket.emit("teacher:finish", { code });

      socket.on("room:state", (s) => {
        $("state").innerText = JSON.stringify(s, null, 2);
        console.log(JSON.stringify(s))
        if (s.question) renderQuestion(s.question);
        if (s.participants) renderParticipants(s.participants);
      });

      socket.on("room:question", (q) => {
        renderQuestion(q);
      });

      socket.on("room:answers_progress", (p) => {
        $("progress").innerText = `Passed: ${p.answered}/${p.total}`;
      });

      socket.on("room:question_closed", (d) => {
        const ans = Array.isArray(d.correct_answer)
          ? d.correct_answer.join(" | ")
          : (d.correct_answer || "не задан");
        $("state").innerText = `Close question ${d.question_id || d.question_index}. True answer: ${ans}`;
        clearUI({ keepState: true });
      });

      socket.on("room:final_results", (res) => {
        clearUI();
        $("question").innerHTML = `<h3>Results</h3>`;
        $("stats").innerHTML = `<pre>${JSON.stringify(res, null, 2)}</pre>`
      });

      socket.on("room:participants_updated", (participants) => {
        renderParticipants(participants);
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const hostRoot = document.getElementById("host-root");
        code = hostRoot?.dataset?.code || "";
        if (!code) {
          return;
        }

      socket = io();
      socket.emit("join", { code, as_host: true });
      attachEvents();
    });
})();
(function () {
  let socket = null;
  let code = "";

  function $(id) { return document.getElementById(id); }

  function renderQuestion(q) {
    $("question").innerHTML = `<div><strong>${q.text}</strong></div>`;
  }

  function attachEvents() {
    $("start").onclick = () => socket.emit("teacher:start", { code });
    $("next").onclick = () => socket.emit("teacher:next", { code });
    $("finish").onclick = () => socket.emit("teacher:finish", { code });
    socket.on("room:state", (s) => {
      $("state").innerText = JSON.stringify(s, null, 2);
      if (s.question) renderQuestion(s.question);
    });

    socket.on("room:question", (q) => renderQuestion(q));

    socket.on("room:answers_progress", (p) => {
      $("progress").innerText = `Відповіло: ${p.answered}/${p.total}`;
    });

    socket.on("room:question_closed", (d) => {
      const ans = Array.isArray(d.correct_answer)
        ? d.correct_answer.join(" | ")
        : (d.correct_answer || "не задан");
      $("state").innerText = `Запитання закрито ${d.question_id || d.question_index}. Правильна відповідь: ${ans}`;
    });

    socket.on("room:final_results", (res) => {
      $("question").innerHTML = `<h3>Результати</h3><pre>${JSON.stringify(res, null, 2)}</pre>`;
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
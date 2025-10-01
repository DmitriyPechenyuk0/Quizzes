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

        function attachEvents() {
      $("start").onclick = () => {
        socket.emit("teacher:start", { code })
        socket.emit('switch_content', { code })
      };
      $("next").onclick = () => socket.emit("teacher:next", { code });
      $("finish").onclick = () => socket.emit("teacher:finish", { code });

      socket.on("room:state", (info) => {
        $("state").innerText = JSON.stringify(info, null, 2);
        console.log(JSON.stringify(info))
        console.log(JSON.stringify(info.participants))
        if (info.question) renderQuestion(info.question);
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
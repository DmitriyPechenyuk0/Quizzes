// quiz/static/js/join.js
(function () {
  let socket = null;
  let state = { code: "" };

  function $(id) { return document.getElementById(id); }

  function getCodeFromQuery() {
    const p = new URLSearchParams(window.location.search);
    return p.get("code") || "";
  }

  function clearUI({ keepStatus = false } = {}) {
    $("question").innerHTML = "";
    $("progress").innerText = "";
    if (!keepStatus) $("status").innerText = "";
  }

  function renderQuestion(q) {
    clearUI({ keepStatus: false });
    const container = $("question");
    container.innerHTML = `
      <div><strong>${q.text}</strong></div>
      <div style="margin-top:8px">
        <input id="txtAnswer" type="text" placeholder="Your answer:" style="width:280px"/>
      </div>
      <button id="send" style="margin-top:8px">Отправить</button>
    `;
    $("send").onclick = () => {
      const payload = $("txtAnswer").value;
      socket.emit("participant:answer", { code: state.code, answer: payload });
    };
  }

  function attachEvents() {
    $("joinBtn").onclick = () => {
      const code = ($("code").value || "").trim();
      if (!code) {
        $("status").innerText = "Enter code";
        return;
      }
      state.code = code;
      socket.emit("join", { code });
    };

    $("code").addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("joinBtn").click();
    });

    socket.on("connect", () => {
      if (!state.code) {
        const qsCode = getCodeFromQuery();
        if (qsCode) {
          state.code = qsCode;
          if ($("code")) $("code").value = qsCode;
          socket.emit("join", { code: qsCode });
        }
      }
    });

    socket.on("error", (e) => {
      $("status").innerText = e?.message || "Error";
    });

    socket.on("room:state", (s) => {
      if (s.question) renderQuestion(s.question);
    });

    socket.on("room:question", (q) => {
      renderQuestion(q);
    });

    socket.on("room:answers_progress", (p) => {
      $("progress").innerText = `responsed: ${p.answered}/${p.total}`;
    });

    socket.on("room:question_closed", (d) => {
      const ans = Array.isArray(d.correct_answer)
        ? d.correct_answer.join(" | ")
        : (d.correct_answer || "not set");
      $("status").innerText = `True answer: ${ans}`;
      clearUI({ keepStatus: true });
    });

    socket.on("room:final_results", (res) => {
      clearUI();
      $("question").innerHTML = `<h3>Results</h3><pre>${JSON.stringify(res, null, 2)}</pre>`;
    });
  }

    document.addEventListener("DOMContentLoaded", () => {
      socket = io();
      attachEvents();
      const codeFromQuery = getCodeFromQuery();
      if (codeFromQuery && $("code")) $("code").value = codeFromQuery;
    });
})();
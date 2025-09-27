(function () {
  let socket = null;
  let state = { code: "" };

  function $(id) { return document.getElementById(id); }

  function getCodeFromQuery() {
    const p = new URLSearchParams(window.location.search);
    return p.get("code") || "";
  }

  function clearUI({ keepStatus = false } = {}) {
    if ($("question")) $("question").innerHTML = "";
    if ($("progress")) $("progress").innerText = "";
    if (!keepStatus && $("status")) $("status").innerText = "";
  }

  function renderQuestion(q) {
    clearUI({ keepStatus: false });
    const container = $("question");
    if (!container) return;
    container.innerHTML = `
      <div><strong>${q.text}</strong></div>
      <div style="margin-top:8px">
        <input id="txtAnswer" type="text" placeholder="Your answer:" style="width:280px"/>
      </div>
      <button id="send" style="margin-top:8px">Send</button>
    `;
    $("send").onclick = () => {
      const payload = $("txtAnswer").value;
      socket.emit("participant:answer", { code: state.code, answer: payload });
    };
  }

  function showJoinNext() {
    ["joinPage", "particles-js"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    document.getElementById("joinNextContainer").classList.remove("hidden");
    document.getElementById("joinNextStyles").disabled = false;
  }

  function showStudent2Screen() {
    ["joinPage", "joinNextContainer", "particles-js"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    document.getElementById("student2Block").classList.remove("hidden");
    document.getElementById("student2Styles").disabled = false;
  }

  function updateParticipantsList(participants) {
    const list = $("participantsList");
    const count = $("participantsCount");
    if (!list || !count) return;

    count.innerText = participants.length;
    list.innerHTML = "";

    participants.forEach(p => {
      const name = (p && typeof p === "object")
        ? (p.nickname || p.name || p.username || p.displayName || "Unknown")
        : p;
      const div = document.createElement("div");
      div.className = "mwop-user";
      div.innerHTML = `<p>${name}</p>`;
      list.appendChild(div);
    });
  }

  function attachEvents() {
    $("joinBtn").onclick = () => {
      const code = ($("code").value || "").trim();
      if (!code) {
        if ($("status")) $("status").innerText = "Enter code";
        return;
      }
      state.code = code;
      socket.emit("join", { code, name: window.currentUserName });
      showJoinNext();
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
          socket.emit("join", { code: qsCode, name: window.currentUserName });
          showJoinNext();
        }
      }
    });

    socket.on("error", (e) => {
      if ($("status")) $("status").innerText = e?.message || "Error";
    });

    socket.on("room:state", (s) => {
      if (s.participants) updateParticipantsList(s.participants);
      if (s.question) renderQuestion(s.question);
    });

    socket.on("room:participants", (participants) => {
      updateParticipantsList(participants);
    });

    socket.on("room:question", (q) => {
      renderQuestion(q);
    });

    socket.on("room:answers_progress", (p) => {
      if ($("progress")) $("progress").innerText = `responsed: ${p.answered}/${p.total}`;
    });

    socket.on("room:question_closed", (d) => {
      const ans = Array.isArray(d.correct_answer)
        ? d.correct_answer.join(" | ")
        : (d.correct_answer || "not set");
      if ($("status")) $("status").innerText = `True answer: ${ans}`;
      clearUI({ keepStatus: true });
    });

    socket.on("room:final_results", (res) => {
      clearUI();
      if ($("question")) $("question").innerHTML = `<h3>Results</h3><pre>${JSON.stringify(res, null, 2)}</pre>`;
    });

    socket.on("admin:start", () => showStudent2Screen());
  }

  document.addEventListener("DOMContentLoaded", () => {
    socket = io();
    attachEvents();
    const codeFromQuery = getCodeFromQuery();
    if (codeFromQuery && $("code")) $("code").value = codeFromQuery;
  });
})();
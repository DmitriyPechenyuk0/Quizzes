(function () {
  let socket = null;
  let state = { code: "" };

  function $(id) { return document.getElementById(id); }

  function getCodeFromQuery() {
    const p = new URLSearchParams(window.location.search);
    return p.get("code") || "";
  }

  function clearUI({ keepStatus = false } = {}) {
    // $("question").innerHTML = "";
    // $("progress").innerText = "";
    // if (!keepStatus) $("status").innerText = "";
  }

  function renderQuestion(q) {
    clearUI({ keepStatus: false });
    const container = $("question");
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
  function updateCounter() {
    let usersCount = document.querySelectorAll('.mwop-user').length
    let usersCBtn = document.querySelector('.mwm-participants-count-count')
    usersCBtn.textContent = usersCount

  }
  function switchInterfaceToRoom(){
    // document.querySelector('#particles-js').classList.add('display-none')
    // document.querySelector('.join-code-div').classList.remove('display-flex')
    // document.querySelector('.join-code-div').classList.add('display-none')
    // document.querySelector('.main-window').classList.remove('display-none')
    // document.querySelector('.main-window').classList.add('display-flex')
  }
  function switchInterfaceToAnswerRoom(){
    
  }

  function renderParticipantsList(data) {
    
  }
  function attachEvents() {
    $("joinBtn").onclick = () => {
      socket.emit("join", { code });
    };

    $("code").addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("joinBtn").click();
    });

    // socket.on("connect", () => {
    //   if (!state.code) {
    //     const qsCode = getCodeFromQuery();
    //     if (qsCode) {
    //       state.code = qsCode;
    //       if ($("code")) $("code").value = qsCode;
    //       socket.emit("join", { code: qsCode });
    //     }
    //   }
    // });

    socket.on("error", (e) => {
      $("status").innerText = e?.message || "Error";
    });

    socket.on("room:participants_list", (data) => {
      renderParticipantsList(data);
    });

    socket.on("room:state", (s) => {
      if (s.status === "WAITING"){
        switchInterfaceToRoom()
      }
      if (s.status === "IN_PROGRESS"){
        switchInterfaceToAnswerRoom()
      }
        
        if (s.participants) {
          renderParticipantsList({participants: s.participants, count: s.participants.length});
        }
      
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

    socket.on("student:switch_content", (d) => {

      switchToStudentInterface();
    });

    socket.on("room:participants_update", (data) => {
      if (state.code) {
        socket.emit("request_participants", { code: state.code });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    socket = io();
    attachEvents();
    const codeFromQuery = getCodeFromQuery();
    if (codeFromQuery && $("code")) $("code").value = codeFromQuery;
  });
})();
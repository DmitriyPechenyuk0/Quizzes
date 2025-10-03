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
      <button id="send" style="margin-top:8px">Send</button>
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
      <button id="send" style="margin-top:8px">Send</button>
    `;
    $("send").onclick = () => {
      const payload = $("txtAnswer").value;
      socket.emit("participant:answer", { code: state.code, answer: payload });
    };
  }


  function renderParticipantsList(participantsData) {
    const participantsList = document.getElementById('participantsList');
    const participantsCount = document.getElementById('participantsCount');
    
    if (!participantsList) return;
    
 
    if (participantsCount) {
      participantsCount.textContent = participantsData.count || 0;
    }
    
 
    participantsList.innerHTML = '';
    
 
    if (participantsData.participants && participantsData.participants.length > 0) {
      participantsData.participants.forEach(participant => {
        const participantElement = document.createElement('div');
        participantElement.className = 'mwop-user';
        participantElement.innerHTML = `<p>${participant.nickname}</p>`;
        participantsList.appendChild(participantElement);
      });
    } else {
   
      const emptyElement = document.createElement('div');
      emptyElement.className = 'mwop-user';
      emptyElement.innerHTML = '<p>Немає учасників</p>';
      participantsList.appendChild(emptyElement);
    }
  }


  function switchToJoinNext() {

    
   
    const joinPage = document.getElementById('joinPage');
    const joinNextContainer = document.getElementById('joinNextContainer');
    const student2Block = document.getElementById('student2Block');
    
  
    [joinPage, joinNextContainer, student2Block].forEach(container => {
        if (container) {
            container.classList.remove('content-visible');
            container.classList.add('content-hidden');
        }
    });
    

    if (joinNextContainer) {
        joinNextContainer.classList.remove('content-hidden');
        joinNextContainer.classList.add('content-visible');
        

        if (state.code) {
          socket.emit("request_participants", { code: state.code });
        }
    }
    

    const joinNextStyles = document.getElementById('joinNextStyles');
    const student2Styles = document.getElementById('student2Styles');
    
    if (joinNextStyles) joinNextStyles.disabled = false;
    if (student2Styles) student2Styles.disabled = true;
  }

  function switchContent(toContentId) {
    const allContainers = ['joinPage', 'joinNextContainer', 'student2Block'];
    

    allContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.remove('content-visible');
            container.classList.add('content-hidden');
        }
    });
    

    const targetContainer = document.getElementById(toContentId);
    if (targetContainer) {
        targetContainer.classList.remove('content-hidden');
        targetContainer.classList.add('content-visible');
    }
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


    socket.on("room:joined", (data) => {

      switchToJoinNext();
    });


    socket.on("room:participants_list", (data) => {

      renderParticipantsList(data);
    });

    socket.on("room:state", (s) => {

      if (s.status === "WAITING" || s.status === "IN_PROGRESS") {
        switchToJoinNext();
        

        if (s.participants) {
          renderParticipantsList({
            participants: s.participants,
            count: s.participants.length
          });
        }
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

      switchToJoinNext();
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
      <button id="send" style="margin-top:8px">Send</button>
    `;
    $("send").onclick = () => {
      const payload = $("txtAnswer").value;
      socket.emit("participant:answer", { code: state.code, answer: payload });
    };
  }

  function renderParticipantsList(participantsData) {
    const participantsList = document.getElementById('participantsList');
    const participantsCount = document.getElementById('participantsCount');
    
    if (!participantsList) return;
    
    if (participantsCount) {
      participantsCount.textContent = participantsData.count || 0;
    }
    
    participantsList.innerHTML = '';
    
    if (participantsData.participants && participantsData.participants.length > 0) {
      participantsData.participants.forEach(participant => {
        const participantElement = document.createElement('div');
        participantElement.className = 'mwop-user';
        participantElement.innerHTML = `<p>${participant.nickname}</p>`;
        participantsList.appendChild(participantElement);
      });
    } else {
      const emptyElement = document.createElement('div');
      emptyElement.className = 'mwop-user';
      emptyElement.innerHTML = '<p>Немає учасників</p>';
      participantsList.appendChild(emptyElement);
    }
  }

  function switchToStudentInterface() {
    console.log(12321)
    const joinPage = document.getElementById('joinPage');
    const joinNextContainer = document.getElementById('joinNextContainer');
    const student2Block = document.getElementById('student2Block');

    [joinPage, joinNextContainer, student2Block].forEach(container => {
        if (container) {
            container.classList.remove('content-visible');
            container.classList.add('content-hidden');
        }
    });
    

    if (student2Block) {
        student2Block.classList.remove('content-hidden');
        student2Block.classList.add('content-visible');
    }
    

    const joinNextStyles = document.getElementById('joinNextStyles');
    const student2Styles = document.getElementById('student2Styles');
    
    if (joinNextStyles) joinNextStyles.disabled = true;
    if (student2Styles) student2Styles.disabled = false;
  }

  function switchToJoinNext() {
    const joinPage = document.getElementById('joinPage');
    const joinNextContainer = document.getElementById('joinNextContainer');
    const student2Block = document.getElementById('student2Block');
    
    [joinPage, joinNextContainer, student2Block].forEach(container => {
        if (container) {
            container.classList.remove('content-visible');
            container.classList.add('content-hidden');
        }
    });

    if (joinNextContainer) {
        joinNextContainer.classList.remove('content-hidden');
        joinNextContainer.classList.add('content-visible');
        
        if (state.code) {
          socket.emit("request_participants", { code: state.code });
        }
    }
    
    const joinNextStyles = document.getElementById('joinNextStyles');
    const student2Styles = document.getElementById('student2Styles');
    
    if (joinNextStyles) joinNextStyles.disabled = false;
    if (student2Styles) student2Styles.disabled = true;
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

    socket.on("room:joined", (data) => {
      switchToJoinNext();
    });

    socket.on("room:participants_list", (data) => {
      renderParticipantsList(data);
    });

    socket.on("room:state", (s) => {
      if (s.status === "WAITING" || s.status === "IN_PROGRESS") {
        switchToJoinNext();
        
        if (s.participants) {
          renderParticipantsList({
            participants: s.participants,
            count: s.participants.length
          });
        }
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
(function () {
  let socket = null;
  let state = { code: "" };

  function $(id) { return document.getElementById(id); }

  function getCodeFromQuery() {
    try {
      return localStorage.getItem('codde');
    } catch (e) { return null }
  }

  function renderQuestion(q_text) {
    if (document.querySelector('.waiting-overlay').classList.contains('display-flex')){
      inactiveWaitingOverlay()
    }
    document.querySelector('#questionBlockP').innerText = q_text
  }
  function waitNewQuestions(){
  }
  function lrm(key){
    localStorage.removeItem(key)
  }
  function lget(key){
    try { return localStorage.getItem(key); } catch (e) { return null }
  }
  function clearLAFS(){
    lrm('quizname'); lrm('qText'); lrm('interfaceStage'); lrm("allQuantity"); lrm('current_order'); lrm('userAnswered'); lrm('userTotal');
    try { localStorage.removeItem('in_quiz'); localStorage.removeItem('codde'); } catch (e) {}
  }
  function u (){
    
  }
  function updateCounter() {
    let usersCount = document.querySelectorAll('.mwop-user').length
    let usersCBtn = document.querySelector('.mwm-participants-count-count')
    usersCBtn.textContent = usersCount + 1

  }
  function switchInterfaceToRoom(qname){
    document.querySelector('#particles-js').classList.add('display-none')
    document.querySelector('.join-code-div').classList.remove('display-flex')
    document.querySelector('.join-code-div').classList.add('display-none')
    document.querySelector('.main-window').classList.remove('display-none')
    document.querySelector('.main-window').classList.add('display-flex')
    updateCounter()
  }

  function switchInterfaceToAnswerRoom(){
    document.querySelector('.main-window').classList.remove('display-flex')
    document.querySelector('.main-window').classList.add('display-none')
    document.querySelector('.div-section-answer').classList.remove('display-none')
    document.querySelector('.div-section-answer').classList.add('display-flex')
  }
  function activeWaitingOverlay(){
    document.querySelector('#answerInputI').value = ''
    document.querySelector('.waiting-overlay').classList.remove('display-none')
    document.querySelector('.waiting-overlay').classList.add('display-flex')
  }
  function inactiveWaitingOverlay(){
    document.querySelector('.waiting-overlay').classList.add('display-none')
    document.querySelector('.waiting-overlay').classList.remove('display-flex')
  }

  function renderParticipantsList(data) {
    
  }
  function attachEvents() {
    $("joinBtn").onclick = () => {
      let codde = document.querySelector('#code').value
      try { localStorage.setItem('codde', codde); localStorage.setItem('in_quiz', '1'); } catch (e) {}
      state.code = codde
      socket.emit("join", { code: codde });
      switchInterfaceToRoom();
    };

    $("code").addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("joinBtn").click();
    });

    $("enterQuestion").onclick = () => {
      let answer = document.querySelector('#answerInputI').value
      socket.emit('participant:answer', {code: state.code, answer: answer})
      activeWaitingOverlay()
    }

    socket.on("error", (e) => {
      console.log(e)
    });
    socket.on("finish_session", () => {
        clearLAFS()
    });
    socket.on("room:participants_list", (data) => {
      renderParticipantsList(data);
    });

    socket.on("room:state", (s) => {
      console.log(s)
      if (s.status === "WAITING"){
        switchInterfaceToRoom()
        document.querySelector('.main-window-quiz-name').innerText = s.quiz_name
      }
      if (s.status === "IN_PROGRESS"){
        switchInterfaceToAnswerRoom()
      }
        
        if (s.participants) {
          renderParticipantsList({participants: s.participants, count: s.participants.length});
        }
      
      if (s.question) renderQuestion(s.question.text);
    });

    socket.on("room:question", (q) => {
      console.log(q.text)
      renderQuestion(q.text);
    });

    socket.on("room:question_closed", (d) => {
    });

    socket.on("finish_session", (datas) => {
      window.location.href = `/history/${datas.session_id}/${document.getElementById('current_user_id').textContent}`
    });

    socket.on("room:participants_update", (data) => {
    
    });
    socket.on("kickedd", (data) => {
      window.location.href = '/'
    })

    socket.on('disconnect', () => {
      showResumeOverlay('Соединение потеряно. Нажмите «Вернуться», чтобы попытаться восстановить тест.');
    });

    socket.on('connect', () => {
      hideResumeOverlay();
      try {
        const wasInQuiz = localStorage.getItem('in_quiz');
        const savedCode = localStorage.getItem('codde');
        if (wasInQuiz === '1' && savedCode) {
          state.code = savedCode;
          socket.emit('join', { code: savedCode });
        }
      } catch (e) {}
    });
  }

  function showResumeOverlay(message){
    const overlay = document.getElementById('resume-overlay');
    if (!overlay) return;
    const msg = document.getElementById('resumeMessage');
    if (msg) msg.innerText = message || '';
    overlay.classList.remove('display-none');
    overlay.style.display = 'flex';
    const btn = document.getElementById('resumeBtn');
    const cancel = document.getElementById('resumeCancelBtn');
    if (btn) btn.onclick = () => {
      try {
        const savedCode = localStorage.getItem('codde');
        if (savedCode && document.getElementById('code')) {
          document.getElementById('code').value = savedCode;
        }
        if (document.getElementById('joinBtn')) document.getElementById('joinBtn').click();
      } catch (e) {}
      hideResumeOverlay();
    };
    if (cancel) cancel.onclick = () => { hideResumeOverlay(); };
  }

  function hideResumeOverlay(){
    const overlay = document.getElementById('resume-overlay');
    if (!overlay) return;
    overlay.classList.add('display-none');
    overlay.style.display = 'none';
  }

  document.addEventListener("DOMContentLoaded", () => {
    socket = io();
    attachEvents();
    const codeFromQuery = getCodeFromQuery();
    if (codeFromQuery && $("code")) $("code").value = codeFromQuery;
    try {
      const wasInQuiz = localStorage.getItem('in_quiz');
      const savedCode = localStorage.getItem('codde');
      if (wasInQuiz === '1' && savedCode) {
        showResumeOverlay('Вы были в тесте. Нажмите «Вернуться», чтобы продолжить.');
      }
    } catch (e) {}
  });
})();
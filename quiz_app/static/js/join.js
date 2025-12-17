(function () {
  let socket = null;
  let state = { code: "" };
  let users = []

  function $(id) { return document.getElementById(id); }

  function getCodeFromQuery() {
    code = localStorage.getItem('codde')
  }

  function renderQuestion(q_text) {
    if (document.querySelector('.waiting-overlay').classList.contains('display-flex')){
      inactiveWaitingOverlay()
    }
    document.querySelector('#questionBlockP').innerText = q_text
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
  function renderParticipant(participant){
    console.log(participant, 'renderpart')
    let area = document.querySelector('.main-window-other-participants')
    let div = document.createElement('div'); div.classList.add('mwop-user');
    let p = document.createElement('p'); p.textContent =`${participant.nickname}`;div.appendChild(p)
    area.appendChild(div)
  }
  function renderParticipantsList(data) {
    console.log(data)
    data.participants.forEach(participant => {
      users.push(participant)
      
      renderParticipant(participant)
    });
    document.querySelector('.mwm-participants-count-count').textContent = data.counter
  }
  function attachEvents() {
    $("joinBtn").onclick = () => {
      let codde = document.querySelector('#code').value
      socket.emit("join", { code: codde });
      state.code = codde
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
    });
    // socket.on("room:participants_list", (data) => {
    //   renderParticipantsList(data);
    // });

    socket.on("room:state", (s) => {
      console.log(s)
      if (s.status === "WAITING"){
        switchInterfaceToRoom()
        if (s.participants) {
          console.log(s.participants)
          renderParticipantsList({participants: s.participants, counter: s.participants.length});
        }
        window.history.replaceState({}, '', `/quiz/join/${s.quiz_code}`)
        document.querySelector('.main-window-quiz-name').innerText = s.quiz_name
      }
      if (s.status === "IN_PROGRESS"){
        switchInterfaceToAnswerRoom()
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
      // if (state.code) {
      //   socket.emit("request_participants", { code: state.code });
      // }
    });
    socket.on("kickedd", (data) => {
      window.location.href = '/'
    })
  }

  document.addEventListener("DOMContentLoaded", () => {
    socket = io();
    attachEvents();
    const codeFromQuery = getCodeFromQuery();
    if (codeFromQuery && $("code")) $("code").value = codeFromQuery;
  });
})();
(function () {
  let socket = null;
  let state = { code: window.location.href.split('/')[5] };
  console.log(state.code)

  function renderQuestion(q) {
    if (document.querySelector('.waiting-overlay').classList.contains('display-flex')){
      inactiveWaitingOverlay()
    }
    if (q.q_type === 'fform'){
      document.querySelector('#questionBlockPFF').innerText = q.text
    }
    if (q.q_type === 'select'){
      let variants = q.q_variants
      document.querySelector('#questionBlockPS').innerText = q.text
      let answers = document.querySelectorAll('.answer-text-qz').forEach((answr, indexx) => {
        answr.textContent = variants[indexx]
      })
      resetSelections()
    }
    if (q.q_type === 'letters'){
      
    }
  }
  function updateCounter() {
    let usersCount = document.querySelectorAll('.mwop-user').length
    let usersCBtn = document.querySelector('.mwm-participants-count-count')
    usersCBtn.textContent = usersCount + 1
  }
  
  const answerCards = document.querySelectorAll('.answer-card-qz');
  let selectedAnswers = new Set();

  answerCards.forEach(card => {
      card.addEventListener('click', () => {
          const answerId = card.dataset.id;
          
          if (selectedAnswers.has(answerId)) {
              selectedAnswers.delete(answerId);
              card.classList.remove('selected-qz');
          } else {
              selectedAnswers.add(answerId);
              card.classList.add('selected-qz');
          }
      });
  });

  function getAnswersString() {
      const cards = document.querySelectorAll('.answer-card-qz');
      const results = [];
      console.log('26783415678123467856782345678')
      
      cards.forEach(card => {
          const answerText = card.querySelector('.answer-text-qz').textContent;
          const isSelected = selectedAnswers.has(card.dataset.id);
          results.push(`${answerText}:${isSelected}`);
      });
      return results.join('|');
  }
  function resetSelections() {
      selectedAnswers.clear();
      
      answerCards.forEach(card => {
          card.classList.remove('selected-qz');
      });
  }
  function switchInterfaceToRoom(qname){
    document.querySelector('#particles-js').classList.add('display-none')
    document.querySelector('.join-code-div').classList.remove('display-flex')
    document.querySelector('.join-code-div').classList.add('display-none')
    document.querySelector('.main-window').classList.remove('display-none')
    document.querySelector('.main-window').classList.add('display-flex')
    updateCounter()
  }
  function switchInterfaceToSelectionAnswerRoom(){
    document.querySelector('.main-window').classList.remove('display-flex')
    document.querySelector('.main-window').classList.add('display-none')
    document.querySelector('#divSelectionAnswer').classList.remove('display-none')
    document.querySelector('#divSelectionAnswer').classList.add('display-flex')
    document.querySelector('#divfformAnswer').classList.remove('display-flex')
    document.querySelector('#divfformAnswer').classList.add('display-none')
  }
  function switchInterfaceToFFormAnswerRoom(){
    document.querySelector('.main-window').classList.remove('display-flex')
    document.querySelector('.main-window').classList.add('display-none')
    document.querySelector('#divfformAnswer').classList.remove('display-none')
    document.querySelector('#divfformAnswer').classList.add('display-flex')
    document.querySelector('#divSelectionAnswer').classList.remove('display-flex')
    document.querySelector('#divSelectionAnswer').classList.add('display-none')
  }
  function switchInterfaceToLettersAnswerRoom(){
    document.querySelector('.main-window').classList.remove('display-flex')
    document.querySelector('.main-window').classList.add('display-none')
    document.querySelector('#divLettersAnswer').classList.remove('display-none')
    document.querySelector('#divLettersAnswer').classList.add('display-flex')
  }
  function activeWaitingOverlay(answer){
    console.log('active waiting_overlay', answer)
    document.querySelector('#answerInputI').value = ''
    document.querySelector('.waiting-overlay').classList.remove('display-none')
    document.querySelector('.waiting-overlay').classList.add('display-flex')
    if(answer){
      console.log(document.querySelector('.waiting-div-answer'))
      document.querySelector('.waiting-div-answer').textContent = 'Ваша відповідь правильна'
    } else{
      document.querySelector('.waiting-div-answer').textContent = 'Ваша відповідь неправильна'
    }
  }
  function inactiveWaitingOverlay(){
    document.querySelector('.waiting-overlay').classList.add('display-none')
    document.querySelector('.waiting-overlay').classList.remove('display-flex')
  }
  function renderParticipant(participant){
    console.log("Айдишники renderpart:\n\n", +document.getElementById('current_user_id').textContent, participant.user_id)
    console.log(participant, 'renderParticipant')
    if(participant.user_id !== +document.getElementById('current_user_id').textContent){
      let area = document.querySelector('.main-window-other-participants')
      let div = document.createElement('div'); div.classList.add('mwop-user');
      let p = document.createElement('p'); p.textContent =`${participant.nickname}`;div.appendChild(p)
      area.appendChild(div)
    }
  }
  function renderParticipantsList(data) {
    console.log("Renderpart List:\n\n", data)

    data.participants.forEach(participant => {
      users.push(participant)
      
      renderParticipant(participant)
    });
    document.querySelector('.mwm-participants-count-count').textContent = data.counter
  }
  function attachEvents() {
    document.querySelector('#enterQuestionFF').addEventListener('click',() => {
      let answer = document.querySelector('#answerInputI').value
      socket.emit('participant:answer', {code: state.code, answer: answer})
    })
    document.querySelector('#enterQuestionS').addEventListener('click', () => {
      let answer = getAnswersString()
      console.log(answer, '12341234324')
      socket.emit('participant:answer', {code: state.code, answer: answer})
    })
    socket.on("error", (e) => {
      console.log(e)
    });
    socket.on("finish_session", () => {
    })

    socket.on("room:state", (s) => {
      console.log(s)
      if (s.status === "WAITING"){
        switchInterfaceToRoom()
        if (s.participants) {
          document.querySelectorAll('.mwop-user').forEach(usr => {
            usr.remove()
          })
          renderParticipantsList({participants: s.participants, counter: s.participants.length});
        }
        window.history.replaceState({}, '', `/quiz/join/${s.quiz_code}`)
        document.querySelector('.main-window-quiz-name').innerText = s.quiz_name
      }
      if (s.status === "IN_PROGRESS"){
        if(s.question.q_type === 'select') switchInterfaceToSelectionAnswerRoom()
        if(s.question.q_type === 'fform') switchInterfaceToFFormAnswerRoom()
        if(s.question.q_type === 'letters') switchInterfaceToLettersAnswerRoom()
        
      }
      
      if (s.question) renderQuestion(s.question);
    });

    socket.on("room:question", (q) => {
      console.log(q)
      renderQuestion(q);
    });

    socket.on("room:question_closed", (d) => {
    });

    socket.on("finish_session", (datas) => {
      window.location.href = `/history/${datas.session_id}/${document.getElementById('current_user_id').textContent}`
    });
    socket.on("kickedd", (data) => {
      window.location.href = '/'
    })
    socket.on('waiting_overlay', data => {
      console.log(data)
      if(data.overlay){
        console.log("overlayed")
        activeWaitingOverlay(data.answer)
      }
    })
  }

  document.addEventListener("DOMContentLoaded", () => {
    socket = io()
    console.log(123)
    attachEvents()
    socket.emit("join", { code: state.code })
  });
})();
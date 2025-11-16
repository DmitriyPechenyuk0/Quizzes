(function () {
    let socket = null;
    let code = "";

    function $(id) { return document.getElementById(id); }
    function lrm(key){
      localStorage.removeItem(key)
    }
    function clearLAFS(){
      lrm('quizname'); lrm('qText'); lrm('interfaceStage'); lrm("allQuantity"); lrm('current_order'); lrm('userAnswered'); lrm('userTotal')
    }
    function loadLocalStorageValues(){
      quizname = localStorage.getItem("quizname")
      allQuantity = localStorage.getItem("allQuantity")
      interfaceStage = localStorage.getItem("interfaceStage")
      qText = localStorage.getItem("qText")
      current_order = localStorage.getItem("current_order")
      if (interfaceStage == 'progress'){
        document.querySelector('.left-content').classList.remove('display-flex'); document.querySelector('.left-content').classList.add('display-none')
        document.querySelector('.left-content-afterstart').classList.remove('display-none'); document.querySelector('.left-content-afterstart').classList.add('display-flex')
        document.querySelector('.right-content-q-skipper').classList.remove('display-none'); document.querySelector('.right-content-q-skipper').classList.add('display-flex')
      }
      if (quizname && interfaceStage == 'progress'){
        document.querySelector('#lcaTitleElement').textContent = quizname
      }
      if (allQuantity && current_order && interfaceStage == 'progress'){
        document.querySelector('#lcacQQuantity').innerHTML = `${current_order} / ${allQuantity}`
      }
      if (qText && interfaceStage == 'progress'){
        document.querySelector('#lcaccmQuestion').innerHTML = `${qText}`
      }
      
    }

    function updateUserCounter(){
      let counter = document.querySelector('.right-content-title-count');
      counter.textContent = document.querySelectorAll('.right-content-user').length
    }
    
    function userRemover(user_id){
      let div = document.querySelector(`#usr_${user_id}`)
      div.remove()
    }

    function attachEvents() {
      $("start").onclick = () => {
        updateUserCounter()
        
        document.querySelector('.left-content').classList.remove('display-flex'); document.querySelector('.left-content').classList.add('display-none')
        document.querySelector('.left-content-afterstart').classList.remove('display-none'); document.querySelector('.left-content-afterstart').classList.add('display-flex')
        document.querySelector('.right-content-q-skipper').classList.remove('display-none'); document.querySelector('.right-content-q-skipper').classList.add('display-flex')
        
        socket.emit("teacher:start", { code })
        localStorage.setItem('interfaceStage', 'progress')
        socket.emit('switch_content', { code })
        socket.emit('check_answers', { code })
      };
      $("nextQ").onclick = () => {
        socket.emit('teacher:next', { code })
        socket.emit('check_answers', { code })
      }
      socket.on("update_answers", (info) => {
        document.querySelector('.rcqsCount').textContent = `${info.answered} / ${info.total}`
        localStorage.setItem('userAnswered', info.answered)
        localStorage.setItem('userTotal', info.total)
      })
      socket.on("room:state", (info) => {
        if ($("lcaTitleElement").textContent != info.quiz_name){
          
          $("lcaTitleElement").textContent = info.quiz_name
          localStorage.setItem('quizname', info.quiz_name)
        }
        
        if (info.question){
          

          console.log(info)
          document.getElementById('lcacQQuantity').textContent = `${ info.current_order } / ${info.question.q_quantity}`
          document.getElementById('lcaccmQuestion').textContent = info.question.text
          
          localStorage.setItem('current_order', info.current_order)
          localStorage.setItem('allQuantity', info.question.q_quantity)
          localStorage.setItem('qText', info.question.text)
        
        }
      })
      socket.on("room:answers_progress", (p) => {

        document.querySelector('.rcqsCount').textContent = `${p.answered} / ${p.total}`
        localStorage.setItem('userAnswered', p.answered)
        localStorage.setItem('userTotal', p.total)
      });
      
      socket.on("finish_session", (datas) => {
        clearLAFS()
        window.location.href = `/history/${datas.session_id}`
      });

      socket.on("room:participants_update", (info) => {
        console.log(info)
        if (info.sess_status == 'IN_PROGRESS'){
          let div = document.createElement("div");  div.id = `usr_${info.id}`; div.className = "right-content-user";
          let morediv = document.createElement("div"); morediv.className = "right-content-user-more";
          let rmusrButton = document.createElement("img"); rmusrButton.className = "remove-user-button"; rmusrButton.id = `rmusr_${info.id}`; rmusrButton.src = 'http://127.0.0.1:5000/quiz/quiz_static/images/remove-btn.svg'
  
          let profimg = document.createElement("img"); profimg.className = "right-content-user-more-profile-avatar"; profimg.src = "http://127.0.0.1:5000/quiz/quiz_static/images/profile-avatar.svg"
          let spanName = document.createElement("span"); spanName.className = "right-content-user-more-name"; spanName.textContent = info.nickname
  
          morediv.appendChild(profimg); morediv.appendChild(spanName)
          div.appendChild(morediv); div.appendChild(rmusrButton)
          document.querySelector('.right-content-users-div').append(div)
          updateUserCounter()
          for (let btn of document.querySelectorAll('.remove-user-button')){
            btn.addEventListener('click', () => {
              userRemover(btn.id.split('_')[1])
              socket.emit('rm_user_from_session', {code, user_id: btn.id.split('_')[1]})
              updateUserCounter()
            })
          }
        } else{
          let pokaznik = document.querySelector('.mlcupud');
          let p = document.createElement('p'); p.classList.add('mlcupud-user-p'); p.textContent = `${info.nickname}`
          let div = document.createElement('div'); div.classList.add('mlcupud-user'); div.appendChild(p)
          pokaznik.appendChild(div)
        }
      })
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
      loadLocalStorageValues()
      document.querySelector('#copyCodeButton').addEventListener('click', () => {
        navigator.clipboard.writeText(document.querySelector('#copyCodeButton').className).then(() => console.log("Done!")).catch(err => console.error(err))
      })
      document.querySelectorAll('.mlcupud-user').forEach((btn) => {
        btn.addEventListener('click', () => {
          console.log(btn)
        })
      })
    });
})();
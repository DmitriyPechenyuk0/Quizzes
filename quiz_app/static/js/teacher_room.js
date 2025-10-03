(function () {
    let socket = null;
    let code = "";

    function $(id) { return document.getElementById(id); }

    function clearUI({ keepState = false } = {}) {
      // $("question").innerHTML = "";
      // $("progress").innerText = "";
      // if (!keepState) $("state").innerText = "";
    }
    function updateUserCounter(){
      let counter = document.querySelector('.right-content-title-count');
      counter.textContent = document.querySelectorAll('.right-content-user').length
    }
   
    function renderQuestion(q) {
      clearUI({ keepState: false });

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
        socket.emit('switch_content', { code })
      };
      
      // $("next").onclick = () => socket.emit("teacher:next", { code });
      // $("finish").onclick = () => socket.emit("teacher:finish", { code });

      socket.on("room:state", (info) => {
        if ($("lcaTitleElement").textContent != info.quiz_name) $("lcaTitleElement").textContent = info.quiz_name

        if (info.question){
          renderQuestion(info.question)
          console.log(info)
          document.getElementById('lcacQQuantity').textContent = `${ info.current_order } / ${info.question.q_quantity}`
          document.getElementById('lcaccmQuestion').textContent = info.question.text
          
        };
      });

      socket.on("room:question", (q) => {
        renderQuestion(q);
      });

      socket.on("room:answers_progress", (p) => {
        document.querySelector('.rcqsCount').textContent = `${p.answered}/${p.total}`
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

      socket.on("room:participants_update", (info) => {
        console.log(info)
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
    });
})();


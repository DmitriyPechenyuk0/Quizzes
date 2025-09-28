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

      socket.on("room:participants_updated", (participants) => {
        renderParticipants(participants);
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















(function () {
    let socket = null;
    let code = "";
    let staticUrls = {};

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

   
    function loadStaticUrls() {
        const staticUrlsElement = document.getElementById('static-urls');
        if (staticUrlsElement) {
            staticUrls.profileAvatar = staticUrlsElement.getAttribute('data-profile-avatar');
            staticUrls.removeBtn = staticUrlsElement.getAttribute('data-remove-btn');
        }
        

        if (!staticUrls.profileAvatar) {
            staticUrls.profileAvatar = '/static/quiz_app/images/profile-avatar.svg';
        }
        if (!staticUrls.removeBtn) {
            staticUrls.removeBtn = '/static/quiz_app/images/remove-btn.svg';
        }
        
    }

  
    function renderParticipants(participantsData) {
        const participantsList = document.getElementById('participants-list');
        const participantsCount = document.getElementById('participants-count');
        
        if (!participantsList) return;
        
       
        if (participantsCount) {
            participantsCount.textContent = `Учасники (${participantsData.count || 0})`;
        }
        
      
        participantsList.innerHTML = '';
        
      
        if (participantsData.participants && participantsData.participants.length > 0) {
            participantsData.participants.forEach(participant => {
                const participantElement = document.createElement('div');
                participantElement.className = 'participant-item-remove-btn';
                
            
                participantElement.innerHTML = `
                    <div class="participant-item">
                        <img src="${staticUrls.profileAvatar}" alt="User" onerror="this.style.display='none'">
                        <h3>${participant.nickname}</h3>
                    </div>
                    <img src="${staticUrls.removeBtn}" alt="Remove" class="remove-participant-btn" data-user-id="${participant.user_id}">
                `;
                
                participantsList.appendChild(participantElement);
            });
            

            const removeButtons = document.querySelectorAll('.remove-participant-btn, .remove-btn-text');
            removeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const userId = e.target.getAttribute('data-user-id');
                    if (userId) {
                        socket.emit("teacher:remove_participant", { code: code, user_id: userId });
                    }
                });
            });
        } else {

            const emptyElement = document.createElement('div');
            participantsList.appendChild(emptyElement);
        }
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
        
    
        if (info.participants) {
            renderParticipants({
                participants: info.participants,
                count: info.participants.length
            });
        }
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


      socket.on("room:participants_list", (data) => {

        renderParticipants(data);
      });


      socket.on("room:participants_update", (data) => {


        socket.emit("request_participants", { code: code });
      });

      socket.on("teacher:participant_removed", (data) => {


        socket.emit("request_participants", { code: code });
      });
    }
    
    document.addEventListener("DOMContentLoaded", () => {
        const hostRoot = document.getElementById("host-root");
        code = hostRoot?.dataset?.code || "";
        if (!code) {
          return;
        }

        loadStaticUrls();

        socket = io();
        socket.emit("join", { code, as_host: true });
        attachEvents();
      
       
        setTimeout(() => {
            socket.emit("request_participants", { code: code });
        }, 1000);
    });
})();
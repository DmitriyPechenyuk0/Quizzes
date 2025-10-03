(function () {
    let socket = null;
    let code = "";
    let staticUrls = {};
    let currentQuestion = null;
    let quizQuestions = [];

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


    function switchToStudentInterface() {
        const teacherContent = document.getElementById('teacherRoomContent');
        const studentContent = document.getElementById('studentContent');
        const studentStyles = document.getElementById('studentStyles');
        
        if (teacherContent) {
            teacherContent.classList.add('content-hidden');
            teacherContent.classList.remove('content-visible');
        }
        
        if (studentContent) {
            studentContent.classList.remove('content-hidden');
            studentContent.classList.add('content-visible');
        }
        
        if (studentStyles) {
            studentStyles.disabled = false;
        }
        
      
        loadFirstQuestion();
    }


    function loadFirstQuestion() {
        socket.emit("teacher:get_questions", { code: code });
    }

  
    function displayQuestionInStudentInterface(question) {
        currentQuestion = question;
        
        const questionFrame = document.getElementById('questionFrame');
        const answersContainer = document.getElementById('answersContainer');
        
        if (questionFrame) {
            questionFrame.innerHTML = `<h1>${question.text}</h1>`;
        }
        
        if (answersContainer) {
            answersContainer.innerHTML = '';
            
           
            if (question.answers && question.answers.length > 0) {
                const colors = ['blue', 'green', 'yellow', 'red'];
                
                question.answers.forEach((answer, index) => {
                    const answerContainer = document.createElement('div');
                    answerContainer.className = 'answer-container';
                    
                    answerContainer.innerHTML = `
                        <p class="answers-options-frame-${colors[index % colors.length]}">${answer.text}</p>
                        <input type="checkbox" class="answer-checkbox" data-answer-id="${answer.id}">
                    `;
                    
                    answersContainer.appendChild(answerContainer);
                });
            } else {
               
                answersContainer.innerHTML = `
                    <div class="text-answer-container">
                        <input type="text" id="textAnswer" placeholder="Введіть вашу відповідь..." style="width: 100%; padding: 10px; margin: 10px 0;">
                        <button id="submitTextAnswer" style="padding: 10px 20px;">Надіслати відповідь</button>
                    </div>
                `;
                
        
                const submitBtn = document.getElementById('submitTextAnswer');
                if (submitBtn) {
                    submitBtn.onclick = () => {
                        const answerText = document.getElementById('textAnswer').value;
                        if (answerText.trim()) {
                            socket.emit("participant:answer", { 
                                code: code, 
                                answer: answerText,
                                question_id: question.id 
                            });
                            alert('Відповідь надіслано!');
                        }
                    };
                }
            }
        }
    }

   
    function goToNextQuestion() {
        socket.emit("teacher:next_question", { code: code });
    }

   
    function finishQuiz() {
        socket.emit("teacher:finish_quiz", { code: code });
    }

    function attachEvents() {
    
        $("start").onclick = () => {
            socket.emit("teacher:start", { code });
            socket.emit("switch_content", { code });
            switchToStudentInterface();
        };
        
        $("next").onclick = () => socket.emit("teacher:next", { code });
        $("finish").onclick = () => socket.emit("teacher:finish", { code });

        document.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'nextQuestion') {
                goToNextQuestion();
            }
            if (e.target && e.target.id === 'finishQuiz') {
                finishQuiz();
            }
        });

        socket.on("room:state", (info) => {
            $("state").innerText = JSON.stringify(info, null, 2);
            if (info.question) {
                renderQuestion(info.question);
    
                displayQuestionInStudentInterface(info.question);
            }
            
            if (info.participants) {
                renderParticipants({
                    participants: info.participants,
                    count: info.participants.length
                });
            }
        });

        socket.on("room:question", (q) => {
            renderQuestion(q);
            displayQuestionInStudentInterface(q);
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
            $("stats").innerHTML = `<pre>${JSON.stringify(res, null, 2)}</pre>`;
            
       
            const studentContent = document.getElementById('studentContent');
            if (studentContent) {
                studentContent.innerHTML = `
                    <div class="section">
                        <div class="title-div">
                            <p class="title-p">Результати вікторини</p>
                        </div>
                        <div class="div-content">
                            <div class="results-container">
                                <h2>Фінальні результати:</h2>
                                <div id="finalResultsList"></div>
                            </div>
                        </div>
                    </div>
                `;
                
                const resultsList = document.getElementById('finalResultsList');
                if (resultsList && Array.isArray(res)) {
                    res.forEach((result, index) => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'result-item';
                        resultItem.innerHTML = `
                            <h3>${index + 1}. ${result.nickname} - ${result.score} балів</h3>
                        `;
                        resultsList.appendChild(resultItem);
                    });
                }
            }
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

        socket.on("teacher:questions_list", (data) => {
            quizQuestions = data.questions || [];
            if (quizQuestions.length > 0) {
                displayQuestionInStudentInterface(quizQuestions[0]);
            }
        });

     
        socket.on("teacher:next_question_response", (data) => {
            if (data.question) {
                displayQuestionInStudentInterface(data.question);
            } else if (data.finished) {
                finishQuiz();
            }
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
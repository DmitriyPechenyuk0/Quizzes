(function () {
  /* ═══════════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════════ */
  const STATE = {
    currentSection  : 'join',    // 'join' | 'lobby' | 'quiz'
    sessionCode     : null,
    questionType    : 'select',  // 'select' | 'fform' | 'letters'
    selectedAnswers : new Set(),
    textAnswerVal   : '',
    questionIndex   : 0,
    totalQuestions  : 0,
    timerSecs       : 0,
    timerMax        : 0,
    timerInterval   : null,
    answerSubmitted : false,
    currentQuestion : null,
  };

  /* ═══════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════ */
  function currentUserId() {
    return +document.getElementById('current_user_id').textContent.trim();
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION SWITCHING
  ═══════════════════════════════════════════════════════════════ */
  function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    STATE.currentSection = name;
    if (name !== 'join') {
      document.getElementById('headerSessionCode').style.display = '';
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     JOIN SECTION
  ═══════════════════════════════════════════════════════════════ */
  const codeInput      = document.getElementById('codeInput');
  const joinBtn        = document.getElementById('joinBtn');
  const hintText       = document.getElementById('joinHintText');
  const hintEl         = document.getElementById('joinFormHint');
  const joinWaitingOvr = document.getElementById('joinWaitingOverlay');

  codeInput.addEventListener('input', () => {
    const v = codeInput.value.replace(/\D/g, '');
    if (codeInput.value !== v) codeInput.value = v;

    joinBtn.disabled = v.length !== 6;
    hintEl.classList.remove('error');

    if (v.length === 0)    hintText.textContent = 'Лише цифри, 6 символів';
    else if (v.length < 6) hintText.textContent = `Ще ${6 - v.length} символів…`;
    else                   hintText.textContent = 'Готово! Натисніть кнопку нижче';
  });

  codeInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !joinBtn.disabled) attemptJoin();
  });

  joinBtn.addEventListener('click', attemptJoin);

  document.getElementById('cancelJoinBtn').addEventListener('click', () => {
    joinWaitingOvr.classList.remove('show');
    STATE.sessionCode = null;
  });

  function attemptJoin() {
    const code = codeInput.value.trim();
    if (code.length !== 6) return;

    STATE.sessionCode = code;
    document.getElementById('headerCode').textContent = code;
    joinWaitingOvr.classList.add('show');

    socket.emit('join', { code });
  }

  function setJoinError(msg) {
    joinWaitingOvr.classList.remove('show');
    codeInput.classList.add('input-error');
    hintEl.classList.add('error');
    hintText.textContent = msg;
    setTimeout(() => codeInput.classList.remove('input-error'), 400);
  }

  function enterLobby(s) {
    if (s.quiz_name) document.getElementById('lobbyQuizName').textContent = s.quiz_name;
    if (s.quiz_code) document.getElementById('headerCode').textContent    = s.quiz_code;
    if (s.subject)   document.getElementById('lobbySubject').textContent  = s.subject;
    if (s.teacher)   document.getElementById('lobbyTeacher').textContent  = s.teacher;

    if (s.participants) {
      document.getElementById('lobbyParticipantsList').innerHTML = '';
      s.participants.forEach(p => addParticipantChip(p));
      updateLobbyCount(s.participants.length, s.participants.length);
    }

    if (s.quiz_code) {
      window.history.replaceState({}, '', `/quiz/join/${s.quiz_code}`);
    }

    setLobbyPending(false);
    joinWaitingOvr.classList.remove('show');
    showSection('lobby');
  }

  function updateLobbyCount(connected, total) {
    document.getElementById('lobbyConnectedCount').textContent = connected;
    document.getElementById('lobbyTotalCount').textContent     = total;
  }

  function addParticipantChip(participant) {
    const container = document.getElementById('lobbyParticipantsList');

    const existing = container.querySelector(`[data-uid="${participant.user_id}"]`);
    if (existing) existing.remove();

    const chip   = document.createElement('div');
    chip.className   = 'participant-chip';
    chip.dataset.uid = participant.user_id;

    const name     = participant.nickname || participant.name || '?';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isSelf   = participant.user_id === currentUserId();

    chip.innerHTML = `
      <div class="participant-avatar" style="${isSelf ? 'color:var(--green);border-color:var(--green);' : ''}">${initials}</div>
      <span class="participant-name" style="${isSelf ? 'color:var(--text);' : ''}">${name}${isSelf ? ' (ви)' : ''}</span>
    `;
    container.appendChild(chip);

    const chips = container.querySelectorAll('.participant-chip').length;
    updateLobbyCount(chips, chips);
  }

  function setLobbyPending(isPending) {
    document.getElementById('lobbyStatusConnected').style.display = isPending ? 'none' : '';
    document.getElementById('lobbyStatusPending').style.display   = isPending ? ''    : 'none';
  }

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function loadQuestion(q) {
    STATE.currentQuestion  = q;
    STATE.questionType     = q.q_type;
    STATE.selectedAnswers  = new Set();
    STATE.textAnswerVal    = '';
    STATE.answerSubmitted  = false;

    document.getElementById('resultOverlay').classList.remove('show');
    document.getElementById('quizWaitingOverlay').classList.remove('show');

    document.getElementById('qText').textContent = q.text || '';

    const imgWrap = document.getElementById('qImageWrap');
    if (q.image_url) {
      document.getElementById('qImage').src = q.image_url;
      imgWrap.style.display = 'block';
    } else {
      imgWrap.style.display = 'none';
    }

    if (q.index !== undefined && q.total !== undefined) {
      STATE.questionIndex  = q.index;
      STATE.totalQuestions = q.total;
      setProgress(q.index, q.total);
      document.getElementById('qProgressLabel').textContent   = `Питання ${q.index} з ${q.total}`;
      document.getElementById('resultWaitingSub').textContent = `Питання ${q.index} з ${q.total}`;
    }

    if (q.q_type === 'select') {
      renderSelectAnswers(q.q_variants || []);
      document.getElementById('choiceWrap').style.display = 'block';
      document.getElementById('textWrap').style.display   = 'none';
    } else {
      document.getElementById('choiceWrap').style.display = 'none';
      document.getElementById('textWrap').style.display   = 'flex';
      document.getElementById('textAnswer').value         = '';
      document.getElementById('charCount').textContent    = '0 / 300';
    }

    updateSubmitBtn();
    startTimer(q.time_limit || 30);
    showSection('quiz');
  }

  function renderSelectAnswers(variants) {
    const grid = document.getElementById('answersGrid');
    grid.innerHTML = '';

    variants.forEach((text, i) => {
      const letter = LETTERS[i] || String(i + 1);
      const card   = document.createElement('div');
      card.className    = 'ans-card';
      card.dataset.id   = String(i + 1);
      card.dataset.text = text;

      card.innerHTML = `
        <div class="ans-idx">${letter}</div>
        <div class="ans-text">${text}</div>
      `;
      card.addEventListener('click', () => toggleSelectAnswer(card));
      grid.appendChild(card);
    });
  }

  function toggleSelectAnswer(card) {
    if (STATE.answerSubmitted) return;
    const id = card.dataset.id;

    if (STATE.selectedAnswers.has(id)) {
      STATE.selectedAnswers.delete(id);
      card.classList.remove('selected');
    } else {
      STATE.selectedAnswers.add(id);
      card.classList.add('selected');
    }
    updateSubmitBtn();
  }
  window.onTextInput = function (el) {
    STATE.textAnswerVal = el.value;
    const count = document.getElementById('charCount');
    count.textContent  = `${el.value.length} / 300`;
    count.style.color  = el.value.length > 270 ? 'var(--warn)' : '';
    updateSubmitBtn();
  };

  function updateSubmitBtn() {
    const btn = document.getElementById('submitBtn');
    let valid = false;
    if (!STATE.answerSubmitted) {
      valid = STATE.questionType === 'select'
        ? STATE.selectedAnswers.size > 0
        : STATE.textAnswerVal.trim().length > 0;
    }
    btn.disabled = !valid;
  }

  function buildAnswerPayload() {
    if (STATE.questionType === 'fform') {
      return document.getElementById('textAnswer').value;
    }
    const cards   = document.querySelectorAll('#answersGrid .ans-card');
    const results = [];
    cards.forEach(card => {
      const text       = card.dataset.text || card.querySelector('.ans-text').textContent;
      const isSelected = STATE.selectedAnswers.has(card.dataset.id);
      results.push(`${text}:${isSelected}`);
    });
    return results.join('|');
  }

  window.submitAnswer = function (auto = false) {
    if (STATE.answerSubmitted) return;
    STATE.answerSubmitted = true;
    clearInterval(STATE.timerInterval);

    const answer = buildAnswerPayload();
    updateSubmitBtn();

    socket.emit('participant:answer', {
      code  : STATE.sessionCode,
      answer: answer,
    });
  };

  function showResultModal(isCorrect) {
    clearInterval(STATE.timerInterval);

    const top     = document.getElementById('resultTop');
    const icon    = document.getElementById('resultIcon');
    const iconSvg = document.getElementById('resultIconSvg');
    const verdict = document.getElementById('resultVerdict');
    const sub     = document.getElementById('resultSub');
    const reveal  = document.getElementById('correctReveal');

    top.className     = 'result-top '     + (isCorrect ? 'correct' : 'wrong');
    icon.className    = 'result-icon '    + (isCorrect ? 'correct' : 'wrong');
    verdict.className = 'result-verdict ' + (isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      iconSvg.innerHTML   = '<polyline points="4,12 9,17 20,6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      verdict.textContent = 'Правильно!';
      sub.textContent     = 'Чудова робота — ваша відповідь вірна.';
      reveal.style.display = 'none';
    } else {
      iconSvg.innerHTML   = '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>';
      verdict.textContent = 'Невірно';
      sub.textContent     = 'Ваша відповідь не збігається з правильною.';
      reveal.style.display = 'none';
    }

    document.getElementById('statTime').textContent     = '—';
    document.getElementById('statAvgTime').textContent  = '—';
    document.getElementById('statAnswered').textContent = '—';

    document.getElementById('resultOverlay').classList.add('show');
  }

  function hideResultModal() {
    document.getElementById('resultOverlay').classList.remove('show');
  }

  function formatTime(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function startTimer(seconds) {
    STATE.timerSecs = seconds;
    STATE.timerMax  = seconds;
    clearInterval(STATE.timerInterval);

    const valEl   = document.getElementById('qTimerVal');
    const timerEl = document.getElementById('qTimer');

    valEl.textContent = formatTime(seconds);
    timerEl.className = 'q-timer';

    STATE.timerInterval = setInterval(() => {
      STATE.timerSecs--;
      valEl.textContent = formatTime(STATE.timerSecs);
      timerEl.className = 'q-timer' +
        (STATE.timerSecs <= 10 ? ' crit' : STATE.timerSecs <= 20 ? ' warn' : '');

      if (STATE.timerSecs <= 0) {
        clearInterval(STATE.timerInterval);
        if (!STATE.answerSubmitted) window.submitAnswer(true);
      }
    }, 1000);
  }

  function setProgress(q, total) {
    document.getElementById('progressBar').style.width =
      total > 0 ? ((q / total) * 100) + '%' : '0%';
  }

  window.openLightbox = function (wrap) {
    const img = wrap.querySelector('img');
    document.getElementById('lightboxImg').src             = img.src;
    document.getElementById('lightboxImg').alt             = img.alt;
    document.getElementById('lightboxCaption').textContent = img.alt;
    document.getElementById('lightboxOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function (e) {
    if (!e ||
        e.target === document.getElementById('lightboxOverlay') ||
        e.currentTarget.classList.contains('lightbox-close')) {
      document.getElementById('lightboxOverlay').classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('lightboxOverlay').classList.remove('show');
      document.body.style.overflow = '';
    }
  });

  let socket;

  document.addEventListener('DOMContentLoaded', () => {
    socket = io();

    socket.on('room:state', s => {
      console.log('[room:state]', s);

      if (s.status === 'WAITING') {
        enterLobby(s);
      }

      if (s.status === 'IN_PROGRESS') {
        if (s.question) loadQuestion(s.question);
      }
    });

    socket.on('room:question', q => {
      console.log('[room:question]', q);
      loadQuestion(q);
    });

    socket.on('room:question_closed', () => {
      clearInterval(STATE.timerInterval);
      if (!STATE.answerSubmitted) window.submitAnswer(true);
      hideResultModal();
      document.getElementById('quizWaitingOverlay').classList.add('show');
    });

    socket.on('waiting_overlay', data => {
      console.log('[waiting_overlay]', data);
      if (data.overlay) {
        document.getElementById('quizWaitingOverlay').classList.remove('show');
        showResultModal(data.answer);
      } else {
        hideResultModal();
      }
    });

    socket.on('finish_session', datas => {
      clearInterval(STATE.timerInterval);
      hideResultModal();
      document.getElementById('quizWaitingOverlay').classList.remove('show');
      window.location.href = `/history/${datas.session_id}/${currentUserId()}`;
    });

    socket.on('kickedd', () => {
      window.location.href = '/';
    });

    socket.on('error', e => {
      console.error('[error]', e);
      if (STATE.currentSection === 'join') {
        setJoinError(e.message || 'Помилка підключення. Перевірте код.');
      }
    });
  });
})();
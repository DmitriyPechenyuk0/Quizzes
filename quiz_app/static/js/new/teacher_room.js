'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
const code = document.getElementById('hostcode').textContent.trim();

let socket;
let sessionStatus   = 'WAITING';
let currentQuestion = null;
let currentAnswers  = { answered: 0, total: 0, participants: [] };
let timerSecs       = 30;
let timerInterval   = null;
let donutChartInst  = null;

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    socket = io();
    socket.emit('join', { code, as_host: true });
    bindSocketEvents();
    bindUIEvents();
    // Start in lobby
    showSection('lobby');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOCKET EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

function bindSocketEvents() {
    socket.on('room:state',               onRoomState);
    socket.on('room:question',            onRoomQuestion);
    socket.on('room:answers_progress',    onAnswersProgress);
    socket.on('room:participants_update', onParticipantUpdate);
    socket.on('room:user_kicked',         onUserKicked);
    socket.on('finish_session',           onFinishSession);
    socket.on('error',                    onSocketError);
}

function onRoomState(data) {
    sessionStatus = data.status;

    if (data.status === 'WAITING') {
        showSection('lobby');
        renderLobbyParticipants(data.participants || []);

    } else if (data.status === 'IN_PROGRESS') {
        showSection('quiz');

        if (data.question && (!currentQuestion || currentQuestion.id !== data.question.id)) {
            currentQuestion = data.question;
            renderQuestion(data.question);
            resetTimer(30);
        }

        renderStudentsPanel(data.participants || []);
        updateProgressUI(data.participants || []);

    } else if (data.status === 'FINISHED') {
        onFinishSession({});
    }
}

function onRoomQuestion(q) {
    currentQuestion = q;
    currentAnswers  = { answered: 0, total: currentAnswers.total, participants: [] };

    showSection('quiz');
    renderQuestion(q);
    resetStudentsAnsweredState();
    updateProgressUI([]);
    resetTimer(30);

    clearRespList();
    document.getElementById('qz-resp-eyebrow').textContent = 'Відповіді — 0 з 0 учнів';
    activateTab('q');
}

function onAnswersProgress(data) {
    currentAnswers = data;
    updateStudentsAnsweredStatus(data.participants);
    updateProgressUI(data.participants);
    renderResponsesTab(data);
}

function onParticipantUpdate(data) {
    if (sessionStatus === 'WAITING') {
        appendLobbyCard({ user_id: data.id, nickname: data.nickname });
        refreshLobbyCount();
    } else {
        appendStudentCard({ user_id: data.id, nickname: data.nickname, answered: false, is_correct: null });
        refreshQuizCount();
    }
}

function onUserKicked(data) {
    removeCardById(data.id, 'participantsList');
    refreshLobbyCount();
    removeCardById(data.id, 'qz-students-list');
    removeCardById(data.id, 'qz-students-list-mob');
    refreshQuizCount();
}

function onFinishSession(_data) {
    stopTimer();
    sessionStatus = 'FINISHED';
    document.getElementById('finish-overlay').classList.add('show');
}

function onSocketError(data) {
    console.error('[QuizSocket]', data.message);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI EVENT BINDINGS
// ═══════════════════════════════════════════════════════════════════════════════

function bindUIEvents() {

    // ── Lobby ──
    document.getElementById('startBtn').addEventListener('click', () => {
        socket.emit('teacher:start', { code });
    });

    // ── Tabs ──
    document.querySelectorAll('.qz-tabs-bar .qz-tab').forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    });

    // ── Reveal badges button ──
    document.getElementById('qz-rev-btn').addEventListener('click', () => {
        const list = document.getElementById('qz-resp-list');
        const btn  = document.getElementById('qz-rev-btn');
        list.classList.toggle('show-badges');
        btn.classList.toggle('on');
    });

    // ── Timer: +30s buttons (all share the same class) ──
    document.querySelectorAll('.qz-add-time-btn').forEach(btn => {
        btn.addEventListener('click', () => addTime(30));
    });

    // ── Desktop: End / Next question ──
    const desktopEndBtn  = document.querySelector('.qz-control-row .qz-btn-end');
    const desktopNextBtn = document.querySelector('.qz-control-row .qz-btn-next-q');
    if (desktopEndBtn)  desktopEndBtn.addEventListener('click', openEndModal);
    if (desktopNextBtn) desktopNextBtn.addEventListener('click', openResultsModal);

    // ── Sheet: End / Next question ──
    const sheetEndBtn  = document.querySelector('.qz-control-sheet .qz-btn-end');
    const sheetNextBtn = document.querySelector('.qz-control-sheet .qz-btn-next-q');
    if (sheetEndBtn)  sheetEndBtn.addEventListener('click',  () => { closeControlSheet(); openEndModal(); });
    if (sheetNextBtn) sheetNextBtn.addEventListener('click', () => { closeControlSheet(); openResultsModal(); });

    // ── End modal ──
    document.getElementById('qz-end-cancel').addEventListener('click', closeEndModal);
    document.getElementById('qz-end-confirm').addEventListener('click', () => {
        closeEndModal();
        openResultsModal();
    });
    document.getElementById('qz-end-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeEndModal();
    });

    // ── Results modal ──
    document.getElementById('qz-res-close').addEventListener('click', closeResultsModal);
    document.getElementById('qz-res-btn-close').addEventListener('click', closeResultsModal);
    document.getElementById('qz-res-btn-next').addEventListener('click', nextQuestionAction);
    document.getElementById('qz-res-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeResultsModal();
    });

    // ── Mobile drawer ──
    document.getElementById('qz-mob-students-btn').addEventListener('click', openDrawer);
    document.getElementById('qz-drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('qz-students-drawer').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeDrawer();
    });

    // ── Mobile control sheet ──
    // HTML: id="qz-control-sheet" on the overlay div
    document.getElementById('qz-mob-ctrl-btn').addEventListener('click', openControlSheet);
    document.getElementById('qz-control-sheet').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeControlSheet();
    });

    // ── Finish: go home ──
    document.getElementById('finish-btn-home').addEventListener('click', () => {
        window.location.href = '/';
    });

    // ── Global Escape ──
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        closeEndModal();
        closeResultsModal();
        closeDrawer();
        closeControlSheet();
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function showSection(name) {
    const lobby = document.getElementById('view-lobby');
    const quiz  = document.getElementById('view-quiz');

    lobby.style.display = (name === 'lobby') ? '' : 'none';

    // #view-quiz uses display:flex in CSS (.active), so set explicitly
    if (name === 'quiz') {
        quiz.style.display = 'flex';
    } else {
        quiz.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════════════════════════════════

function renderLobbyParticipants(participants) {
    const list = document.getElementById('participantsList');
    list.innerHTML = '';
    participants.forEach(p => appendLobbyCard(p));
    refreshLobbyCount();
}

function appendLobbyCard(student) {
    const list = document.getElementById('participantsList');
    if (list.querySelector(`[data-student-id="${student.user_id}"]`)) return;

    const initials = makeInitials(student.nickname);
    const card = document.createElement('div');
    card.className = 'student-cardq';
    card.setAttribute('data-student-id', student.user_id);
    card.innerHTML = `
        <div class="student-contentq">
            <div class="student-infoq">
                <div class="avatarq"><span class="avatar-textq">${initials}</span></div>
                <div class="student-detailsq"><p class="student-nameq">${escHtml(student.nickname)}</p></div>
            </div>
            <button class="remove-btnq" title="Вилучити">
                <i class="bi bi-x-lg remove-iconq"></i>
            </button>
        </div>
    `;
    card.querySelector('.remove-btnq').addEventListener('click', () => kickStudent(student.user_id));
    list.appendChild(card);
}

function refreshLobbyCount() {
    const count = document.querySelectorAll('#participantsList .student-cardq').length;
    document.getElementById('connectedCount').textContent = count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ — QUESTION RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

function renderQuestion(q) {
    document.getElementById('qz-q-eyebrow').textContent = `Питання ${q.order_index} з ${q.q_quantity}`;
    document.getElementById('qz-q-text').textContent    = q.text;

    setTextAll(['qz-q-cur', 'mob-q-cur', 'sheet-q-cur'], q.order_index);
    setTextAll(['qz-q-tot', 'mob-q-tot', 'sheet-q-tot'], q.q_quantity);

    // Populate header pills if data available
    const subjectEl = document.getElementById('qz-quiz-subject');
    const codeEl    = document.getElementById('qz-session-code');
    if (subjectEl && q.subject) subjectEl.textContent = q.subject;
    if (codeEl)                 codeEl.textContent    = '#' + code;

    const grid = document.getElementById('qz-answers-grid');
    grid.innerHTML = '';

    if (q.q_type === 'select' && Array.isArray(q.q_variants) && q.q_variants.length) {
        const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
        q.q_variants.forEach((variant, i) => {
            const card = document.createElement('div');
            // CSS class: .qz-a-card
            card.className = 'qz-a-card';
            card.innerHTML = `
                <div class="qz-a-idx">${LABELS[i] || (i + 1)}</div>
                <div class="qz-a-text">${escHtml(variant)}</div>
            `;
            grid.appendChild(card);
        });
    } else {
        // CSS class: .qz-freeform-note
        const typeLabel = q.q_type === 'letters' ? 'Вибір букв' : 'Відкрита відповідь';
        const typeHint  = q.q_type === 'letters'
            ? 'Учні складають відповідь з літер'
            : 'Учні вводять відповідь вручну';
        const note = document.createElement('div');
        note.className = 'qz-freeform-note';
        note.innerHTML = `
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8" cy="8" r="5"/><line x1="8" y1="5" x2="8" y2="8.5"/><line x1="8" y1="10.5" x2="8.01" y2="10.5"/>
            </svg>
            <span>${typeLabel} — ${typeHint}</span>
        `;
        grid.appendChild(note);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ — STUDENTS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function renderStudentsPanel(participants) {
    document.getElementById('qz-students-list').innerHTML     = '';
    document.getElementById('qz-students-list-mob').innerHTML = '';
    participants.forEach(p => appendStudentCard(p));
    refreshQuizCount();
    updateProgressUI(participants);
}

function appendStudentCard(student) {
    const mainList   = document.getElementById('qz-students-list');
    const drawerList = document.getElementById('qz-students-list-mob');

    if (mainList.querySelector(`[data-student-id="${student.user_id}"]`)) return;

    const initials = makeInitials(student.nickname);
    const isDone   = !!student.answered;

    [mainList, drawerList].forEach(list => {
        const card = document.createElement('div');
        // CSS class: .qz-s-card
        card.className = `qz-s-card${isDone ? ' done' : ''}`;
        card.setAttribute('data-student-id', student.user_id);
        card.innerHTML = `
            <div class="qz-s-avatar">${initials}
                <div class="qz-check-dot">
                    <svg viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2"/></svg>
                </div>
            </div>
            <div class="qz-s-info">
                <div class="qz-s-name">${escHtml(student.nickname)}</div>
                <div class="qz-s-status">${isDone ? 'Відповів' : 'Думає...'}</div>
            </div>
            <button class="qz-s-remove" title="Вилучити">
                <svg viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
            </button>
        `;
        card.querySelector('.qz-s-remove').addEventListener('click', () => kickStudent(student.user_id));
        list.appendChild(card);
    });
}

function updateStudentsAnsweredStatus(participants) {
    participants.forEach(p => {
        if (!p.answered) return;
        document.querySelectorAll(`[data-student-id="${p.user_id}"]`).forEach(card => {
            // CSS class: .qz-s-card
            if (card.classList.contains('qz-s-card') && !card.classList.contains('done')) {
                card.classList.add('done');
                const status = card.querySelector('.qz-s-status');
                if (status) status.textContent = 'Відповів';
            }
        });
    });
}

function resetStudentsAnsweredState() {
    document.querySelectorAll('#qz-students-list .qz-s-card, #qz-students-list-mob .qz-s-card').forEach(card => {
        card.classList.remove('done');
        const status = card.querySelector('.qz-s-status');
        if (status) status.textContent = 'Думає...';
    });
}

function updateProgressUI(participants) {
    const total    = currentAnswers.total !== undefined && currentAnswers.total > 0
        ? currentAnswers.total
        : participants.length;
    const answered = currentAnswers.answered !== undefined
        ? currentAnswers.answered
        : participants.filter(p => p.answered).length;
    const pct = total > 0 ? Math.round(answered / total * 100) : 0;

    document.querySelectorAll('.qz-prog-fill').forEach(el => el.style.width = pct + '%');
    setTextAll(['qz-answered-count', 'qz-answered-count-mob'], answered);
    setTextAll(['qz-answered-total', 'qz-answered-total-mob'], total);
}

function refreshQuizCount() {
    const count = document.querySelectorAll('#qz-students-list .qz-s-card').length;
    setTextAll(['qz-total-count', 'qz-total-count-mob'], count);
    const mobBadge = document.getElementById('qz-mob-students-cnt');
    if (mobBadge) mobBadge.textContent = count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ — RESPONSES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function clearRespList() {
    const list = document.getElementById('qz-resp-list');
    list.innerHTML = '<div class="qz-resp-empty">Поки що ніхто не відповів</div>';
    list.classList.remove('show-badges');
    const btn = document.getElementById('qz-rev-btn');
    if (btn) btn.classList.remove('on');
}

function renderResponsesTab(data) {
    const list = document.getElementById('qz-resp-list');

    // Remove empty-state placeholder on first answer
    const emptyEl = list.querySelector('.qz-resp-empty');
    if (emptyEl && data.participants.some(p => p.answered)) emptyEl.remove();

    const existingIds = new Set(
        [...list.querySelectorAll('[data-resp-id]')].map(el => el.dataset.respId)
    );

    data.participants.filter(p => p.answered).forEach(p => {
        const uid = String(p.user_id);
        if (existingIds.has(uid)) return;

        const initials = makeInitials(p.username);
        const row = document.createElement('div');
        // CSS class: .qz-resp-row
        row.className = 'qz-resp-row';
        row.setAttribute('data-resp-id', uid);
        row.innerHTML = `
            <div class="qz-r-avatar">${initials}</div>
            <div class="qz-r-name">${escHtml(p.username)}</div>
            <span class="qz-r-badge ${p.is_correct ? 'ok' : 'no'}">${p.is_correct ? '✓ Вірно' : '✗ Невірно'}</span>
        `;
        list.appendChild(row);
        existingIds.add(uid);
    });

    const total = data.total || currentAnswers.total || 0;
    document.getElementById('qz-resp-eyebrow').textContent =
        `Відповіді — ${data.answered} з ${total} учнів`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMER
// ═══════════════════════════════════════════════════════════════════════════════

function resetTimer(secs = 30) {
    stopTimer();
    timerSecs = secs;
    renderTimer();
    timerInterval = setInterval(() => {
        timerSecs--;
        renderTimer();
        if (timerSecs <= 0) {
            stopTimer();
            const anyOpen = ['qz-end-modal', 'qz-res-modal'].some(id =>
                document.getElementById(id).classList.contains('show')
            );
            if (!anyOpen) openEndModal();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function addTime(secs) {
    timerSecs += secs;
    if (timerSecs > 0 && !timerInterval) {
        timerInterval = setInterval(() => {
            timerSecs--;
            renderTimer();
            if (timerSecs <= 0) stopTimer();
        }, 1000);
    }
    renderTimer();
}

function renderTimer() {
    const display = formatTime(timerSecs);
    const cls     = timerSecs <= 10 ? 'crit' : timerSecs <= 20 ? 'warn' : '';

    const timerEl = document.getElementById('qz-timer-num');
    if (timerEl) {
        timerEl.textContent = display;
        timerEl.className   = ['qz-timer-num', cls].filter(Boolean).join(' ');
    }

    const mobEl = document.getElementById('qz-mob-timer');
    if (mobEl) {
        mobEl.textContent = display;
        mobEl.className   = ['qz-mob-stat-value', 'qz-timer-num', cls].filter(Boolean).join(' ');
    }

    const sheetEl = document.getElementById('qz-sheet-timer');
    if (sheetEl) {
        sheetEl.textContent = display;
        sheetEl.className   = ['qz-sheet-value', 'qz-timer-num', cls].filter(Boolean).join(' ');
    }
}

function formatTime(s) {
    const ss = Math.max(0, s);
    return String(Math.floor(ss / 60)).padStart(2, '0') + ':' + String(ss % 60).padStart(2, '0');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════════

function activateTab(name) {
    document.querySelectorAll('#view-quiz .qz-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#view-quiz .qz-tabs-bar .qz-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('qz-panel-' + name)?.classList.add('active');
    document.querySelector(`#view-quiz .qz-tab[data-tab="${name}"]`)?.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
// END-QUESTION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function openEndModal() {
    const answered    = currentAnswers.answered || 0;
    const total       = currentAnswers.total    ||
                        document.querySelectorAll('#qz-students-list .qz-s-card').length;
    const notAnswered = total - answered;

    const desc = document.getElementById('qz-end-modal-desc');
    desc.innerHTML = notAnswered > 0
        ? `Лише <strong>${answered} з ${total} учнів</strong> встигли відповісти. ` +
          `${notAnswered} учн. не зможуть надати відповідь.`
        : `<strong>Усі ${total} учнів</strong> вже відповіли. Можна переходити далі.`;

    document.getElementById('qz-end-modal').classList.add('show');
}

function closeEndModal() {
    document.getElementById('qz-end-modal').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function openResultsModal() {
    stopTimer();
    populateResultsModal();
    document.getElementById('qz-res-modal').classList.add('show');
    setTimeout(initResultsCharts, 80);
}

function closeResultsModal() {
    document.getElementById('qz-res-modal').classList.remove('show');
    destroyCharts();
}

function nextQuestionAction() {
    closeResultsModal();
    clearRespList();
    socket.emit('teacher:next', { code });
}

function populateResultsModal() {
    const participants = currentAnswers.participants || [];
    const total     = currentAnswers.total    || participants.length;
    const answered  = currentAnswers.answered || participants.filter(p => p.answered).length;
    const correct   = participants.filter(p => p.is_correct === true).length;
    const wrong     = participants.filter(p => p.answered && p.is_correct === false).length;
    const noAnswer  = total - answered;
    const pct       = answered > 0 ? Math.round(correct / answered * 100) : 0;

    if (currentQuestion) {
        const titleEl = document.getElementById('qz-res-q-title');
        if (titleEl) titleEl.textContent =
            `Питання ${currentQuestion.order_index} з ${currentQuestion.q_quantity}`;
    }

    setElText('qz-score-num',       pct + '%');
    setElText('qz-stat-correct',    `${correct} / ${answered}`);
    setElText('qz-stat-incorrect',  `${wrong} / ${answered}`);
    setElText('qz-stat-notanswered', noAnswer);

    // Participants list inside results modal — CSS: .qz-res-p-row etc.
    const resParts = document.getElementById('qz-res-participants');
    if (resParts) {
        resParts.innerHTML = '';
        participants.forEach(p => {
            const statusOk = p.is_correct === true;
            const answered = !!p.answered;
            const cls      = answered ? (statusOk ? 'ok' : 'no') : 'no';
            const row = document.createElement('div');
            row.className = 'qz-res-p-row';
            row.innerHTML = `
                <div class="qz-res-p-avatar ${cls}">${makeInitials(p.username)}</div>
                <div class="qz-res-p-name">${escHtml(p.username)}</div>
                <span class="qz-res-p-badge ${cls}">
                    ${!answered ? '— Без відп.' : statusOk ? '✓ Вірно' : '✗ Невірно'}
                </span>
            `;
            resParts.appendChild(row);
        });
    }
}

function initResultsCharts() {
    const participants = currentAnswers.participants || [];
    const correct   = participants.filter(p => p.is_correct === true).length;
    const wrong     = participants.filter(p => p.answered && p.is_correct === false).length;
    const noAnswer  = (currentAnswers.total || 0) - (currentAnswers.answered || 0);

    const donutCtx = document.getElementById('qz-donut-chart')?.getContext('2d');
    if (donutCtx) {
        if (donutChartInst) donutChartInst.destroy();
        donutChartInst = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [correct || 0, wrong || 0, noAnswer || 0],
                    backgroundColor: ['rgba(0,230,118,0.85)', 'rgba(255,64,64,0.4)', 'rgba(80,80,80,0.3)'],
                    borderColor:     ['rgba(0,230,118,1)',    'rgba(255,64,64,0.7)', 'rgba(80,80,80,0.5)'],
                    borderWidth: 1,
                    hoverOffset: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#161616',
                        borderColor: '#343434',
                        borderWidth: 1,
                        callbacks: {
                            label: ctx =>
                                ['Вірно', 'Невірно', 'Без відповіді'][ctx.dataIndex] + ': ' + ctx.parsed
                        }
                    }
                }
            }
        });
    }
}

function destroyCharts() {
    if (donutChartInst) { donutChartInst.destroy(); donutChartInst = null; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE
// ═══════════════════════════════════════════════════════════════════════════════

function openDrawer()  { document.getElementById('qz-students-drawer').classList.add('show'); }
function closeDrawer() { document.getElementById('qz-students-drawer').classList.remove('show'); }

// HTML: overlay has id="qz-control-sheet"
function openControlSheet()  { document.getElementById('qz-control-sheet').classList.add('show'); }
function closeControlSheet() { document.getElementById('qz-control-sheet').classList.remove('show'); }

// ═══════════════════════════════════════════════════════════════════════════════
// KICK STUDENT
// ═══════════════════════════════════════════════════════════════════════════════

function kickStudent(userId) {
    document.querySelectorAll(`[data-student-id="${userId}"]`).forEach(card => {
        animateRemoveCard(card);
    });
    socket.emit('rm_user_from_session', { code, user_id: userId });
    setTimeout(() => {
        refreshLobbyCount();
        refreshQuizCount();
    }, 350);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function makeInitials(name) {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    return (words.length > 1
        ? words.map(w => w[0]).join('')
        : name.slice(0, 2)
    ).toUpperCase().slice(0, 3);
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function setTextAll(ids, value) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

function setElText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function removeCardById(userId, listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    const card = list.querySelector(`[data-student-id="${userId}"]`);
    if (card) animateRemoveCard(card);
}

function animateRemoveCard(card) {
    if (!card || card._removing) return;
    card._removing = true;
    const h = card.offsetHeight;
    card.style.overflow     = 'hidden';
    card.style.transition   = 'all 0.25s ease';
    card.style.opacity      = '0';
    card.style.transform    = 'translateX(-1vw)';
    card.style.maxHeight    = h + 'px';
    setTimeout(() => {
        card.style.maxHeight    = '0';
        card.style.padding      = '0';
        card.style.marginBottom = '0';
        card.style.border       = 'none';
    }, 60);
    setTimeout(() => card.remove(), 320);
}
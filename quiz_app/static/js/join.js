let socket = io();

// --- DOM элементы ---
const codeInput      = document.getElementById('codeInput');
const joinBtn        = document.getElementById('joinBtn');
const hintText       = document.getElementById('joinHintText');
const hintEl         = document.getElementById('joinFormHint');
const joinWaitingOvr = document.getElementById('joinWaitingOverlay');

function currentUserId() {
    return +document.getElementById('current_user_id').textContent.trim();
}

// --- Инпут кода ---
codeInput.addEventListener('input', () => {
    const v = codeInput.value.replace(/\D/g, '');
    if (codeInput.value !== v) codeInput.value = v;

    joinBtn.disabled = v.length !== 6;
    hintEl.classList.remove('error');

    if (v.length === 0)         hintText.textContent = 'Лише цифри, 6 символів';
    else if (v.length < 6)      hintText.textContent = `Ще ${6 - v.length} символів…`;
    else                        hintText.textContent = 'Готово! Натисніть кнопку нижче';
});

codeInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !joinBtn.disabled) attemptJoin();
});

joinBtn.addEventListener('click', attemptJoin);

function attemptJoin() {
    const code = codeInput.value.trim();
    if (code.length !== 6) return;
    socket.emit('join', { code });
    joinWaitingOvr.classList.add('show');
}

socket.on('room:state', s => {
    console.log('[room:state]', s);

    if (s.status === 'WAITING') {
        enterLobby(s);
    }

    if (s.status === 'IN_PROGRESS') {
        if (s.question) loadQuestion(s.question);
    }
});

socket.on('participant:joined', participant => {
    addParticipantChip(participant);
});

socket.on('participant:left', ({ user_id }) => {
    const chip = document.querySelector(`#lobbyParticipantsList [data-uid="${user_id}"]`);
    if (chip) chip.remove();
    updateLobbyCount();
});

socket.on('room:question', q => {
    console.log('[room:question]', q);
    loadQuestion(q);
});

socket.on('error', e => {
    console.error('[error]', e);
    joinWaitingOvr.classList.remove('show');
    hintEl.classList.add('error');
    hintText.textContent = e.message || 'Помилка підключення. Перевірте код.';
});

function enterLobby(s) {
    if (s.quiz_name) document.getElementById('lobbyQuizName').textContent = s.quiz_name;

    const list = document.getElementById('lobbyParticipantsList');
    list.innerHTML = '';

    if (s.participants) {
        s.participants.forEach(p => addParticipantChip(p));
    }

    joinWaitingOvr.classList.remove('show');
    showSection('lobby');
}

function addParticipantChip(participant) {
    const container = document.getElementById('lobbyParticipantsList');

    const existing = container.querySelector(`[data-uid="${participant.user_id}"]`);
    if (existing) existing.remove();

    const name     = participant.nickname || '?';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isSelf   = participant.user_id === currentUserId();

    const chip         = document.createElement('div');
    chip.className     = 'participant-chip';
    chip.dataset.uid   = participant.user_id;
    chip.innerHTML     = `
        <div class="participant-avatar" ${isSelf ? 'style="color:var(--green);border-color:var(--green);"' : ''}>${initials}</div>
        <span class="participant-name" ${isSelf ? 'style="color:var(--text);"' : ''}>${name}${isSelf ? ' (ви)' : ''}</span>
    `;

    container.appendChild(chip);
    updateLobbyCount();
}

function updateLobbyCount() {
    const count = document.querySelectorAll('#lobbyParticipantsList .participant-chip').length;
    document.getElementById('lobbyConnectedCount').textContent = count;
    document.getElementById('lobbyTotalCount').textContent     = count;
}

function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
}
// let socket = io();

// // --- DOM элементы ---
// const codeInput      = document.getElementById('codeInput');
// const joinBtn        = document.getElementById('joinBtn');
// const hintText       = document.getElementById('joinHintText');
// const hintEl         = document.getElementById('joinFormHint');
// const joinWaitingOvr = document.getElementById('joinWaitingOverlay');

// function currentUserId() {
//     return +document.getElementById('current_user_id').textContent.trim();
// }

// // --- Инпут кода ---
// codeInput.addEventListener('input', () => {
//     const v = codeInput.value.replace(/\D/g, '');
//     if (codeInput.value !== v) codeInput.value = v;

//     joinBtn.disabled = v.length !== 6;
//     hintEl.classList.remove('error');

//     if (v.length === 0)         hintText.textContent = 'Лише цифри, 6 символів';
//     else if (v.length < 6)      hintText.textContent = `Ще ${6 - v.length} символів…`;
//     else                        hintText.textContent = 'Готово! Натисніть кнопку нижче';
// });

// codeInput.addEventListener('keydown', e => {
//     if (e.key === 'Enter' && !joinBtn.disabled) attemptJoin();
// });

// joinBtn.addEventListener('click', attemptJoin);

// function attemptJoin() {
//     const code = codeInput.value.trim();
//     if (code.length !== 6) return;
//     socket.emit('join', { code });
//     joinWaitingOvr.classList.add('show');
// }

// socket.on('room:state', s => {
//     console.log('[room:state]', s);

//     if (s.status === 'WAITING') {
//         enterLobby(s);
//     }

//     if (s.status === 'IN_PROGRESS') {
//         if (s.question) loadQuestion(s.question);
//     }
// });

// socket.on('participant:joined', participant => {
//     addParticipantChip(participant);
// });

// socket.on('participant:left', ({ user_id }) => {
//     const chip = document.querySelector(`#lobbyParticipantsList [data-uid="${user_id}"]`);
//     if (chip) chip.remove();
//     updateLobbyCount();
// });

// socket.on('room:question', q => {
//     console.log('[room:question]', q);
//     loadQuestion(q);
// });

// socket.on('error', e => {
//     console.error('[error]', e);
//     joinWaitingOvr.classList.remove('show');
//     hintEl.classList.add('error');
//     hintText.textContent = e.message || 'Помилка підключення. Перевірте код.';
// });

// function enterLobby(s) {
//     if (s.quiz_name) document.getElementById('lobbyQuizName').textContent = s.quiz_name;

//     const list = document.getElementById('lobbyParticipantsList');
//     list.innerHTML = '';

//     if (s.participants) {
//         s.participants.forEach(p => addParticipantChip(p));
//     }

//     joinWaitingOvr.classList.remove('show');
//     showSection('lobby');
// }

// function addParticipantChip(participant) {
//     const container = document.getElementById('lobbyParticipantsList');

//     const existing = container.querySelector(`[data-uid="${participant.user_id}"]`);
//     if (existing) existing.remove();

//     const name     = participant.nickname || '?';
//     const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
//     const isSelf   = participant.user_id === currentUserId();

//     const chip         = document.createElement('div');
//     chip.className     = 'participant-chip';
//     chip.dataset.uid   = participant.user_id;
//     chip.innerHTML     = `
//         <div class="participant-avatar" ${isSelf ? 'style="color:var(--green);border-color:var(--green);"' : ''}>${initials}</div>
//         <span class="participant-name" ${isSelf ? 'style="color:var(--text);"' : ''}>${name}${isSelf ? ' (ви)' : ''}</span>
//     `;

//     container.appendChild(chip);
//     updateLobbyCount();
// }

// function updateLobbyCount() {
//     const count = document.querySelectorAll('#lobbyParticipantsList .participant-chip').length;
//     document.getElementById('lobbyConnectedCount').textContent = count;
//     document.getElementById('lobbyTotalCount').textContent     = count;
// }

// function showSection(name) {
//     document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
//     document.getElementById('section-' + name).classList.add('active');
// }

/* ═══════════════════════════════════════════════════════════════
   student_room.js  —  Student Quiz View  [FIXED]
═══════════════════════════════════════════════════════════════ */

"use strict";

// ════════════════════════════════════════════════════════
// 1. ДАНІ З DOM
// BUG FIX: "student-data" не існує в HTML-шаблоні.
//          Читаємо user_id із <div id="current_user_id">
// ════════════════════════════════════════════════════════

const STUDENT_USER_ID = parseInt(
    document.getElementById("current_user_id")?.textContent?.trim()
) || null;
const STUDENT_NICKNAME = "";   // не передається в шаблоні — залишаємо порожнім

// ════════════════════════════════════════════════════════
// 2. СТАН ДОДАТКУ
// ════════════════════════════════════════════════════════

let socket          = null;
let sessionCode     = null;
let currentQuestion = null;
let selectedAnswer  = null;
let hasAnswered     = false;
let _timerInterval  = null;
let _timerSeconds   = 0;

// ════════════════════════════════════════════════════════
// 3. СЕКЦІЇ
// ════════════════════════════════════════════════════════

function showSection(name) {
    ["join", "lobby", "quiz"].forEach((s) => {
        document.getElementById("section-" + s)
            ?.classList.toggle("active", s === name);
    });
    if (name !== "quiz") {
        _overlayHide("quizWaitingOverlay");
        _overlayHide("resultOverlay");
    }
}

// ════════════════════════════════════════════════════════
// 4. JOIN
// BUG FIX: "joinHint" → "joinFormHint" (реальний id в HTML)
// ════════════════════════════════════════════════════════

function setJoinState(state) {
    const input   = document.getElementById("codeInput");
    const btn     = document.getElementById("joinBtn");
    const hint    = document.getElementById("joinFormHint");   // FIX: було "joinHint"
    const hintTxt = document.getElementById("joinHintText");
    const overlay = document.getElementById("joinWaitingOverlay");

    input.classList.remove("sr-input-error");
    hint?.classList.remove("error");
    overlay.classList.remove("show");

    const map = {
        idle:    { btnDisabled: true,  txt: "Лише цифри, 6 символів",           err: false, ov: false },
        waiting: { btnDisabled: true,  txt: "",                                   err: false, ov: true  },
        error:   { btnDisabled: false, txt: "Сесія не знайдена або недоступна",  err: true,  ov: false },
        kicked:  { btnDisabled: true,  txt: "Вас видалили з сесії",              err: true,  ov: false },
    };
    const cfg = map[state] ?? map.idle;

    btn.disabled = cfg.btnDisabled;
    hintTxt.textContent = cfg.txt;

    if (cfg.err) {
        hint?.classList.add("error");
        input.classList.add("sr-input-error");
        setTimeout(() => input.classList.remove("sr-input-error"), 400);
    }
    if (cfg.ov) overlay.classList.add("show");
}

// ════════════════════════════════════════════════════════
// 5. ЛОБІ
// BUG FIX: видалено звернення до "lobbyCode" — елемент відсутній у HTML
// ════════════════════════════════════════════════════════

function updateLobbyMeta(data) {
    document.getElementById("lobbySubject").textContent  = data.quiz_subject || "—";
    document.getElementById("lobbyQuizName").textContent = data.quiz_name    || "—";
    document.getElementById("lobbyTeacher").textContent  =
        data.quiz_owner?.name ?? data.quiz_owner?.username ?? "—";
    // "lobbyCode" не існує в HTML — прибрано
}

function updateParticipants(list) {
    const container = document.getElementById("lobbyParticipantsList");
    if (!container) return;
    container.innerHTML = "";

    list.forEach((p, i) => {
        const isSelf = p.user_id === STUDENT_USER_ID;
        const initials = (p.nickname || "?")
            .split(" ")
            .map((w) => w[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase();

        const chip = document.createElement("div");
        chip.className = "sr-participant-chip";
        chip.style.animationDelay = i * 0.05 + "s";
        chip.innerHTML = `
            <div class="sr-participant-avatar"
                 style="${isSelf ? "color:var(--sr-green);border-color:var(--sr-green);" : ""}">
                ${initials}
            </div>
            <span class="sr-participant-name"
                  style="${isSelf ? "color:var(--sr-text);" : ""}">
                ${p.nickname}${isSelf ? " (ви)" : ""}
            </span>`;
        container.appendChild(chip);
    });

    document.getElementById("lobbyConnectedCount").textContent = list.length;
    document.getElementById("lobbyTotalCount").textContent     = list.length;
}

function setLobbyStatus(status) {
    document.getElementById("lobbyStatusConnected").style.display =
        status === "connected" ? "" : "none";
    document.getElementById("lobbyStatusPending").style.display =
        status === "pending" ? "" : "none";
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

function _parseVariants(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.length) {
        return raw.split("|").map((v) => v.split(":")[0].trim()).filter(Boolean);
    }
    return [];
}

function renderQuestion(q) {
    currentQuestion = q;
    selectedAnswer  = null;
    hasAnswered     = false;

    _setProgress(q.order_index, q.q_quantity);
    startTimer();

    document.getElementById("qText").textContent = q.text;

    const choiceWrap = document.getElementById("choiceWrap");
    const textWrap   = document.getElementById("textWrap");
    const imgWrap    = document.getElementById("qImageWrap");
    const submitBtn  = document.getElementById("submitBtn");

    choiceWrap.style.display = "none";
    textWrap.style.display   = "none";
    imgWrap.style.display    = "none";
    submitBtn.disabled       = true;

    if (q.q_image) {
        document.getElementById("qImage").src = q.q_image;
        imgWrap.style.display = "block";
    }

    if (q.q_type === "select") {
        _renderSelectVariants(_parseVariants(q.q_variants));
        choiceWrap.style.display = "block";
    } else if (q.q_type === "fform" || q.q_type === "letters") {
        const ta = document.getElementById("textAnswer");
        ta.value       = "";
        ta.placeholder = q.q_type === "fform"
            ? "Введіть вашу відповідь тут..."
            : "Введіть відповідь (слово або число)...";
        ta.rows = q.q_type === "fform" ? 5 : 2;
        document.getElementById("charCount").textContent = "0 / 300";
        textWrap.style.display = "flex";
    }
}

function _renderSelectVariants(variants) {
    const grid = document.getElementById("answersGrid");
    grid.innerHTML = "";

    if (!variants.length) {
        grid.innerHTML = `<p style="color:var(--sr-text-3)">Варіанти відповіді відсутні</p>`;
        return;
    }

    variants.forEach((text, i) => {
        const card = document.createElement("div");
        card.className     = "sr-ans-card";
        card.dataset.value = text;
        card.innerHTML = `
            <div class="sr-ans-idx">${LABELS[i] ?? i + 1}</div>
            <div class="sr-ans-text">${text}</div>`;

        card.addEventListener("click", () => {
            if (hasAnswered) return;
            selectedAnswer = text;
            document.querySelectorAll(".sr-ans-card")
                .forEach((c) => c.classList.remove("selected"));
            card.classList.add("selected");
            document.getElementById("submitBtn").disabled = false;
        });

        grid.appendChild(card);
    });
}

// ════════════════════════════════════════════════════════
// 7. ТАЙМЕР
// BUG FIX: "sr-q-timer" → "q-timer" (реальний клас в HTML)
// ════════════════════════════════════════════════════════

function startTimer() {
    stopTimer();
    _timerSeconds = 0;
    _renderTimer();
    _timerInterval = setInterval(() => { _timerSeconds++; _renderTimer(); }, 1000);
}

function stopTimer() {
    if (_timerInterval !== null) {
        clearInterval(_timerInterval);
        _timerInterval = null;
    }
}

function _renderTimer() {
    const m = Math.floor(_timerSeconds / 60).toString().padStart(2, "0");
    const s = (_timerSeconds % 60).toString().padStart(2, "0");
    document.getElementById("qTimerVal").textContent = `${m}:${s}`;
    document.getElementById("qTimer").className = "q-timer";  // FIX: було "sr-q-timer"
}

function _getElapsedTime() {
    const m = Math.floor(_timerSeconds / 60).toString().padStart(2, "0");
    const s = (_timerSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// ════════════════════════════════════════════════════════
// 8. ПРОГРЕС-БАР
// BUG FIX: "srProgressBar" → "progressBar"
// BUG FIX: "resultWaitingProgress" → "resultWaitingSub"
// ════════════════════════════════════════════════════════

function _setProgress(current, total) {
    const label = `Питання ${current} з ${total}`;
    document.getElementById("qProgressLabel").textContent  = label;
    document.getElementById("resultWaitingSub").textContent = label;  // FIX: було "resultWaitingProgress"
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    document.getElementById("progressBar").style.width = pct + "%";   // FIX: було "srProgressBar"
}

// ════════════════════════════════════════════════════════
// 9. ОВЕРЛЕЇ
// ════════════════════════════════════════════════════════

function _overlayShow(id) { document.getElementById(id)?.classList.add("show"); }
function _overlayHide(id) { document.getElementById(id)?.classList.remove("show"); }

// ════════════════════════════════════════════════════════
// 10. РЕЗУЛЬТАТ ВІДПОВІДІ
// BUG FIX: ".sr-result-modal" → ".result-modal"
// BUG FIX: "sr-result-top/icon/verdict" → "result-top/icon/verdict"
// ════════════════════════════════════════════════════════

function showAnswerResult(isCorrect) {
    const elapsedTime = _getElapsedTime();
    stopTimer();
    hasAnswered = true;
    document.getElementById("submitBtn").disabled = true;

    const overlay = document.getElementById("resultOverlay");
    const top     = document.getElementById("resultTop");
    const icon    = document.getElementById("resultIcon");
    const iconSvg = document.getElementById("resultIconSvg");
    const verdict = document.getElementById("resultVerdict");
    const sub     = document.getElementById("resultSub");
    const reveal  = document.getElementById("correctReveal");

    // Ре-тригер анімації
    const modal = overlay.querySelector(".result-modal");  // FIX: було ".sr-result-modal"
    if (modal) {
        modal.style.animation = "none";
        void modal.offsetHeight;
        modal.style.animation = "";
    }

    if (isCorrect) {
        top.className     = "result-top correct";      // FIX: було "sr-result-top correct"
        icon.className    = "result-icon correct";     // FIX: було "sr-result-icon correct"
        verdict.className = "result-verdict correct";  // FIX: було "sr-result-verdict correct"
        iconSvg.innerHTML = '<polyline points="4,12 9,17 20,6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
        verdict.textContent = "Правильно!";
        sub.textContent     = "Чудова робота — ваша відповідь вірна.";
    } else {
        top.className     = "result-top wrong";        // FIX
        icon.className    = "result-icon wrong";       // FIX
        verdict.className = "result-verdict wrong";    // FIX
        iconSvg.innerHTML = '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>';
        verdict.textContent = "Невірно";
        sub.textContent     = "Ваша відповідь не збігається з правильною.";
    }

    reveal.style.display = "none";

    document.getElementById("statTime").textContent     = elapsedTime;
    document.getElementById("statAvgTime").textContent  = "—";
    document.getElementById("statAnswered").textContent = "—";

    _overlayShow("resultOverlay");
}

function updateResultStats(data) {
    document.getElementById("statAnswered").textContent =
        `${data.answered ?? "—"}/${data.total ?? "—"}`;
}

// ════════════════════════════════════════════════════════
// 11. ФУНКЦІЇ ДЛЯ HTML-АТРИБУТІВ (onclick / oninput)
// BUG FIX: ці функції викликались з HTML але не були визначені в JS
// ════════════════════════════════════════════════════════

/** Викликається через onclick="submitAnswer()" на кнопці */
function submitAnswer() {
    if (!currentQuestion || hasAnswered) return;

    let answer = null;
    if (currentQuestion.q_type === "select") {
        answer = selectedAnswer;
    } else {
        answer = document.getElementById("textAnswer").value.trim();
    }

    if (!answer) return;

    document.getElementById("submitBtn").disabled = true;
    socket.emit("participant:answer", { code: sessionCode, answer });
}

/** Викликається через oninput="onTextInput(this)" на textarea */
function onTextInput(el) {
    const len = el.value.length;
    document.getElementById("charCount").textContent = `${len} / 300`;
    if (currentQuestion?.q_type === "fform" || currentQuestion?.q_type === "letters") {
        document.getElementById("submitBtn").disabled = len === 0;
    }
}

/** Викликається через onclick="openLightbox(this)" на обгортці зображення */
function openLightbox(el) {
    const img = el.querySelector("img");
    if (img?.src) {
        document.getElementById("lightboxImg").src = img.src;
        const caption = document.getElementById("lightboxCaption");
        if (caption) caption.textContent = img.alt || "";
        _overlayShow("lightboxOverlay");
    }
}

/** Викликається через onclick="closeLightbox(event)" */
function closeLightbox(event) {
    const overlay = document.getElementById("lightboxOverlay");
    if (
        event.target === overlay ||
        event.target.closest(".lightbox-close")
    ) {
        _overlayHide("lightboxOverlay");
    }
}

// ════════════════════════════════════════════════════════
// 12. EVENT LISTENERS
// ════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

    const codeInput = document.getElementById("codeInput");
    const joinBtn   = document.getElementById("joinBtn");
    const hintTxt   = document.getElementById("joinHintText");
    const joinHint  = document.getElementById("joinFormHint");  // FIX: було "joinHint"

    // ── Введення коду ──────────────────────────────────
    codeInput.addEventListener("input", () => {
        codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
        const len = codeInput.value.length;
        if (len === 6) {
            joinBtn.disabled = false;
            hintTxt.textContent = "Готово! Натисніть кнопку нижче";
            joinHint?.classList.remove("error");
        } else {
            joinBtn.disabled = true;
            hintTxt.textContent = `Лише цифри, 6 символів (${len}/6)`;
        }
    });

    // ── Приєднатись ────────────────────────────────────
    joinBtn.addEventListener("click", () => {
        const code = codeInput.value.trim();
        if (code.length !== 6) return;
        sessionCode = code;
        setJoinState("waiting");
        socket.emit("join", { code, as_host: false });
    });

    // ── Lightbox через кнопку закриття ─────────────────
    // (додатково до onclick="closeLightbox(event)" в HTML)
    document.getElementById("lightboxOverlay")
        ?.addEventListener("click", (e) => {
            if (e.target === e.currentTarget) _overlayHide("lightboxOverlay");
        });

    initSocket();
});

// ════════════════════════════════════════════════════════
// 13. WEBSOCKET
// BUG FIX: "srProgressBar" → "progressBar"
// BUG FIX: "joinHint" → "joinFormHint"
// BUG FIX: ".sr-status-title/.sr-status-text" → ".lobby-status-title/.lobby-status-text"
// ════════════════════════════════════════════════════════

function initSocket() {
    socket = io();

    socket.on("connect",    () => console.log("[socket] connected:", socket.id));
    socket.on("disconnect", () => console.warn("[socket] disconnected"));
    socket.on("error",      (d) => console.error("[socket] error:", d?.message));

    // ── room:state ──────────────────────────────────────
    socket.on("room:state", (data) => {
        console.log("[socket] room:state", data);

        // FIX: Завжди ховаємо join-overlay при будь-якому room:state.
        // Це головний "сигнал" що сервер нас прийняв — незалежно від статусу.
        document.getElementById("joinWaitingOverlay").classList.remove("show");

        updateLobbyMeta(data);
        if (data.participants) updateParticipants(data.participants);

        if (data.status === "WAITING") {
            setLobbyStatus("connected");
            document.getElementById("progressBar").style.width = "0%";
            showSection("lobby");

        } else if (data.status === "IN_PROGRESS") {
            if (data.question) {
                renderQuestion(data.question);
                showSection("quiz");
            } else {
                showSection("lobby");
            }

        } else if (data.status === "FINISHED") {
            sessionCode = null;
            setJoinState("error");
            showSection("join");
        }
    });

    // ── room:participants_update ────────────────────────
    socket.on("room:participants_update", (data) => {
        console.log("[socket] room:participants_update", data);
        // Повний перерендер зробить наступний room:state
    });

    // ── room:question ───────────────────────────────────
    socket.on("room:question", (data) => {
        console.log("[socket] room:question", data);
        _overlayHide("resultOverlay");
        _overlayHide("quizWaitingOverlay");
        renderQuestion(data);
        showSection("quiz");
    });

    // ── waiting_overlay ─────────────────────────────────
    // { overlay: true, answer: bool }
    socket.on("waiting_overlay", (data) => {
        console.log("[socket] waiting_overlay", data);
        showAnswerResult(data.answer);
    });

    // ── room:answers_progress ───────────────────────────
    // { question_id, answered, total, participants[] }
    socket.on("room:answers_progress", (data) => {
        console.log("[socket] room:answers_progress", data);
        if (document.getElementById("resultOverlay").classList.contains("show")) {
            updateResultStats(data);
        }
    });

    // ── student:switch_content ──────────────────────────
    socket.on("student:switch_content", () => {
        console.log("[socket] student:switch_content");
        _overlayHide("quizWaitingOverlay");
    });

    // ── update_answers ──────────────────────────────────
    socket.on("update_answers", (data) => {
        console.log("[socket] update_answers", data);
        updateResultStats(data);
    });

    // ── finish_session ──────────────────────────────────
    socket.on("finish_session", (data) => {
        console.log("[socket] finish_session", data);
        stopTimer();
        window.location.href = '/'
        // _overlayHide("resultOverlay");
        // _overlayHide("quizWaitingOverlay");
        // document.getElementById("progressBar").style.width = "100%";  // FIX

        // setLobbyStatus("connected");

        // // FIX: було ".sr-status-title" / ".sr-status-text" — не існує в HTML
        // const statusBlock = document.getElementById("lobbyStatusConnected");
        // const titleEl = statusBlock?.querySelector(".lobby-status-title");
        // const textEl  = statusBlock?.querySelector(".lobby-status-text");
        // if (titleEl) titleEl.textContent = "Тест завершено";
        // if (textEl)  textEl.textContent  = "Дякуємо за участь! Результати буде підведено викладачем.";

        // showSection("lobby");
    });

    // ── kickedd ─────────────────────────────────────────
    socket.on("kickedd", (data) => {
        console.log("[socket] kickedd", data);
        stopTimer();
        sessionCode = null;
        _overlayHide("resultOverlay");
        _overlayHide("quizWaitingOverlay");

        const hintTxt  = document.getElementById("joinHintText");
        const joinHint = document.getElementById("joinFormHint");  // FIX: було "joinHint"
        if (hintTxt)  hintTxt.textContent = data?.message || "Вас видалили з сесії";
        joinHint?.classList.add("error");

        document.getElementById("codeInput").value = "";
        document.getElementById("joinBtn").disabled = true;
        document.getElementById("joinWaitingOverlay").classList.remove("show");

        showSection("join");
    });

    // ── delete_user ─────────────────────────────────────
    socket.on("delete_user", (data) => {
        console.log("[socket] delete_user", data);
        // Повний перерендер зробить наступний room:state
    });
}
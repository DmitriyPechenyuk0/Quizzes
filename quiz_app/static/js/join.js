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
   student_room.js  —  Student Quiz View
   Написано строго під events/data із events.py
═══════════════════════════════════════════════════════════════ */

"use strict";

// ════════════════════════════════════════════════════════
// 1. ДАНІ З JINJA2 (через data-атрибути в DOM)
// ════════════════════════════════════════════════════════

const _sd              = document.getElementById("student-data");
const STUDENT_NICKNAME = _sd?.dataset.nickname || "";
const STUDENT_USER_ID  = parseInt(_sd?.dataset.userId) || null;

// ════════════════════════════════════════════════════════
// 2. СТАН ДОДАТКУ
// ════════════════════════════════════════════════════════

let socket = null;

/** Код сесії, введений студентом. @type {string|null} */
let sessionCode = null;

/**
 * Поточне питання (з room:question / room:state.question).
 * Формат з бек-енду serialize_question():
 * { id, text, order_index, q_quantity, q_type, q_variants[] }
 * @type {object|null}
 */
let currentQuestion = null;

/**
 * Обрана відповідь — рядок тексту.
 * Для select/letters: текст варіанту.
 * Для fform: текст з textarea.
 * @type {string|null}
 */
let selectedAnswer = null;

/** Чи відповів студент на поточне питання. @type {boolean} */
let hasAnswered = false;

/** Секундомір (бек-енд не передає time_limit). @type {number|null} */
let _timerInterval = null;
let _timerSeconds  = 0;

// ════════════════════════════════════════════════════════
// 3. СЕКЦІЇ — перемикання контенту
// ════════════════════════════════════════════════════════

/**
 * Показати секцію, решту приховати.
 * @param {'join' | 'lobby' | 'quiz'} name
 */
function showSection(name) {
    ["join", "lobby", "quiz"].forEach((s) => {
        document.getElementById("section-" + s)?.classList.toggle("active", s === name);
    });

    if (name !== "quiz") {
        _overlayHide("quizWaitingOverlay");
        _overlayHide("resultOverlay");
    }
}

// ════════════════════════════════════════════════════════
// 4. JOIN — стани форми
// ════════════════════════════════════════════════════════

/**
 * Встановити UI-стан форми входу.
 * @param {'idle' | 'waiting' | 'error' | 'kicked'} state
 */
function setJoinState(state) {
    const input   = document.getElementById("codeInput");
    const btn     = document.getElementById("joinBtn");
    const hint    = document.getElementById("joinHint");
    const hintTxt = document.getElementById("joinHintText");
    const overlay = document.getElementById("joinWaitingOverlay");

    input.classList.remove("sr-input-error");
    hint.classList.remove("error");
    overlay.classList.remove("show");

    const map = {
        idle:    { btnDisabled: true,  txt: "Лише цифри, 6 символів",          err: false, ov: false },
        waiting: { btnDisabled: true,  txt: "",                                  err: false, ov: true  },
        error:   { btnDisabled: false, txt: "Сесія не знайдена або недоступна", err: true,  ov: false },
        kicked:  { btnDisabled: true,  txt: "Вас видалили з сесії",             err: true,  ov: false },
    };
    const cfg = map[state] ?? map.idle;

    btn.disabled = cfg.btnDisabled;
    hintTxt.textContent = cfg.txt;
    if (cfg.err) {
        hint.classList.add("error");
        input.classList.add("sr-input-error");
        setTimeout(() => input.classList.remove("sr-input-error"), 400);
    }
    if (cfg.ov) overlay.classList.add("show");
}

// ════════════════════════════════════════════════════════
// 5. ЛОБІ
// ════════════════════════════════════════════════════════

/**
 * Заповнити мета-рядок у лобі.
 * room:state передає: { quiz_subject, quiz_name, quiz_owner (User ORM), quiz_code }
 * @param {object} data
 */
function updateLobbyMeta(data) {
    document.getElementById("lobbySubject").textContent  = data.quiz_subject || "—";
    document.getElementById("lobbyQuizName").textContent = data.quiz_name    || "—";
    document.getElementById("lobbyTeacher").textContent  =
        (data.quiz_owner?.name ?? data.quiz_owner?.username ?? "—");
    document.getElementById("lobbyCode").textContent     =
        data.quiz_code || sessionCode || "—";
}

/**
 * Відрендерити чіпси учасників.
 * room:state.participants: [{ user_id, nickname, answered, is_correct }]
 * @param {Array<{ user_id: number, nickname: string }>} list
 */
function updateParticipants(list) {
    const container = document.getElementById("lobbyParticipantsList");
    container.innerHTML = "";

    list.forEach((p, i) => {
        const isSelf   = p.user_id === STUDENT_USER_ID;
        const initials = p.nickname
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

    const count = list.length;
    document.getElementById("lobbyConnectedCount").textContent = count;
    document.getElementById("lobbyTotalCount").textContent     = count;
}

/**
 * Показати потрібний статус-блок у лобі.
 * @param {'connected' | 'pending'} status
 */
function setLobbyStatus(status) {
    document.getElementById("lobbyStatusConnected").style.display =
        status === "connected" ? "" : "none";
    document.getElementById("lobbyStatusPending").style.display   =
        status === "pending"   ? "" : "none";
}

// ════════════════════════════════════════════════════════
// 6. QUIZ — рендер питання
// ════════════════════════════════════════════════════════

const LABELS = ["A", "B", "C", "D", "E", "F"];

/**
 * Парсить q_variants з serialize_question().
 *
 * serialize_question() робить:
 *   for var in q.correct_answer.split('|'):
 *       variants.append(var.split(':')[0])
 *
 * Тобто q_variants — вже масив чистих текстів варіантів ['Текст А', 'Текст Б', ...].
 * Якщо з якоїсь причини прийшов рядок замість масиву — парсимо вручну.
 *
 * @param {string[] | string} raw
 * @returns {string[]}
 */
function _parseVariants(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.length) {
        // Fallback: прийшов сирий рядок "текст1:мітка1|текст2:мітка2|..."
        return raw.split("|").map((v) => v.split(":")[0].trim()).filter(Boolean);
    }
    return [];
}

/**
 * Рендерить питання.
 *
 * Дані з room:question або room:state.question (serialize_question):
 * {
 *   id:           number,
 *   text:         string,
 *   order_index:  number,   — порядковий номер (1-based)
 *   q_quantity:   number,   — всього питань у тесті
 *   q_type:       'select' | 'fform' | 'letters',
 *   q_variants:   string[]  — масив текстів варіантів (тільки select)
 * }
 *
 * Логіка відображення по типу:
 *   select  — сітка карток з варіантами (q_variants), відправляємо текст вибраного варіанту
 *   fform   — вільна textarea, відправляємо введений текст
 *   letters — однорядковий input (коротка відповідь), відправляємо введений текст
 *
 * @param {object} q
 */
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

    // Приховуємо всі блоки відповідей, потім показуємо потрібний
    choiceWrap.style.display = "none";
    textWrap.style.display   = "none";
    imgWrap.style.display    = "none";
    submitBtn.disabled       = true;

    if (q.q_type === "select") {
        // ── Вибір з варіантів ───────────────────────────────
        const variants = _parseVariants(q.q_variants);
        _renderSelectVariants(variants);
        choiceWrap.style.display = "block";

    } else if (q.q_type === "fform") {
        // ── Вільна текстова відповідь (textarea) ────────────
        const ta = document.getElementById("textAnswer");
        ta.value          = "";
        ta.placeholder    = "Введіть вашу відповідь тут...";
        ta.rows           = 5;
        document.getElementById("charCount").textContent = "0 / 300";
        textWrap.style.display = "flex";

    } else if (q.q_type === "letters") {
        // ── Коротка відповідь (однорядковий input) ──────────
        // Показуємо той самий textWrap, але міняємо textarea на однорядковий режим
        const ta = document.getElementById("textAnswer");
        ta.value          = "";
        ta.placeholder    = "Введіть відповідь (слово або число)...";
        ta.rows           = 2;
        document.getElementById("charCount").textContent = "0 / 300";
        textWrap.style.display = "flex";
    }
}

/**
 * Відрендерити картки варіантів для типу select.
 *
 * Студент клікає варіант → selectedAnswer = текст варіанту.
 * Саме цей текст відправляється на бек через participant:answer.
 * Бек: is_correctt(answer_text, cur_quest.correct_answer, 'select')
 *      → answer_text == correct_answer (порівнюється з полем в БД).
 *
 * @param {string[]} variants
 */
function _renderSelectVariants(variants) {
    const grid = document.getElementById("answersGrid");
    grid.innerHTML = "";

    if (!variants.length) {
        grid.innerHTML = `<p style="color:var(--sr-text-3);font-size:var(--sr-f-sm)">Варіанти відповіді відсутні</p>`;
        return;
    }

    variants.forEach((text, i) => {
        const card = document.createElement("div");
        card.className       = "sr-ans-card";
        card.dataset.value   = text;
        card.innerHTML = `
            <div class="sr-ans-idx">${LABELS[i] ?? i + 1}</div>
            <div class="sr-ans-text">${text}</div>`;

        card.addEventListener("click", () => {
            if (hasAnswered) return;
            selectedAnswer = text;
            document.querySelectorAll(".sr-ans-card").forEach((c) => c.classList.remove("selected"));
            card.classList.add("selected");
            document.getElementById("submitBtn").disabled = false;
        });

        grid.appendChild(card);
    });
}

// ════════════════════════════════════════════════════════
// 7. ТАЙМЕР — секундомір (бек-енд не передає time_limit)
// ════════════════════════════════════════════════════════

function startTimer() {
    stopTimer();
    _timerSeconds = 0;
    _renderTimer();
    _timerInterval = setInterval(() => { _timerSeconds++; _renderTimer(); }, 1000);
}

function stopTimer() {
    if (_timerInterval !== null) { clearInterval(_timerInterval); _timerInterval = null; }
}

function _renderTimer() {
    const m   = Math.floor(_timerSeconds / 60).toString().padStart(2, "0");
    const s   = (_timerSeconds % 60).toString().padStart(2, "0");
    document.getElementById("qTimerVal").textContent = `${m}:${s}`;
    document.getElementById("qTimer").className = "sr-q-timer"; // без warn/crit — нема ліміту
}

/** Зафіксувати поточний час відповіді (форматований рядок). @returns {string} */
function _getElapsedTime() {
    const m = Math.floor(_timerSeconds / 60).toString().padStart(2, "0");
    const s = (_timerSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// ════════════════════════════════════════════════════════
// 8. ПРОГРЕС
// ════════════════════════════════════════════════════════

function _setProgress(current, total) {
    const label = `Питання ${current} з ${total}`;
    document.getElementById("qProgressLabel").textContent        = label;
    document.getElementById("resultWaitingProgress").textContent = label;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    document.getElementById("srProgressBar").style.width = pct + "%";
}

// ════════════════════════════════════════════════════════
// 9. ОВЕРЛЕЇ
// ════════════════════════════════════════════════════════

function _overlayShow(id) { document.getElementById(id)?.classList.add("show"); }
function _overlayHide(id) { document.getElementById(id)?.classList.remove("show"); }

/**
 * Показати result-modal з вердиктом correct / wrong.
 * Викликається після waiting_overlay: { overlay: true, answer: bool }
 * @param {boolean} isCorrect
 */
function showAnswerResult(isCorrect) {
    const elapsedTime = _getElapsedTime();
    stopTimer();
    hasAnswered = true;
    document.getElementById("submitBtn").disabled = true;

    const overlay  = document.getElementById("resultOverlay");
    const top      = document.getElementById("resultTop");
    const icon     = document.getElementById("resultIcon");
    const iconSvg  = document.getElementById("resultIconSvg");
    const verdict  = document.getElementById("resultVerdict");
    const sub      = document.getElementById("resultSub");
    const reveal   = document.getElementById("correctReveal");

    // Ре-тригер CSS-анімації (клонування trick)
    const modal = overlay.querySelector(".sr-result-modal");
    modal.style.animation = "none";
    modal.offsetHeight;
    modal.style.animation = "";

    if (isCorrect) {
        top.className       = "sr-result-top correct";
        icon.className      = "sr-result-icon correct";
        verdict.className   = "sr-result-verdict correct";
        iconSvg.innerHTML   = '<polyline points="4,12 9,17 20,6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
        verdict.textContent = "Правильно!";
        sub.textContent     = "Чудова робота — ваша відповідь вірна.";
    } else {
        top.className       = "sr-result-top wrong";
        icon.className      = "sr-result-icon wrong";
        verdict.className   = "sr-result-verdict wrong";
        iconSvg.innerHTML   = '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>';
        verdict.textContent = "Невірно";
        sub.textContent     = "Ваша відповідь не збігається з правильною.";
    }
    // Бек-енд не шле правильну відповідь студенту — reveal ховаємо
    reveal.style.display = "none";

    // Час відповіді — зі свого секундоміра
    document.getElementById("statTime").textContent     = elapsedTime;
    document.getElementById("statAvgTime").textContent  = "—"; // оновиться з room:answers_progress
    document.getElementById("statAnswered").textContent = "—"; // оновиться з room:answers_progress

    _overlayShow("resultOverlay");
}

/**
 * Оновити лічильник "відповіли" у відкритій result-modal.
 * Дані з room:answers_progress: { answered: number, total: number }
 * @param {{ answered: number, total: number }} data
 */
function updateResultStats(data) {
    document.getElementById("statAnswered").textContent = `${data.answered}/${data.total}`;
}

// ════════════════════════════════════════════════════════
// 10. EVENT LISTENERS
// ════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

    // ── Введення коду ─────────────────────────────────────
    const codeInput = document.getElementById("codeInput");
    const joinBtn   = document.getElementById("joinBtn");
    const hintTxt   = document.getElementById("joinHintText");
    const joinHint  = document.getElementById("joinHint");

    codeInput.addEventListener("input", () => {
        codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
        const len = codeInput.value.length;
        if (len === 6) {
            joinBtn.disabled = false;
            hintTxt.textContent = "Готово! Натисніть кнопку нижче";
            joinHint.classList.remove("error");
        } else {
            joinBtn.disabled = true;
            hintTxt.textContent = `Лише цифри, 6 символів (${len}/6)`;
        }
    });

    // ── Приєднатись ───────────────────────────────────────
    joinBtn.addEventListener("click", () => {
        const code = codeInput.value.trim();
        if (code.length !== 6) return;
        sessionCode = code;
        setJoinState("waiting");
        socket.emit("join", { code, as_host: false });
    });

    // ── Скасувати очікування ──────────────────────────────
    // document.getElementById("joinCancelBtn").addEventListener("click", () => {
    //     sessionCode = null;
    //     codeInput.value = "";
    //     setJoinState("idle");
    // });

    // ── Відправити відповідь ──────────────────────────────
    document.getElementById("submitBtn").addEventListener("click", () => {
        if (!currentQuestion || hasAnswered) return;

        let answer = null;

        if (currentQuestion.q_type === "select") {
            // Текст вибраного варіанту — бек порівнює через is_correctt з correct_answer
            answer = selectedAnswer;
        } else if (currentQuestion.q_type === "fform" || currentQuestion.q_type === "letters") {
            // Введений текст — бек normalize() + порівнює
            answer = document.getElementById("textAnswer").value.trim();
        }

        if (!answer) return;

        document.getElementById("submitBtn").disabled = true;

        // participant:answer → { code, answer: string }
        socket.emit("participant:answer", { code: sessionCode, answer });
    });

    // ── Лічильник символів (fform / letters) ─────────────
    document.getElementById("textAnswer").addEventListener("input", function () {
        const len = this.value.length;
        document.getElementById("charCount").textContent = `${len} / 300`;
        // Для fform і letters — кнопка активна як тільки є хоч один символ
        if (currentQuestion?.q_type === "fform" || currentQuestion?.q_type === "letters") {
            document.getElementById("submitBtn").disabled = len === 0;
        }
    });

    // ── Lightbox ──────────────────────────────────────────
    document.getElementById("qImageWrap").addEventListener("click", () => {
        const src = document.getElementById("qImage").src;
        if (src) {
            document.getElementById("lightboxImg").src = src;
            _overlayShow("lightboxOverlay");
        }
    });
    document.getElementById("lightboxOverlay").addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.closest("#lightboxClose")) {
            _overlayHide("lightboxOverlay");
        }
    });

    initSocket();
});

// ════════════════════════════════════════════════════════
// 11. WEBSOCKET — обробники подій
// ════════════════════════════════════════════════════════

function initSocket() {
    socket = io();

    socket.on("connect",    () => console.log("[socket] connected:", socket.id));
    socket.on("disconnect", () => console.warn("[socket] disconnected"));
    socket.on("error",      (d) => console.error("[socket] error:", d?.message));

    // ── room:state ────────────────────────────────────────
    // Приходить після join та після будь-яких змін.
    // {
    //   status:        'WAITING' | 'IN_PROGRESS' | 'FINISHED',
    //   participants:  [{ user_id, nickname, answered, is_correct }],
    //   current_order: number,
    //   quiz_name:     string,
    //   quiz_code:     string,
    //   quiz_subject:  string,
    //   quiz_owner:    User ORM (є .name),
    //   question?:     { id, text, order_index, q_quantity, q_type, q_variants[] }
    // }
    socket.on("room:state", (data) => {
        console.log("[socket] room:state", data);

        updateLobbyMeta(data);
        if (data.participants) updateParticipants(data.participants);

        if (data.status === "WAITING") {
            setLobbyStatus("connected");
            // Скидаємо join-overlay якщо він ще відкритий
            document.getElementById("joinWaitingOverlay").classList.remove("show");
            document.getElementById("srProgressBar").style.width = "0%";
            showSection("lobby");

        } else if (data.status === "IN_PROGRESS") {
            if (data.question) {
                // Студент підключився під час тесту — рендеримо питання
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

    // ── room:participants_update ──────────────────────────
    // { nickname, id, sess_status }
    // Сигнал що хтось новий підключився.
    // Повний перерендер зробить наступний room:state, тут нічого не треба.
    socket.on("room:participants_update", (data) => {
        console.log("[socket] room:participants_update", data);
    });

    // ── room:question ─────────────────────────────────────
    // Нове питання (teacher:start або teacher:next).
    // { id, text, order_index, q_quantity, q_type, q_variants[] }
    socket.on("room:question", (data) => {
        console.log("[socket] room:question", data);
        _overlayHide("resultOverlay");
        _overlayHide("quizWaitingOverlay");
        renderQuestion(data);
        showSection("quiz");
    });

    // ── waiting_overlay ───────────────────────────────────
    // Надсилається тільки студенту що щойно відповів.
    // { overlay: true, answer: bool }
    // answer: true → правильно, false → неправильно
    socket.on("waiting_overlay", (data) => {
        console.log("[socket] waiting_overlay", data);
        showAnswerResult(data.answer);
    });

    // ── room:answers_progress ─────────────────────────────
    // Надсилається всім після кожної відповіді.
    // { question_id, answered, total, participants[] }
    socket.on("room:answers_progress", (data) => {
        console.log("[socket] room:answers_progress", data);
        // Якщо result-modal відкритий — оновлюємо лічильник відповідей
        if (document.getElementById("resultOverlay").classList.contains("show")) {
            updateResultStats(data);
        }
    });

    // ── student:switch_content ────────────────────────────
    // Тригер від switch_content (вчительська кімната).
    // Ховаємо waiting щоб студент побачив питання.
    socket.on("student:switch_content", () => {
        console.log("[socket] student:switch_content");
        _overlayHide("quizWaitingOverlay");
    });

    // ── update_answers ────────────────────────────────────
    // Відповідь на check_answers: { total, answered }
    socket.on("update_answers", (data) => {
        console.log("[socket] update_answers", data);
        updateResultStats(data);
    });

    // ── finish_session ────────────────────────────────────
    // { session_id }
    socket.on("finish_session", (data) => {
        console.log("[socket] finish_session", data);
        stopTimer();
        _overlayHide("resultOverlay");
        _overlayHide("quizWaitingOverlay");
        document.getElementById("srProgressBar").style.width = "100%";

        // Показуємо лобі з повідомленням про кінець
        // TODO: замінити на окремий фінальний екран коли він буде готовий
        setLobbyStatus("connected");
        document.getElementById("lobbyStatusConnected").querySelector(".sr-status-title").textContent =
            "Тест завершено";
        document.getElementById("lobbyStatusConnected").querySelector(".sr-status-text").textContent =
            "Дякуємо за участь! Результати буде підведено викладачем.";

        showSection("lobby");
    });

    // ── kickedd ───────────────────────────────────────────
    // { message: string }
    socket.on("kickedd", (data) => {
        console.log("[socket] kickedd", data);
        stopTimer();
        sessionCode = null;
        _overlayHide("resultOverlay");
        _overlayHide("quizWaitingOverlay");

        const hintTxt  = document.getElementById("joinHintText");
        const joinHint = document.getElementById("joinHint");
        hintTxt.textContent = data?.message || "Вас видалили з сесії";
        joinHint.classList.add("error");

        document.getElementById("codeInput").value = "";
        document.getElementById("joinBtn").disabled = true;
        document.getElementById("joinWaitingOverlay").classList.remove("show");

        showSection("join");
    });

    // ── delete_user ───────────────────────────────────────
    // { id } — після цього room:state перемалює список, тут нічого не треба
    socket.on("delete_user", (data) => {
        console.log("[socket] delete_user", data);
    });
}
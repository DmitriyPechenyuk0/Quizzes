"use strict";
 
const STUDENT_USER_ID = parseInt(
    document.getElementById("current_user_id")?.textContent?.trim()
) || null;
 
let socket            = null;
let sessionCode       = null;
let currentQuestion   = null;
let selectedAnswer    = null;
let hasAnswered       = false;
 
// ── Час ─────────────────────────────────────────────────
let _timerInterval    = null;
let _timerSeconds     = 0;      // лічильник для відображення (MM:SS)
let _questionStartTs  = null;   // Date.now() коли питання з'явилось — для точного time_spent
let _sessionStartTs   = null;   // Date.now() коли сесія стартувала
 
const LABELS = ["A", "B", "C", "D", "E", "F"];
 
 
// ════════════════════════════════════════════════════════
// СЕКЦІЇ
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
// JOIN
// ════════════════════════════════════════════════════════
 
function setJoinState(state) {
    const input   = document.getElementById("codeInput");
    const btn     = document.getElementById("joinBtn");
    const hint    = document.getElementById("joinFormHint");
    const hintTxt = document.getElementById("joinHintText");
    const overlay = document.getElementById("joinWaitingOverlay");
 
    input.classList.remove("input-error");
    hint?.classList.remove("error");
    overlay.classList.remove("show");
 
    const map = {
        idle:    { btnDisabled: true,  txt: "Лише цифри, 6 символів",          err: false, ov: false },
        waiting: { btnDisabled: true,  txt: "",                                  err: false, ov: true  },
        error:   { btnDisabled: false, txt: "Сесія не знайдена або недоступна", err: true,  ov: false },
        kicked:  { btnDisabled: true,  txt: "Вас видалили з сесії",             err: true,  ov: false },
    };
    const cfg = map[state] ?? map.idle;
 
    btn.disabled        = cfg.btnDisabled;
    hintTxt.textContent = cfg.txt;
 
    if (cfg.err) {
        hint?.classList.add("error");
        input.classList.add("input-error");
        setTimeout(() => input.classList.remove("input-error"), 400);
    }
    if (cfg.ov) overlay.classList.add("show");
}
 
 
// ════════════════════════════════════════════════════════
// ЛОБІ
// ════════════════════════════════════════════════════════
 
function updateLobbyMeta(data) {
    document.getElementById("lobbySubject").textContent  = data.quiz_subject || "—";
    document.getElementById("lobbyQuizName").textContent = data.quiz_name    || "—";
    document.getElementById("lobbyTeacher").textContent  =
        data.quiz_owner?.name ?? data.quiz_owner?.username ?? "—";
}
 
function updateParticipants(list) {
    const container = document.getElementById("lobbyParticipantsList");
    if (!container) return;
    container.innerHTML = "";
 
    list.forEach((p, i) => {
        const isSelf   = p.user_id === STUDENT_USER_ID;
        const initials = (p.nickname || "?")
            .split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
 
        const chip = document.createElement("div");
        chip.className = "participant-chip";
        chip.style.animationDelay = i * 0.05 + "s";
        chip.innerHTML = `
            <div class="participant-avatar"
                 style="${isSelf ? "color:var(--green);border-color:var(--green);" : ""}">
                ${initials}
            </div>
            <span class="participant-name" style="${isSelf ? "color:var(--text);" : ""}">
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
 
 
// ════════════════════════════════════════════════════════
// ПИТАННЯ
// ════════════════════════════════════════════════════════
 
function _parseVariants(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.length)
        return raw.split("|").map((v) => v.split(":")[0].trim()).filter(Boolean);
    return [];
}
 
function renderQuestion(q) {
    currentQuestion  = q;
    selectedAnswer   = null;
    hasAnswered      = false;
    _questionStartTs = Date.now();
 
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
        grid.innerHTML = `<p style="color:var(--text-3)">Варіанти відповіді відсутні</p>`;
        return;
    }
 
    variants.forEach((text, i) => {
        const card = document.createElement("div");
        card.className     = "ans-card";
        card.dataset.value = text;
        card.innerHTML     = `
            <div class="ans-idx">${LABELS[i] ?? i + 1}</div>
            <div class="ans-text">${text}</div>`;
 
        card.addEventListener("click", () => {
            if (hasAnswered) return;
            selectedAnswer = text;
            document.querySelectorAll(".ans-card").forEach((c) => c.classList.remove("selected"));
            card.classList.add("selected");
            document.getElementById("submitBtn").disabled = false;
        });
 
        grid.appendChild(card);
    });
}
 
 
// ════════════════════════════════════════════════════════
// ТАЙМЕР
// ════════════════════════════════════════════════════════
 
function startTimer() {
    stopTimer();
    _timerSeconds  = 0;
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
    document.getElementById("qTimer").className = "q-timer";
}
 
// Точний час у секундах від старту питання (float)
function _getQuestionTimeSpent() {
    if (!_questionStartTs) return null;
    return parseFloat(((Date.now() - _questionStartTs) / 1000).toFixed(2));
}
 
// Форматований рядок MM:SS для відображення
function _formatSeconds(totalSec) {
    const sec = Math.round(totalSec);
    const m   = Math.floor(sec / 60).toString().padStart(2, "0");
    const s   = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}
 
 
// ════════════════════════════════════════════════════════
// ПРОГРЕС-БАР
// ════════════════════════════════════════════════════════
 
function _setProgress(current, total) {
    const label = `Питання ${current} з ${total}`;
    document.getElementById("qProgressLabel").textContent  = label;
    document.getElementById("resultWaitingSub").textContent = label;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    document.getElementById("progressBar").style.width = pct + "%";
}
 
 
// ════════════════════════════════════════════════════════
// ОВЕРЛЕЇ
// ════════════════════════════════════════════════════════
 
function _overlayShow(id) { document.getElementById(id)?.classList.add("show"); }
function _overlayHide(id) { document.getElementById(id)?.classList.remove("show"); }
 
 
// ════════════════════════════════════════════════════════
// РЕЗУЛЬТАТ ВІДПОВІДІ
// ════════════════════════════════════════════════════════
 
function showAnswerResult(isCorrect, timeSpentSec) {
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
 
    const modal = overlay.querySelector(".result-modal");
    if (modal) {
        modal.style.animation = "none";
        void modal.offsetHeight;
        modal.style.animation = "";
    }
 
    if (isCorrect) {
        top.className     = "result-top correct";
        icon.className    = "result-icon correct";
        verdict.className = "result-verdict correct";
        iconSvg.innerHTML = '<polyline points="4,12 9,17 20,6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
        verdict.textContent = "Правильно!";
        sub.textContent     = "Чудова робота — ваша відповідь вірна.";
    } else {
        top.className     = "result-top wrong";
        icon.className    = "result-icon wrong";
        verdict.className = "result-verdict wrong";
        iconSvg.innerHTML = '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>';
        verdict.textContent = "Невірно";
        sub.textContent     = "Ваша відповідь не збігається з правильною.";
    }
 
    reveal.style.display = "none";
 
    // Час відповіді — або переданий із сервера, або локальний таймер
    const displayTime = timeSpentSec != null
        ? _formatSeconds(timeSpentSec)
        : _formatSeconds(_timerSeconds);
 
    document.getElementById("statTime").textContent     = displayTime;
    document.getElementById("statAvgTime").textContent  = "—";
    document.getElementById("statAnswered").textContent = "—";
 
    _overlayShow("resultOverlay");
}
 
function updateResultStats(data) {
    if (data.answered != null && data.total != null)
        document.getElementById("statAnswered").textContent = `${data.answered}/${data.total}`;
 
    if (data.avg_time != null)
        document.getElementById("statAvgTime").textContent = _formatSeconds(data.avg_time);
}
 
 
// ════════════════════════════════════════════════════════
// ВІДПРАВКА ВІДПОВІДІ
// ════════════════════════════════════════════════════════
 
function submitAnswer() {
    if (!currentQuestion || hasAnswered) return;
 
    let answer = null;
    if (currentQuestion.q_type === "select") {
        answer = selectedAnswer;
    } else {
        answer = document.getElementById("textAnswer").value.trim();
    }
    if (!answer) return;
 
    // Фіксуємо точний час до відправки
    const timeSpent = _getQuestionTimeSpent();
 
    document.getElementById("submitBtn").disabled = true;
    socket.emit("participant:answer", {
        code:       sessionCode,
        answer,
        time_spent: timeSpent,   // секунди (float), логується в БД
    });
}
 
function onTextInput(el) {
    const len = el.value.length;
    document.getElementById("charCount").textContent = `${len} / 300`;
    if (currentQuestion?.q_type === "fform" || currentQuestion?.q_type === "letters")
        document.getElementById("submitBtn").disabled = len === 0;
}
 
function openLightbox(el) {
    const img = el.querySelector("img");
    if (img?.src) {
        document.getElementById("lightboxImg").src = img.src;
        const caption = document.getElementById("lightboxCaption");
        if (caption) caption.textContent = img.alt || "";
        _overlayShow("lightboxOverlay");
    }
}
 
function closeLightbox(event) {
    const overlay = document.getElementById("lightboxOverlay");
    if (event.target === overlay || event.target.closest(".lightbox-close"))
        _overlayHide("lightboxOverlay");
}
 
 
// ════════════════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════════════════
 
document.addEventListener("DOMContentLoaded", () => {
    const codeInput = document.getElementById("codeInput");
    const joinBtn   = document.getElementById("joinBtn");
    const hintTxt   = document.getElementById("joinHintText");
    const joinHint  = document.getElementById("joinFormHint");
 
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
 
    codeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !joinBtn.disabled) joinBtn.click();
    });
 
    joinBtn.addEventListener("click", () => {
        const code = codeInput.value.trim();
        if (code.length !== 6) return;
        sessionCode = code;
        setJoinState("waiting");
        socket.emit("join", { code, as_host: false });
    });
 
    document.getElementById("lightboxOverlay")
        ?.addEventListener("click", (e) => {
            if (e.target === e.currentTarget) _overlayHide("lightboxOverlay");
        });
 
    initSocket();
});
 
 
// ════════════════════════════════════════════════════════
// WEBSOCKET
// ════════════════════════════════════════════════════════
 
function initSocket() {
    socket = io();
 
    socket.on("connect",    () => console.log("[socket] connected:", socket.id));
    socket.on("disconnect", () => console.warn("[socket] disconnected"));
    socket.on("error",      (d) => {
        console.error("[socket] error:", d?.message);
        setJoinState("error");
        document.getElementById("joinHintText").textContent =
            d?.message || "Помилка підключення";
    });
 
    socket.on("room:state", (data) => {
        document.getElementById("joinWaitingOverlay").classList.remove("show");
 
        updateLobbyMeta(data);
        if (data.participants) updateParticipants(data.participants);
 
        if (data.status === "WAITING") {
            if (!_sessionStartTs) _sessionStartTs = Date.now();
            setLobbyStatus("connected");
            document.getElementById("progressBar").style.width = "0%";
            showSection("lobby");
 
        } else if (data.status === "IN_PROGRESS") {
            if (!_sessionStartTs) _sessionStartTs = Date.now();
            if (data.question) {
                renderQuestion(data.question);
                showSection("quiz");
            } else {
                showSection("lobby");
            }
 
        } else if (data.status === "FINISHED") {
            sessionCode    = null;
            _sessionStartTs = null;
            setJoinState("error");
            showSection("join");
        }
    });
 
    socket.on("room:question", (data) => {
        _overlayHide("resultOverlay");
        _overlayHide("quizWaitingOverlay");
        renderQuestion(data);
        showSection("quiz");
    });
 
    // Сервер повертає { overlay, answer, time_spent, avg_time }
    socket.on("waiting_overlay", (data) => {
        showAnswerResult(data.answer, data.time_spent ?? null);
    });
 
    socket.on("room:answers_progress", (data) => {
        if (document.getElementById("resultOverlay").classList.contains("show"))
            updateResultStats(data);
    });
 
    socket.on("update_answers", (data) => {
        updateResultStats(data);
    });
 
    socket.on("student:switch_content", () => {
        _overlayHide("quizWaitingOverlay");
    });
 
    socket.on("finish_session", () => {
        stopTimer();
        _sessionStartTs = null;
        window.location.href = "/";
    });
 
    socket.on("kickedd", (data) => {
        stopTimer();
        sessionCode     = null;
        _sessionStartTs = null;
        _overlayHide("resultOverlay");
        _overlayHide("quizWaitingOverlay");
 
        const hintTxt  = document.getElementById("joinHintText");
        const joinHint = document.getElementById("joinFormHint");
        if (hintTxt) hintTxt.textContent = data?.message || "Вас видалили з сесії";
        joinHint?.classList.add("error");
 
        document.getElementById("codeInput").value = "";
        document.getElementById("joinBtn").disabled = true;
        document.getElementById("joinWaitingOverlay").classList.remove("show");
 
        showSection("join");
    });
 
    socket.on("delete_user", () => {});
}
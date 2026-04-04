"use strict";

(function () {

    let socket              = null;
    let code                = "";
    let _currentAnswersData = null;
    let _revealActive       = false;

    const LABELS = ["A", "B", "C", "D", "E", "F"];

    // ════════════════════════════════════════════════════════
    // УТІЛІТИ
    // ════════════════════════════════════════════════════════

    function $(id) { return document.getElementById(id); }

    function showView(name) {
        if (name === "quiz") {
            $("view-lobby").style.display = "none";
            $("view-quiz").classList.add("active");
            document.body.classList.add("quiz-active");
        } else {
            $("view-lobby").style.display = "";
            $("view-quiz").classList.remove("active");
            document.body.classList.remove("quiz-active");
        }
    }

    function overlayShow(id) { $(id)?.classList.add("show"); }
    function overlayHide(id) { $(id)?.classList.remove("show"); }

    // ════════════════════════════════════════════════════════
    // ЛІЧИЛЬНИКИ / ПРОГРЕС
    // ════════════════════════════════════════════════════════

    function updateAnswerProgress(answered, total) {
        const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
        $("qz-answered-count").textContent     = answered;
        $("qz-answered-total").textContent     = total;
        $("qz-answered-count-mob").textContent = answered;
        $("qz-answered-total-mob").textContent = total;
        $("qz-prog-fill").style.width          = pct + "%";
        $("qz-prog-fill-mob").style.width      = pct + "%";
    }

    function updateTotalCount(n) {
        $("qz-total-count").textContent      = n;
        $("qz-total-count-mob").textContent  = n;
        $("qz-mob-students-cnt").textContent = n;
        $("connectedCount").textContent      = n;
    }

    function updateQuestionCounter(cur, tot) {
        ["qz-q-cur", "mob-q-cur", "sheet-q-cur"].forEach(id => {
            const el = $(id); if (el) el.textContent = cur ?? "—";
        });
        ["qz-q-tot", "mob-q-tot", "sheet-q-tot"].forEach(id => {
            const el = $(id); if (el) el.textContent = tot ?? "—";
        });
    }

    // ════════════════════════════════════════════════════════
    // УЧАСНИКИ — ЛОБІ
    // ════════════════════════════════════════════════════════

    function addLobbyParticipant(p) {
        const list = $("participantsList");
        if (!list || list.querySelector(`[data-uid="${p.user_id}"]`)) return;

        const initials = (p.nickname || "?")
            .split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();

        const chip = document.createElement("div");
        chip.className   = "qz-lobby-chip";
        chip.dataset.uid = p.user_id;
        chip.innerHTML   = `
            <div class="qz-lobby-avatar">${initials}</div>
            <span class="qz-lobby-name">${p.nickname}</span>
            <button class="qz-lobby-kick" title="Видалити">
                <svg viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
            </button>`;

        chip.querySelector(".qz-lobby-kick").addEventListener("click", (e) => {
            e.stopPropagation();
            socket.emit("rm_user_from_session", { code, user_id: p.user_id });
            chip.remove();
            updateTotalCount($("participantsList").children.length);
        });

        list.appendChild(chip);
        updateTotalCount(list.children.length);
    }

    // ════════════════════════════════════════════════════════
    // УЧАСНИКИ — QUIZ VIEW  (клас .qz-s-card з CSS)
    // ════════════════════════════════════════════════════════

    function _buildStudentCard(p) {
        const initials = (p.nickname || "?")
            .split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();

        const card = document.createElement("div");
        card.className   = "qz-s-card";
        card.dataset.uid = p.user_id;
        card.innerHTML   = `
            <div class="qz-s-avatar">
                ${initials}
                <div class="qz-check-dot">
                    <svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg>
                </div>
            </div>
            <div class="qz-s-info">
                <div class="qz-s-name">${p.nickname}</div>
                <div class="qz-s-status">Очікує...</div>
            </div>
            <button class="qz-s-remove" title="Видалити">
                <svg viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
            </button>`;

        card.querySelector(".qz-s-remove").addEventListener("click", (e) => {
            e.stopPropagation();
            socket.emit("rm_user_from_session", { code, user_id: p.user_id });
            removeStudentEverywhere(p.user_id);
        });

        return card;
    }

    function _updateStudentCard(card, p) {
        const statusEl = card.querySelector(".qz-s-status");
        if (p.answered) {
            card.classList.add("done");
            if (statusEl) statusEl.textContent = p.is_correct ? "Правильно ✓" : "Невірно ✗";
        } else {
            card.classList.remove("done");
            if (statusEl) statusEl.textContent = "Очікує...";
        }
    }

    function syncStudentCards(participants) {
        ["qz-students-list", "qz-students-list-mob"].forEach(listId => {
            const list = $(listId);
            if (!list) return;
            participants.forEach(p => {
                let card = list.querySelector(`[data-uid="${p.user_id}"]`);
                if (!card) {
                    card = _buildStudentCard(p);
                    list.appendChild(card);
                }
                _updateStudentCard(card, p);
            });
        });
    }

    function removeStudentEverywhere(user_id) {
        document.querySelectorAll(`[data-uid="${user_id}"]`).forEach(el => el.remove());
        updateTotalCount(document.querySelectorAll("#qz-students-list .qz-s-card").length);
    }

    // ════════════════════════════════════════════════════════
    // ПИТАННЯ
    // ════════════════════════════════════════════════════════

    function renderQuestion(q) {
        $("qz-q-eyebrow").textContent = `Питання ${q.order_index} з ${q.q_quantity}`;
        $("qz-q-text").textContent    = q.text;
        updateQuestionCounter(q.order_index, q.q_quantity);

        const grid = $("qz-answers-grid");
        grid.innerHTML = "";

        if (q.q_type === "select") {
            const variants = Array.isArray(q.q_variants)
                ? q.q_variants
                : (q.q_variants || "").split("|").map(v => v.split(":")[0].trim()).filter(Boolean);

            // Перший варіант — правильна відповідь (формат "Правильна:мітка|Варіант2|...")
            const correctText = variants[0] ?? "";

            variants.forEach((text, i) => {
                const isCorrect = i === 0;
                const card = document.createElement("div");
                card.className = `qz-a-card${isCorrect ? " correct" : ""}`;
                card.innerHTML = `
                    <div class="qz-a-idx${isCorrect ? " correct" : ""}">${LABELS[i] ?? i + 1}</div>
                    <div class="qz-a-text">${text}</div>
                    ${isCorrect ? '<span class="qz-correct-badge">✓ Правильна</span>' : ""}`;
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = `
                <div class="qz-freeform-note">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                        <rect x="2" y="3" width="12" height="10" rx="1.5"/>
                        <line x1="5" y1="6.5" x2="11" y2="6.5"/>
                        <line x1="5" y1="9.5" x2="9" y2="9.5"/>
                    </svg>
                    Відкрите питання — учні вводять відповідь вручну
                </div>`;
        }

        // Скидаємо таб відповідей
        _revealActive = false;
        _currentAnswersData = null;
        $("qz-rev-btn").classList.remove("on");
        $("qz-resp-list").classList.remove("show-badges");
        $("qz-resp-list").innerHTML = `<div class="qz-resp-empty">Поки що ніхто не відповів</div>`;
        $("qz-resp-eyebrow").textContent = "Відповіді — 0 учнів";
    }

    // ════════════════════════════════════════════════════════
    // ВІДПОВІДІ УЧНІВ (таб "Відповіді учнів")
    // ════════════════════════════════════════════════════════

    function renderResponses(data) {
        _currentAnswersData = data;
        const list     = $("qz-resp-list");
        const answered = (data.participants ?? []).filter(p => p.answered);

        $("qz-resp-eyebrow").textContent = `Відповіді — ${data.answered} учнів`;

        if (!answered.length) {
            list.innerHTML = `<div class="qz-resp-empty">Поки що ніхто не відповів</div>`;
            return;
        }

        list.innerHTML = "";
        if (_revealActive) list.classList.add("show-badges");

        answered.forEach(p => {
            const initials = (p.username || "?")
                .split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();

            const row = document.createElement("div");
            row.className   = "qz-resp-row";
            row.dataset.uid = p.user_id;
            row.innerHTML   = `
                <div class="qz-r-avatar">${initials}</div>
                <span class="qz-r-name">${p.username}</span>
                <span class="qz-r-badge ${p.is_correct ? "ok" : "no"}">${p.is_correct ? "Вірно" : "Невірно"}</span>`;
            list.appendChild(row);
        });
    }

    // ════════════════════════════════════════════════════════
    // МОДАЛКА РЕЗУЛЬТАТІВ  (.qz-res-overlay)
    // ════════════════════════════════════════════════════════

    function showResultsModal() {
        const data        = _currentAnswersData;
        const parts       = data?.participants ?? [];
        const total       = data?.total    ?? 0;
        const answered    = data?.answered  ?? 0;
        const correct     = parts.filter(p => p.answered && p.is_correct).length;
        const incorrect   = parts.filter(p => p.answered && !p.is_correct).length;
        const notAnswered = total - answered;
        const pct         = total > 0 ? Math.round(correct / total * 100) : 0;

        $("qz-stat-correct").textContent     = correct;
        $("qz-stat-incorrect").textContent   = incorrect;
        $("qz-stat-notanswered").textContent = notAnswered;
        $("qz-score-num").textContent        = `${pct}%`;
        $("qz-res-q-title").textContent      = $("qz-q-eyebrow")?.textContent ?? "Питання —";

        const resList = $("qz-res-participants");
        resList.innerHTML = "";

        parts.filter(p => p.answered).forEach(p => {
            const initials = (p.username || "?")
                .split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();
            const ok = p.is_correct;

            const row = document.createElement("div");
            row.className = "qz-res-p-row";
            row.innerHTML = `
                <div class="qz-res-p-avatar ${ok ? "ok" : "no"}">${initials}</div>
                <span class="qz-res-p-name">${p.username}</span>
                <span class="qz-res-p-badge ${ok ? "ok" : "no"}">${ok ? "Вірно" : "Невірно"}</span>`;
            resList.appendChild(row);
        });

        overlayShow("qz-res-modal");
    }

    function hideResultsModal() { overlayHide("qz-res-modal"); }

    // ════════════════════════════════════════════════════════
    // TABS
    // ════════════════════════════════════════════════════════

    function initTabs() {
        document.querySelectorAll(".qz-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".qz-tab").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".qz-panel").forEach(p => p.classList.remove("active"));
                tab.classList.add("active");
                $(`qz-panel-${tab.dataset.tab}`)?.classList.add("active");
            });
        });
    }

    // ════════════════════════════════════════════════════════
    // SOCKET
    // ════════════════════════════════════════════════════════

    function initSocket() {
        socket = io();

        socket.on("connect",    () => console.log("[socket] connected:", socket.id));
        socket.on("disconnect", () => console.warn("[socket] disconnected"));

        socket.on("room:state", (info) => {
            console.log("[socket] room:state", info);

            if (info.quiz_subject) $("qz-quiz-subject").textContent = info.quiz_subject;
            if (info.quiz_code)    $("qz-session-code").textContent = "#" + info.quiz_code;

            const participants = info.participants ?? [];
            updateTotalCount(participants.length);

            if (info.status === "WAITING") {
                showView("lobby");
                participants.forEach(addLobbyParticipant);

            } else if (info.status === "IN_PROGRESS") {
                showView("quiz");
                syncStudentCards(participants);
                const answered = participants.filter(p => p.answered).length;
                updateAnswerProgress(answered, participants.length);
                if (info.question) renderQuestion(info.question);
            }
        });

        socket.on("room:participants_update", (info) => {
            addLobbyParticipant({ user_id: info.id, nickname: info.nickname });
            if ($("view-quiz").classList.contains("active")) {
                syncStudentCards([{ user_id: info.id, nickname: info.nickname, answered: false }]);
                updateTotalCount(document.querySelectorAll("#qz-students-list .qz-s-card").length);
            }
        });

        socket.on("room:answers_progress", (data) => {
            updateAnswerProgress(data.answered, data.total);
            syncStudentCards(data.participants.map(p => ({
                user_id:    p.user_id,
                nickname:   p.username,
                answered:   p.answered,
                is_correct: p.is_correct,
            })));
            renderResponses(data);
        });

        socket.on("update_answers", (info) => {
            updateAnswerProgress(info.answered, info.total);
        });

        socket.on("room:user_kicked", (data) => {
            removeStudentEverywhere(data.id);
        });

        socket.on("room:question", (data) => {
            renderQuestion(data);
        });

        socket.on("finish_session", (data) => {
            window.location.href = `/history/${data.session_id}`;
        });
    }

    // ════════════════════════════════════════════════════════
    // UI EVENTS
    // ════════════════════════════════════════════════════════

    function bindUIEvents() {

        $("startBtn").addEventListener("click", () => {
            if (($("participantsList")?.children.length ?? 0) < 1) return;
            socket.emit("teacher:start",  { code });
            socket.emit("switch_content", { code });
            socket.emit("check_answers",  { code });
        });

        document.querySelectorAll(".qz-btn-end").forEach(btn => {
            btn.addEventListener("click", () => {
                overlayShow("qz-end-modal");
                overlayHide("qz-control-sheet");
            });
        });

        $("qz-end-cancel").addEventListener("click", () => overlayHide("qz-end-modal"));

        $("qz-end-confirm").addEventListener("click", () => {
            overlayHide("qz-end-modal");
            showResultsModal();
        });

        document.querySelectorAll(".qz-btn-next-q").forEach(btn => {
            btn.addEventListener("click", () => {
                overlayHide("qz-control-sheet");
                socket.emit("teacher:next",  { code });
                socket.emit("check_answers", { code });
            });
        });

        $("qz-res-btn-next").addEventListener("click", () => {
            hideResultsModal();
            socket.emit("teacher:next",  { code });
            socket.emit("check_answers", { code });
        });

        $("qz-res-btn-close").addEventListener("click", hideResultsModal);
        $("qz-res-close").addEventListener("click",     hideResultsModal);

        $("qz-rev-btn").addEventListener("click", () => {
            _revealActive = !_revealActive;
            $("qz-rev-btn").classList.toggle("on", _revealActive);
            $("qz-resp-list").classList.toggle("show-badges", _revealActive);
        });

        $("qz-mob-students-btn").addEventListener("click", () => overlayShow("qz-students-drawer"));
        $("qz-drawer-close").addEventListener("click",     () => overlayHide("qz-students-drawer"));
        $("qz-students-drawer").addEventListener("click", (e) => {
            if (e.target === $("qz-students-drawer")) overlayHide("qz-students-drawer");
        });

        $("qz-mob-ctrl-btn").addEventListener("click", () => overlayShow("qz-control-sheet"));
        $("qz-control-sheet").addEventListener("click", (e) => {
            if (e.target === $("qz-control-sheet")) overlayHide("qz-control-sheet");
        });

        initTabs();
    }

    // ════════════════════════════════════════════════════════
    // INIT
    // ════════════════════════════════════════════════════════

    document.addEventListener("DOMContentLoaded", () => {
        code = $("hostcode")?.textContent?.trim() ?? "";
        if (!code) {
            console.error("[teacher] Код сесії не знайдено");
            return;
        }

        showView("lobby");
        initSocket();
        bindUIEvents();

        socket.emit("join", { code, as_host: true });
    });

})();
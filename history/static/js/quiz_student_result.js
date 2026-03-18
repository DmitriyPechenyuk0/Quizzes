// document.querySelectorAll(".untruthy").forEach((el) => {
// 	let answers = el.firstElementChild.textContent.split(" ")[1].split("|");
// 	let tAns = [];

// 	answers.forEach((el) => {
// 		if (el.split(":")[1] === "true") {
// 			tAns.push(el.split(":")[0]);
// 		}
// 	});
// 	el.firstElementChild.textContent = `Відповідь: ${tAns.join(", ")}`;
// });

// document.querySelectorAll(".untruthy").forEach((el) => {
// 	let text = el.lastElementChild.textContent;

// 	if (!text.includes("|")) return;

// 	let answersText = text.substring(
// 		text.lastIndexOf(" ", text.indexOf("|")) + 1,
// 	);
// 	let answers = answersText.split("|");

// 	if (answers.length !== 4) return;

// 	let tAns = answers
// 		.filter((answer) => answer.split(":")[1] === "true")
// 		.map((answer) => answer.split(":")[0]);

// 	if (tAns.length > 0) {
// 		el.lastElementChild.textContent = `Правильна відповідь: ${tAns.join(", ")}`;
// 	}
// });

// document.querySelectorAll(".truthy").forEach((el) => {
// 	let text = el.lastElementChild.textContent;
// 	let answersText = text.includes("Відповідь: ")
// 		? text.split("Відповідь: ")[1]
// 		: text;

// 	let answers = answersText.split("|");

// 	if (answers.length !== 4) return;

// 	let tAns = [];

// 	answers.forEach((answer) => {
// 		let parts = answer.split(":");
// 		if (parts[1] === "true") {
// 			tAns.push(parts[0]);
// 		}
// 	});

// 	el.lastElementChild.textContent = `Відповідь: ${tAns.join(", ")}`;
// });


const DATA = JSON.parse(document.getElementById('app-data').textContent);

const META       = DATA.meta;
const SCORE      = DATA.score;
const COMPARISON = DATA.comparison;
const ANSWERS    = DATA.answers;

const ANIM_MS = 900;
const CURVE   = cubicBezier(0.34, 1.4, 0.64, 1);

function cubicBezier(x1, y1, x2, y2) {
    function sampleCurveX(t) {
        return 3*x1*t*(1-t)*(1-t) + 3*x2*t*t*(1-t) + t*t*t;
    }
    function sampleCurveY(t) {
        return 3*y1*t*(1-t)*(1-t) + 3*y2*t*t*(1-t) + t*t*t;
    }
    function solveCurveX(x) {
        let t = x;
        for (let i = 0; i < 8; i++) {
            const dx = sampleCurveX(t) - x;
            if (Math.abs(dx) < 1e-6) break;
            const d = (3*(1-3*x2+3*x1)*t*t + 2*(3*x2-6*x1)*t + 3*x1) || 1e-6;
            t -= dx / d;
        }
        return t;
    }
    return x => sampleCurveY(solveCurveX(x));
}

function animateCount(setter, target, delay = 0, dur = ANIM_MS, suffix = '') {
    setTimeout(() => {
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            setter.textContent = Math.round(CURVE(p) * target) + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else setter.textContent = target + suffix;
        }
        requestAnimationFrame(tick);
    }, delay);
}

function animateBar(el, targetPct, delay = 0, dur = ANIM_MS) {
    setTimeout(() => {
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            el.style.width = CURVE(p) * targetPct + '%';
            if (p < 1) requestAnimationFrame(tick);
            else el.style.width = targetPct + '%';
        }
        requestAnimationFrame(tick);
    }, delay);
}

document.getElementById('sName').textContent = META.student_name;
document.getElementById('sMeta').textContent = `${META.subject}: ${META.quiz_name}`;

const vEl = document.getElementById('sVerdict');
const pct = SCORE.pct;
if (pct >= 75)      { vEl.textContent = 'Відмінно';               vEl.className = 'hero-verdict verdict-good'; }
else if (pct >= 50) { vEl.textContent = 'Добре';                  vEl.className = 'hero-verdict verdict-mid';  }
else                { vEl.textContent = 'Потрібно підготуватись'; vEl.className = 'hero-verdict verdict-low';  }

const scoreEl = document.getElementById('sScore');
animateCount(
    { set textContent(v) { scoreEl.innerHTML = `${v}<span class="u">б</span>`; } },
    pct, 0, ANIM_MS
);
animateCount(
    { set textContent(v) { document.getElementById('sScore12').textContent = `${v} / 12-бальна шкала`; } },
    SCORE.grade12, 0, ANIM_MS
);
animateCount(document.getElementById('sCorrect'), SCORE.correct, 0, ANIM_MS, `/${ANSWERS.length}`);
animateCount(document.getElementById('sWrong'),   SCORE.wrong,   0, ANIM_MS);
animateCount(document.getElementById('sSkipped'), SCORE.skipped, 0, ANIM_MS);

if (SCORE.avg_time_sec !== null) {
    animateCount(document.getElementById('sTime'), SCORE.avg_time_sec, 0, ANIM_MS, 'с');
} else {
    document.getElementById('sTime').textContent = '—';
}

animateBar(document.getElementById('bar-you'),  COMPARISON.my_score,   0, ANIM_MS);
animateBar(document.getElementById('bar-avg'),  COMPARISON.avg_score,  0, ANIM_MS);
animateBar(document.getElementById('bar-best'), COMPARISON.best_score, 0, ANIM_MS);

animateCount(document.getElementById('cmp-you'),  COMPARISON.my_score,   0, ANIM_MS);
animateCount(document.getElementById('cmp-avg'),  COMPARISON.avg_score,  0, ANIM_MS);
animateCount(document.getElementById('cmp-best'), COMPARISON.best_score, 0, ANIM_MS);

const iconMap   = { correct: '✓', wrong: '✗', skipped: '–' };
const iconColor = { correct: '#00c060', wrong: '#e05050', skipped: '#333' };

document.getElementById('qList').innerHTML = ANSWERS.map((a, i) => `
    <div class="q-item ${a.status}">
        <div class="q-top-row">
            <div class="q-num-col">
                <div class="q-n">№${i + 1}</div>
                <div class="q-status-dot"></div>
            </div>
            <div class="q-text">${a.text}</div>
            <div class="q-icon-col">
                <span class="q-icon-sym" style="color:${iconColor[a.status]}">${iconMap[a.status]}</span>
            </div>
        </div>
        <div class="q-bottom-row">
            <div class="q-answer-block">
                <span class="q-ans-label">Відповідь:</span>
                <span class="q-chip ${a.status}">${a.status === 'skipped' ? 'Пропущено' : a.given}</span>
                ${a.status === 'wrong' ? `
                    <span style="color:var(--c5);font-size:11px;margin:0 2px">→</span>
                    <div class="q-correct-hint">
                        <span class="q-correct-label">Правильно:</span>
                        <span class="q-correct-val">${a.correct_answer}</span>
                    </div>` : ''}
                ${a.status === 'skipped' ? `
                    <div class="q-correct-hint">
                        <span class="q-correct-label">Правильно:</span>
                        <span class="q-correct-val">${a.correct_answer}</span>
                    </div>` : ''}
            </div>
            <span class="q-time">${a.time_sec !== null ? '⏱ ' + a.time_sec + 'с' : ''}</span>
        </div>
    </div>
`).join('');
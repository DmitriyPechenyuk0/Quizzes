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


// ── ⏱ Одна константа для всіх анімацій ──────────────────────────────────────
const ANIM_MS = 900;

// ── Cubic Bézier ──────────────────────────────────────────────────────────────
// Налаштовуй тут: (x1, y1, x2, y2) — як в CSS cubic-bezier()
// (0.34, 1.4, 0.64, 1)  — легкий spring-овershoot
// (0.76, 0,   0.24, 1)  — сильний easeInOut без овершуту
// (0.5,  0,   0.1,  1)  — повільний старт, різкий фініш
const CURVE = cubicBezier(0.34, 1.4, 0.64, 1);

function cubicBezier(x1, y1, x2, y2) {
  // Чисельне розв'язання через Newton-Raphson
  function sampleCurveX(t) {
    return ((1 - 3*x2 + 3*x1)*t + (3*x2 - 6*x1))*t*t + 3*x1*t*t*(1-t)*0 +
           3*x1*t*(1-t)*(1-t) + 3*x2*t*t*(1-t) + t*t*t;
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

function animateCount(setter, target, delay = 0, dur = ANIM_MS, suffix = '', onDone = null) {
  setTimeout(() => {
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const v = CURVE(p);
      setter.textContent = Math.round(Math.min(Math.max(v, 0), 1) * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else { setter.textContent = target + suffix; onDone && onDone(); }
    }
    requestAnimationFrame(tick);
  }, delay);
}

function animateBar(el, targetPct, delay = 0, dur = ANIM_MS) {
  setTimeout(() => {
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const v = CURVE(p);
      el.style.width = Math.min(Math.max(v, 0), 1) * targetPct + '%';
      if (p < 1) requestAnimationFrame(tick);
      else el.style.width = targetPct + '%';
    }
    requestAnimationFrame(tick);
  }, delay);
}

// ── дані ──────────────────────────────────────────────────────────────────────
const QS = [
  "Перший закон Ньютона формулює...",
  "Одиниця вимірювання сили в СІ",
  "Формула другого закону Ньютона",
  "Сила реакції відносно сили дії",
  "Інерція залежить від...",
  "Маса тіла 5 кг, прискорення 3 м/с². Яка сила?",
  "Що таке рівноприскорений рух?",
  "Третій закон Ньютона стверджує...",
  "Яка маса потрібна при F=20Н, a=4м/с²?",
  "Де закони Ньютона незастосовні?",
  "Вага та маса — це...",
  "Коефіцієнт тертя залежить від...",
  "Сила тяжіння та сила реакції опори...",
  "Прискорення вільного падіння рівне...",
  "Силу виміряємо у ньютонах, бо...",
];

const COR = [
  'Тіло зберігає стан спокою або рівноміру.','Ньютон (Н)','F = ma',
  'Рівна та протилежна','Від маси тіла','15 Н',
  'Рух зі сталим прискоренням','Сили дії і протидії рівні','5 кг',
  'При швидкостях, близьких до c','Різні фізичні величини',
  'Від матеріалів поверхонь','Не є парою 3-го закону','9.8 м/с²','Так визначено в СІ',
];

const ANSWERS = [
  {s:'correct', a:'Тіло зберігає стан спокою або рівноміру.', t:22},
  {s:'correct', a:'Ньютон (Н)', t:11},
  {s:'correct', a:'F = ma', t:15},
  {s:'wrong',   a:'Рівна і більша', t:44},
  {s:'correct', a:'Від маси тіла', t:18},
  {s:'correct', a:'15 Н', t:35},
  {s:'correct', a:'Рух зі сталим прискоренням', t:27},
  {s:'correct', a:'Сили дії і протидії рівні', t:31},
  {s:'wrong',   a:'4 кг', t:58},
  {s:'correct', a:'При швидкостях, близьких до c', t:42},
  {s:'correct', a:'Різні фізичні величини', t:19},
  {s:'skipped', a:'—', t:60},
  {s:'correct', a:'Не є парою 3-го закону', t:38},
  {s:'correct', a:'9.8 м/с²', t:14},
  {s:'correct', a:'Так визначено в СІ', t:33},
];

function s12(p){
  if(p>=90)return 12; if(p>=83)return 11; if(p>=75)return 10;
  if(p>=67)return 9;  if(p>=58)return 8;  if(p>=50)return 7;
  if(p>=42)return 6;  if(p>=33)return 5;  if(p>=25)return 4;
  if(p>=17)return 3;  if(p>=8)return 2;   return 1;
}

// ── підрахунок ────────────────────────────────────────────────────────────────
const correct = ANSWERS.filter(a => a.s === 'correct').length;
const wrong   = ANSWERS.filter(a => a.s === 'wrong').length;
const skipped = ANSWERS.filter(a => a.s === 'skipped').length;
const pct  = Math.round(correct / QS.length * 100);
const avgT = Math.round(ANSWERS.reduce((s, a) => s + a.t, 0) / ANSWERS.length);

// ── verdict (одразу) ──────────────────────────────────────────────────────────
const vEl = document.getElementById('sVerdict');
if (pct >= 75)      { vEl.textContent = 'Відмінно';               vEl.className = 'hero-verdict verdict-good'; }
else if (pct >= 50) { vEl.textContent = 'Добре';                  vEl.className = 'hero-verdict verdict-mid';  }
else                { vEl.textContent = 'Потрібно підготуватись'; vEl.className = 'hero-verdict verdict-low';  }

// ── великий відсоток ──────────────────────────────────────────────────────────
const scoreEl = document.getElementById('sScore');
scoreEl.innerHTML = `0<span class="u">б</span>`;
document.getElementById('sScore12').textContent = '— / 12-бальна шкала';

animateCount(
  { set textContent(v) { scoreEl.innerHTML = `${v}<span class="u">б</span>`; } },
  pct, 0, ANIM_MS
);

animateCount(
  { set textContent(v) { document.getElementById('sScore12').textContent = `${v} / 12-бальна шкала`; } },
  s12(pct), 0, ANIM_MS
);
animateCount(document.getElementById('sCorrect'), correct, 0, ANIM_MS, `/${QS.length}`);
animateCount(document.getElementById('sWrong'),   wrong,   0, ANIM_MS);
animateCount(document.getElementById('sSkipped'), skipped, 0, ANIM_MS);
animateCount(document.getElementById('sTime'),    avgT,    0, ANIM_MS, 'с');

animateBar(document.getElementById('bar-you'),  pct, 0, ANIM_MS);
animateBar(document.getElementById('bar-avg'),  67,  0, ANIM_MS);
animateBar(document.getElementById('bar-best'), 94,  0, ANIM_MS);

animateCount(document.getElementById('cmp-you'),  pct, 0, ANIM_MS);
animateCount(document.getElementById('cmp-avg'),  67,  0, ANIM_MS);
animateCount(document.getElementById('cmp-best'), 94,  0, ANIM_MS);

// ── рендер списку ─────────────────────────────────────────────────────────────
const iconMap   = { correct: '✓', wrong: '✗', skipped: '–' };
const iconColor = { correct: '#00c060', wrong: '#e05050', skipped: '#333' };

document.getElementById('qList').innerHTML = ANSWERS.map((a, i) => `
  <div class="q-item ${a.s}">
    <div class="q-top-row">
      <div class="q-num-col">
        <div class="q-n">№${i+1}</div>
        <div class="q-status-dot"></div>
      </div>
      <div class="q-text">${QS[i]}</div>
      <div class="q-icon-col">
        <span class="q-icon-sym" style="color:${iconColor[a.s]}">${iconMap[a.s]}</span>
      </div>
    </div>
    <div class="q-bottom-row">
      <div class="q-answer-block">
        <span class="q-ans-label">Відповідь:</span>
        <span class="q-chip ${a.s}">${a.s === 'skipped' ? 'Пропущено' : a.a}</span>
        ${a.s === 'wrong' ? `
          <span style="color:var(--c5);font-size:11px;margin:0 2px">→</span>
          <div class="q-correct-hint">
            <span class="q-correct-label">Правильно:</span>
            <span class="q-correct-val">${COR[i]}</span>
          </div>` : ''}
        ${a.s === 'skipped' ? `
          <div class="q-correct-hint">
            <span class="q-correct-label">Правильно:</span>
            <span class="q-correct-val">${COR[i]}</span>
          </div>` : ''}
      </div>
      <span class="q-time">⏱ ${a.t}с</span>
    </div>
  </div>
`).join('');
// document.addEventListener("DOMContentLoaded", () => {
// 	const section = document.getElementById("quizData");

// 	const questionLabels = JSON.parse(section.dataset.questionLabels || "[]");
// 	const questionDataRaw = JSON.parse(section.dataset.questionData || "[]");
// 	const avgAccuracy = parseFloat(section.dataset.avgAccuracy || "0");
// 	const incorrect = 100 - avgAccuracy;

// 	const MIN_BAR = 2;
// 	const questionData = questionDataRaw.map((p) => (p === 0 ? MIN_BAR : p));

// 	// === Диаграмма по вопросам ===
// 	const questionCtx = document.getElementById("questionChart");
// 	if (questionCtx) {
// 		new Chart(questionCtx, {
// 			type: "bar",
// 			data: {
// 				labels: questionLabels.map((_, i) => `Питання ${i + 1}`),
// 				datasets: [
// 					{
// 						label: "Процент правильних відповідей",
// 						data: questionData,
// 						backgroundColor: "rgba(54, 162, 235, 0.7)",
// 						borderColor: "rgba(54, 162, 235, 1)",
// 						borderWidth: 1,
// 						borderRadius: 5,
// 					},
// 				],
// 			},
// 			options: {
// 				responsive: true,
// 				plugins: {
// 					legend: { display: false },
// 					tooltip: {
// 						callbacks: {
// 							label: (ctx) =>
// 								`${questionDataRaw[ctx.dataIndex]}%`,
// 						},
// 					},
// 				},
// 				scales: {
// 					y: {
// 						beginAtZero: true,
// 						max: 100,
// 						title: { display: true, text: "Процент (%)" },
// 					},
// 					x: { title: { display: true, text: "Питання" } },
// 				},
// 			},
// 			plugins: [
// 				{
// 					id: "insideLabels",
// 					afterDatasetsDraw(chart) {
// 						const { ctx } = chart;
// 						const dataset = chart.data.datasets[0];
// 						dataset.data.forEach((value, index) => {
// 							const meta = chart.getDatasetMeta(0).data[index];
// 							const realPercent = questionDataRaw[index];
// 							ctx.fillStyle = "#fff";
// 							ctx.font = "bold 12px Arial";
// 							ctx.textAlign = "center";
// 							ctx.textBaseline = "middle";
// 							ctx.fillText(
// 								`${realPercent}%`,
// 								meta.x,
// 								meta.y - 10,
// 							);
// 						});
// 					},
// 				},
// 			],
// 		});
// 	}

// 	// === Диаграмма общего процента ===
// 	const summaryCtx = document.getElementById("summaryChart");
// 	if (summaryCtx) {
// 		new Chart(summaryCtx, {
// 			type: "doughnut",
// 			data: {
// 				labels: ["Правильні", "Неправильні"],
// 				datasets: [
// 					{
// 						data: [avgAccuracy, incorrect],
// 						backgroundColor: ["#4CAF50", "#F44336"],
// 						borderColor: "#fff",
// 						borderWidth: 2,
// 					},
// 				],
// 			},
// 			options: {
// 				responsive: true,
// 				cutout: "0%",
// 				plugins: {
// 					legend: {
// 						position: "bottom",
// 						labels: { boxWidth: 20, padding: 15 },
// 					},
// 					tooltip: {
// 						callbacks: {
// 							label: (ctx) =>
// 								`${ctx.label}: ${ctx.parsed.toFixed(1)}%`,
// 						},
// 					},
// 				},
// 			},
// 		});
// 	}

// 	// === Обработчик кликов по строкам таблицы ===
// 	document.querySelectorAll(".student-row").forEach((row) => {
// 		row.addEventListener("click", () => {
// 			const userId = row.dataset.userId;
// 			const sessionId = row.dataset.sessionId;
// 			if (userId && sessionId) {
// 				window.location.href = `/history/student?user_id=${userId}&session_id=${sessionId}`;
// 			}
// 		});
// 	});
// });


const DATA = JSON.parse(document.getElementById('app-data').textContent);
const SESSION = DATA.session;
const SUMMARY = DATA.summary;

const QS   = DATA.questions.map(q => q.text);
const COR  = DATA.questions.map(q => q.correct_answer);
const CPCT = DATA.questions.map(q => q.correct_pct);
const WPCT = DATA.questions.map(q => q.wrong_pct);

const students = DATA.students.map(s => ({
    n:       s.name,
    score:   s.score_pct,
    correct: s.correct_count,
    answers: s.answers.map(a => ({ s: a.status, a: a.given ?? '—' })),
}));

function s12(p) {
    if (p >= 90) return 12; if (p >= 83) return 11; if (p >= 75) return 10;
    if (p >= 67) return 9;  if (p >= 58) return 8;  if (p >= 50) return 7;
    if (p >= 42) return 6;  if (p >= 33) return 5;  if (p >= 25) return 4;
    if (p >= 17) return 3;  if (p >= 8)  return 2;  return 1;
}

document.querySelector('.stat:nth-child(1) .stat-val').innerHTML =
    `${SUMMARY.avg_correct_pct}<span class="u">%</span>`;

document.querySelector('.stat:nth-child(2) .stat-val').innerHTML =
    `${SUMMARY.avg_wrong_pct}<span class="u">%</span>`;

document.querySelector('.stat:nth-child(3) .stat-val').innerHTML =
    `${SUMMARY.avg_skipped_pct}<span class="u">%</span>`;

document.querySelector('.stat:nth-child(4) .stat-val').innerHTML =
    `—<span class="u">с</span>`;

document.querySelector('.stat:nth-child(5) .stat-val').innerHTML =
    `${SUMMARY.avg_score_100}<span class="u">б</span>`;

document.querySelector('.stat:nth-child(6) .stat-val').innerHTML =
    `${SUMMARY.avg_score_12}<span class="u">/12</span>`;

document.querySelector('.students-topbar-title').textContent =
    `Учні — ${SUMMARY.total_participants}`;

document.querySelector('.score-pair .score-box:nth-child(1) .score-box-val').innerHTML =
    `${SUMMARY.avg_score_100}<span class="u">б</span>`;

document.querySelector('.score-pair .score-box:nth-child(2) .score-box-val').innerHTML =
    `${SUMMARY.avg_score_12}<span class="u">/12</span>`;

const dist = SUMMARY.dist;
const segs = document.querySelectorAll('.dist-seg');
if (segs.length === 3) {
    segs[0].style.width = dist.below_50  + '%';
    segs[1].style.width = dist.mid_50_74 + '%';
    segs[2].style.width = dist.above_75  + '%';
}
const distLabels = document.querySelectorAll('.dist-labels span');
if (distLabels.length === 3) {
    distLabels[0].textContent = `${dist.below_50}% нижче 50б`;
    distLabels[1].textContent = `${dist.mid_50_74}% 50–74б`;
    distLabels[2].textContent = `${dist.above_75}% вище 75б`;
}

if (SUMMARY.best) {
    document.querySelector('.best-worst div:nth-child(1) .bw-val').innerHTML =
        `${SUMMARY.best.score}<span style="font-size:var(--fs-md);color:var(--c6);font-weight:400">б</span>`;
    document.querySelector('.best-worst div:nth-child(1) .bw-name').textContent =
        SUMMARY.best.name;
}
if (SUMMARY.worst) {
    document.querySelector('.best-worst div:nth-child(2) .bw-val').innerHTML =
        `${SUMMARY.worst.score}<span style="font-size:var(--fs-md);color:var(--c6);font-weight:400">б</span>`;
    document.querySelector('.best-worst div:nth-child(2) .bw-name').textContent =
        SUMMARY.worst.name;
}

const ctx = document.getElementById('chartQ').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: QS.map((_, i) => `П${i + 1}`),
        datasets: [{
            label: '% правильних',
            data: CPCT,
            borderColor: 'rgba(200,200,200,0.5)',
            backgroundColor: 'rgba(200,200,200,0.04)',
            borderWidth: 1.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: CPCT.map(v => v >= 70 ? '#00c060' : v >= 50 ? '#c8a040' : '#e05050'),
            pointBorderColor: '#111',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1a1a1a',
                borderColor: '#2a2a2a',
                borderWidth: 1,
                titleColor: '#fff',
                bodyColor: '#888',
                titleFont: { family: 'Outfit', weight: '700', size: 12 },
                bodyFont: { family: 'Golos Text', size: 11 },
                padding: 12,
                callbacks: {
                    title: items => `П${items[0].dataIndex + 1}: ${QS[items[0].dataIndex].substring(0, 32)}...`,
                    label: item  => ` ${item.raw}% відповіли правильно`,
                }
            }
        },
        scales: {
            x: {
                grid:   { color: '#1a1a1a' },
                ticks:  { color: '#555', font: { family: 'Outfit', size: 11, weight: '600' } },
                border: { color: '#222' },
            },
            y: {
                min: 0, max: 100,
                grid:   { color: '#1a1a1a' },
                ticks:  { color: '#555', font: { family: 'Outfit', size: 11 }, callback: v => v + '%', stepSize: 25 },
                border: { color: '#222' },
            }
        }
    }
});

function renderStudents(list) {
    const el = document.getElementById('studentsList');
    el.innerHTML = list.map((s, i) => {
        const cls = s.score >= 75 ? 'score-high' : s.score >= 50 ? 'score-mid' : 'score-low';
        return `
        <div class="student-row ${cls}" onclick="openModal(${students.indexOf(s)})">
            <div class="s-rank">${i + 1}</div>
            <div class="s-name">${s.n}</div>
            <div class="s-val">${s.score}</div>
            <div class="s-val" style="color:var(--c7)">${s12(s.score)}</div>
            <div class="s-sub">
                ${s.correct}/${QS.length}
                <div class="s-bar"><div class="s-bar-fill" style="width:${s.score}%"></div></div>
            </div>
            <div class="s-val" style="color:var(--c7)">—</div>
            <div class="s-arrow">›</div>
        </div>`;
    }).join('');
}

renderStudents(students);

function filterStudents(q) {
    renderStudents(students.filter(s => s.n.toLowerCase().includes(q.toLowerCase())));
}

function openModal(idx) {
    const s = students[idx];
    document.getElementById('mName').textContent     = s.n;
    document.getElementById('mScore100').textContent = s.score;
    document.getElementById('mScore12').textContent  = `${s12(s.score)}/12`;
    document.getElementById('overlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    document.getElementById('mBody').innerHTML = s.answers.map((a, i) => `
        <div class="mq-row ${a.s}">
            <div class="mq-n">${i + 1}</div>
            <div>
                <div class="mq-q">${QS[i]}</div>
                ${a.s === 'wrong' ? `<div class="mq-sub" style="color:var(--acc)">✓ ${COR[i]}</div>` : ''}
            </div>
            <div class="mq-ans ${a.s}">${a.s === 'skipped' ? 'Пропущено' : a.a}</div>
            <div class="mq-icon">${
                a.s === 'correct' ? '<span style="color:#00c060">✓</span>' :
                a.s === 'wrong'   ? '<span style="color:#e05050">✗</span>' :
                                    '<span style="color:#333">–</span>'
            }</div>
        </div>`).join('');
}

function closeModal() {
    document.getElementById('overlay').classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});
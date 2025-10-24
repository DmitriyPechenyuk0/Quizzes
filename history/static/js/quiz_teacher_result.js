document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("quizData");

    const questionLabels = JSON.parse(section.dataset.questionLabels || "[]");
    const questionDataRaw = JSON.parse(section.dataset.questionData || "[]");
    const avgAccuracy = parseFloat(section.dataset.avgAccuracy || "0");
    const incorrect = 100 - avgAccuracy;

    const MIN_BAR = 2;
    const questionData = questionDataRaw.map(p => p === 0 ? MIN_BAR : p);


    const questionCtx = document.getElementById("questionChart");
    if (questionCtx) {
      new Chart(questionCtx, {
        type: "bar",
        data: {
          labels: questionLabels.map((_, i) => `Питання ${i + 1}`),
          datasets: [{
            label: "Процент правильних відповідей",
            data: questionData,
            backgroundColor: "rgba(54, 162, 235, 0.7)", 
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { 
                label: (ctx) => `${questionDataRaw[ctx.dataIndex]}%` 
              }
            }
          },
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: "Процент (%)" } },
            x: { title: { display: true, text: "Питання" } }
          }
        },
        plugins: [{
          id: 'insideLabels',
          afterDatasetsDraw(chart) {
            const { ctx } = chart;
            const dataset = chart.data.datasets[0];
            dataset.data.forEach((value, index) => {
              const meta = chart.getDatasetMeta(0).data[index];
              const realPercent = questionDataRaw[index];
              ctx.fillStyle = "#fff"; 
              ctx.font = "bold 12px Arial";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(`${realPercent}%`, meta.x, meta.y - 10);
            });
          }
        }]
      });
    }

    const summaryCtx = document.getElementById("summaryChart");
    if (summaryCtx) {
      new Chart(summaryCtx, {
        type: "doughnut",
        data: {
          labels: ["Правильні", "Неправильні"],
          datasets: [{
            data: [avgAccuracy, incorrect],
            backgroundColor: ["#4CAF50", "#F44336"],
            borderColor: "#fff",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          cutout: "0%",
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 20, padding: 15 } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } }
          }
        }
      });
    }
});

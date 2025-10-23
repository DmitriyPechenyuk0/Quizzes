document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("quizData");
  

    const questionLabels = JSON.parse(section.dataset.questionLabels || "[]");
    const questionData = JSON.parse(section.dataset.questionData || "[]");
    const avgAccuracy = parseFloat(section.dataset.avgAccuracy || "0");
    const incorrect = 100 - avgAccuracy;
  

    const questionCtx = document.getElementById("questionChart");
    if (questionCtx) {
      new Chart(questionCtx, {
        type: "bar",
        data: {
          labels: questionLabels,
          datasets: [{
            label: "Процент правильних відповідей",
            data: questionData,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
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
              callbacks: { label: (ctx) => `${ctx.parsed.y}%` }
            }
          },
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: "Процент (%)" } },
            x: { title: { display: true, text: "Питання" } }
          }
        }
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
          cutout: "40%",
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 20, padding: 15 } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } }
          }
        }
      });
    }
  });
  
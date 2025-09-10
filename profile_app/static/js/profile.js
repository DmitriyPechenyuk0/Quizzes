let currentQuizId = null;
let currentCard = null; // Текущая карточка для удаления

// Открытие модалки
function openModal(quizId, quizName) {
    console.log('Opening modal:', quizId, quizName);

    currentQuizId = quizId;

    // Находим карточку по quizId
    currentCard = document.querySelector(`.quiz-card[onclick*="'${quizId}'"]`);

    document.getElementById('modalTitle').textContent = quizName;
    document.getElementById('startBtn').href = `/quiz/start/${quizId}`;

    const modal = document.getElementById('quizModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Закрытие модалки
function closeModal() {
    console.log('Closing modal');
    const modal = document.getElementById('quizModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentQuizId = null;
    currentCard = null;
}

// Удаление квиза
async function deleteQuiz() {
    if (!currentQuizId) return;

    if (!confirm('Вы уверены, что хотите удалить этот квиз?')) return;

    try {
        const response = await fetch(`/quiz/delete/${currentQuizId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken() // если используешь Flask-WTF
            }
        });

        if (response.ok) {
            console.log('Quiz deleted:', currentQuizId);
            if (currentCard) currentCard.remove(); // Удаляем из DOM
            closeModal();
        } else {
            const data = await response.json();
            alert('Ошибка при удалении квиза: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка при удалении квиза');
    }
}

// Закрытие модалки по клику вне окна
document.getElementById('quizModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// Получение CSRF токена для Flask-WTF
function getCSRFToken() {
    const token = document.querySelector('meta[name=csrf-token]');
    return token ? token.getAttribute('content') : '';
}

// Добавляем курсор pointer для карточек
document.querySelectorAll('.quiz-card').forEach(card => {
    card.style.cursor = 'pointer';
});

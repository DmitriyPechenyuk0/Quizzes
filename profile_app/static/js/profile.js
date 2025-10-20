let currentQuizId = null;

function openModal(quizId, quizName) {
    console.log('Opening modal:', quizId, quizName);
    currentQuizId = quizId;

    document.getElementById('startBtn').href = `/quiz/start/${quizId}`;

    const modal = document.getElementById('quizModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    console.log('Closing modal');
    const modal = document.getElementById('quizModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentQuizId = null;
}

async function deleteQuiz() {
    if (!currentQuizId) return;

    try {
        const response = await fetch(`/quiz/delete/${currentQuizId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            console.log('Quiz deleted:', currentQuizId);
            const card = document.querySelector(`.quiz-card[onclick*="'${currentQuizId}'"]`);
            if (card) card.remove();
            closeModal();
            updateQuizCount();
        } else {
            const data = await response.json();
            console.error('Ошибка при удалении квиза:', data.message);
        }
    } catch (err) {
        console.error('Ошибка при удалении квиза:', err);
    }
}

function updateQuizCount() {
    const quizCards = document.querySelectorAll('#created-quizzes-section .quiz-card');
    const countElement = document.querySelector('#show-created-btn p');
    if (countElement) {
        countElement.textContent = quizCards.length;
    }
}

document.getElementById('quizModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

document.addEventListener('DOMContentLoaded', () => {

    const showCreatedBtn = document.getElementById('show-created-btn');
    const showCompletedBtn = document.getElementById('show-completed-btn');
    const createdSection = document.getElementById('created-quizzes-section');
    const completedSection = document.getElementById('completed-quizzes-section');


    if (showCreatedBtn && showCompletedBtn && createdSection && completedSection) {
        
        showCreatedBtn.addEventListener('click', () => {

            createdSection.style.display = 'block';
            completedSection.style.display = 'none';

            showCreatedBtn.classList.add('active');
            showCompletedBtn.classList.remove('active');
        });

        showCompletedBtn.addEventListener('click', () => {

            createdSection.style.display = 'none';
            completedSection.style.display = 'block';
   
            showCompletedBtn.classList.add('active');
            showCreatedBtn.classList.remove('active');
        });
    }
});
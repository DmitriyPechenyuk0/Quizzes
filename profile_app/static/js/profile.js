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
                'X-CSRFToken': getCSRFToken()
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
    const quizCards = document.querySelectorAll('.quiz-card');
    const countElement = document.querySelector('.quiz-count-box:first-child p');
    if (countElement) {
        countElement.textContent = quizCards.length;
    }
}


function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.content : '';
}


document.getElementById('quizModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});


document.querySelectorAll('.quiz-card').forEach(card => {
    card.style.cursor = 'pointer';
});




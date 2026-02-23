document.addEventListener('DOMContentLoaded', function() {
    function handleResponse(response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Network response was not ok.');
    }

    function updateCounts() {
        const studentsCount = document.querySelectorAll('.column:nth-child(2) .user').length;
        const requestsCount = document.querySelectorAll('.column:nth-child(3) .user').length;

        document.querySelector('.column:nth-child(2) h3').textContent = `Учасники (${studentsCount})`;
        document.querySelector('.column:nth-child(3) h3').textContent = `Запити (${requestsCount})`;
    }

    function fetchQuizHistory() {
        fetch('/get_class_quiz_history')
            .then(handleResponse)
            .then(data => {
                if (data.success) {
                    const grid = document.getElementById('quizHistoryGrid');
                    grid.innerHTML = '';
                    data.quizzes.forEach(quiz => {
                        const quizCard = document.createElement('div');
                        quizCard.className = 'quiz-card';
                        quizCard.innerHTML = `
                            ${quiz.image ?
                                `<img src="/New_Quiz/static/media/${quiz.image}" alt="Quiz Image">` :
                                `<img src="/profile_app/static/img/placeholder.png" alt="Quiz Image">`
                            }
                            <p>${quiz.name}</p>
                        `;
                        grid.appendChild(quizCard);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    let quizHistoryInterval = setInterval(fetchQuizHistory, 20000);

    fetchQuizHistory();

    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-accept')) {
            e.preventDefault();
            const btn = e.target.closest('.btn-accept');
            const form = btn.closest('form');
            const userDiv = form.closest('.user');
            const studentId = form.action.split('/').pop();
            fetch(`/accept_student/${studentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(handleResponse)
            .then(data => {
                if (data.success) {
                    const studentsColumn = document.querySelector('.column:nth-child(2)');
                    const userClone = userDiv.cloneNode(true);

                    const acceptBtn = userClone.querySelector('.btn-accept').closest('form');
                    acceptBtn.remove();

                    studentsColumn.appendChild(userClone);
                    userDiv.remove();

                    updateCounts();
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-remove')) {
            e.preventDefault();
            const btn = e.target.closest('.btn-remove');
            const form = btn.closest('form');
            const userDiv = form.closest('.user');
            const studentId = form.action.split('/').pop();
            fetch(`/remove_student/${studentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(handleResponse)
            .then(data => {
                if (data.success) {
                    userDiv.remove();
                    updateCounts();
                } else {
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    });
});
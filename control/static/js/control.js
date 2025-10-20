document.addEventListener('DOMContentLoaded', function() {
    function handleResponse(response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Network response was not ok.');
    }

    function showMessage(message, type) {
        const flashContainer = document.querySelector('.flash-messages');
        if (flashContainer) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `alert alert-${type}`;
            messageDiv.textContent = message;
            flashContainer.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 5000);
        }
    }

    function updateCounts() {
        const studentsCount = document.querySelectorAll('.column:nth-child(2) .user').length;
        const requestsCount = document.querySelectorAll('.column:nth-child(3) .user').length;
        
        document.querySelector('.column:nth-child(2) h3').textContent = `Учасники (${studentsCount})`;
        document.querySelector('.column:nth-child(3) h3').textContent = `Запити (${requestsCount})`;
    }

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
                    
                    showMessage(data.message, 'success');
                    updateCounts();
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(error => {
                showMessage('Виникла помилка при обробці запиту.', 'error');
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
                    showMessage(data.message, 'success');
                    updateCounts();
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(error => {
                showMessage('Виникла помилка при обробці запиту.', 'error');
                console.error('Error:', error);
            });
        }
    });
});

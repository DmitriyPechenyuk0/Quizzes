let selectedGroupId = null;
const groupCards = document.querySelectorAll('.group-card');
const joinBtn = document.getElementById('joinBtn');
const searchInput = document.getElementById('searchInput');

groupCards.forEach(card => {
    card.addEventListener('click', function() {
        selectGroup(this);
    });

    card.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectGroup(this);
        }
    });
});

function selectGroup(card) {
    groupCards.forEach(c => c.classList.remove('selected'));

    card.classList.add('selected');
    selectedGroupId = card.dataset.groupId;
    
    joinBtn.disabled = false;

    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

if (searchInput) {
    searchInput.addEventListener('input', filterGroups);
}

function filterGroups() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    groupCards.forEach(card => {
        const groupName = card.dataset.groupName.toLowerCase();
        const teacher = card.dataset.teacher.toLowerCase();
        
        if (groupName.includes(searchTerm) || teacher.includes(searchTerm)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const emptyState = document.getElementById('emptyState');
    const groupsList = document.getElementById('groupsList');
    
    if (emptyState && groupsList) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        groupsList.style.display = visibleCount === 0 ? 'none' : 'block';
    }
}

if (joinBtn) {
    joinBtn.addEventListener('click', sendJoinRequest);
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

function sendJoinRequest() {
    const selectedCard = document.querySelector('.group-card.selected');
    
    if (!selectedCard) {
        return;
    }

    const groupId = selectedCard.dataset.groupId;
    const groupName = selectedCard.dataset.groupName;
    const teacher = selectedCard.dataset.teacher;
    const joinBtn = document.getElementById('joinBtn');

    const originalText = joinBtn.innerHTML;
    joinBtn.innerHTML = '<span style="opacity: 0.7;">Надсилання...</span>';
    joinBtn.disabled = true;

    fetch('/api/join-group', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            group_id: groupId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(
                'success',
                `Запит успішно надіслано!`,
                `Група: ${groupName}\nВикладач: ${teacher}\n\nОчікуйте підтвердження від викладача.`
            );
            setTimeout(() => {
                window.location.href = data.redirect_url || '/dashboard';
            }, 2000);
        } else {
            showNotification('error', 'Помилка', data.message || 'Не вдалося надіслати запит');
            joinBtn.innerHTML = originalText;
            joinBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'Помилка', 'Сталася помилка при надсиланні запиту');
        joinBtn.innerHTML = originalText;
        joinBtn.disabled = false;
    });
}

function skipSelection() {
    if (confirm('Ви впевнені, що хочете пропустити приєднання до групи?\n\nБез групи ви не матимете доступу до тестів та матеріалів. Ви зможете приєднатися пізніше в налаштуваннях.')) {
        fetch('/api/skip-group-selection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url || '/dashboard';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/dashboard';
        });
    }
}

function closeModal() {
    if (confirm('Закрити вікно вибору групи?')) {
        window.location.href = '/dashboard';
    }
}

function showNotification(type, title, message) {
    if (type === 'success') {
        alert(`✅ ${title}\n\n${message}`);
    } else {
        alert(`❌ ${title}\n\n${message}`);
    }
}
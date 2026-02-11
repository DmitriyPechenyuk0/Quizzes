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
    
    const cPassw = document.getElementById('confirmPassword').value;
    const passw = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    const name = document.getElementById('username').value;
    if(cPassw !== passw){
        return;
    }
    const zapros = {
        name,
        email,
        passw,
        groupId
    }
    console.log(zapros)
    const originalText = joinBtn.innerHTML;
    joinBtn.innerHTML = '<span style="opacity: 0.7;">Надсилання...</span>';
    joinBtn.disabled = true;
    fetch('/registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(zapros)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        if (data.success) {
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            joinBtn.innerHTML = originalText;
            joinBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        joinBtn.innerHTML = originalText;
        joinBtn.disabled = false;
    });
}

function skipSelection() {
    const cPassw = document.getElementById('confirmPassword').value;
    const passw = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    const name = document.getElementById('username').value;
    if(cPassw !== passw){
        return;
    }
    const zapros = {
        name,
        email,
        passw
    }
    console.log(zapros)
    const originalText = joinBtn.innerHTML;
    joinBtn.innerHTML = '<span style="opacity: 0.7;">Надсилання...</span>';
    joinBtn.disabled = true;
    fetch('/registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(zapros)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        if (data.success) {
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            joinBtn.innerHTML = originalText;
            joinBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        joinBtn.innerHTML = originalText;
        joinBtn.disabled = false;
    });
}
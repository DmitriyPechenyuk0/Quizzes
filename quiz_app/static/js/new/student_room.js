// Initial data
let students = [
    { id: 1, name: 'Олена Коваленко', status: 'connected', joinedAt: Date.now() - 8000 },
    { id: 2, name: 'Дмитро Шевченко', status: 'connected', joinedAt: Date.now() - 7000 },
    { id: 3, name: 'Марія Петренко', status: 'pending', joinedAt: Date.now() - 6000 },
    { id: 4, name: 'Іван Бойко', status: 'pending', joinedAt: Date.now() - 5000 },
];

// Current user - можна змінити для тестування різних сценаріїв
let currentUserId = 1; // За замовчуванням Олена (connected)
// let currentUserId = 3; // Марія (pending)

// DOM Elements
const participantsList = document.getElementById('participantsList');
const connectedCountEl = document.getElementById('connectedCount');
const totalCountEl = document.getElementById('totalCount');
const waitingConnected = document.getElementById('waitingConnected');
const waitingPending = document.getElementById('waitingPending');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderStudents();
    updateCounts();
    updateStudentView();
    startConnectionSimulation();
});

// Update student view based on current user status
function updateStudentView() {
    const currentUser = students.find(s => s.id === currentUserId);
    
    if (!currentUser) {
        // User was rejected or removed
        waitingConnected.style.display = 'none';
        waitingPending.style.display = 'none';
        return;
    }
    
    if (currentUser.status === 'pending') {
        waitingConnected.style.display = 'none';
        waitingPending.style.display = 'flex';
    } else {
        waitingConnected.style.display = 'flex';
        waitingPending.style.display = 'none';
    }
}

// Render students list (only non-pending students visible to student)
function renderStudents() {
    participantsList.innerHTML = '';
    
    // Only show connected and connecting students
    const visibleStudents = students.filter(s => s.status !== 'pending');
    
    visibleStudents.forEach((student, index) => {
        const card = createStudentCard(student, index);
        participantsList.appendChild(card);
    });
}

// Create student card element
function createStudentCard(student, index) {
    const card = document.createElement('div');
    card.className = 'student-cardq';
    card.setAttribute('data-student-id', student.id);
    
    const initials = student.name.split(' ').map(n => n[0]).join('');
    const statusClass = student.status === 'connected' ? 'connectedq' : 'connectingq';
    const statusText = student.status === 'connected' ? 'Підключено' : 'Підключається';
    const statusTextClass = student.status === 'connected' ? 'connected-textq' : 'connecting-textq';
    
    card.innerHTML = `
        <div class="student-contentq">
            <div class="student-infoq">
                <div class="avatarq">
                    <span class="avatar-textq">${initials}</span>
                </div>
                <div class="student-detailsq">
                    <p class="student-nameq">${student.name}</p>
                    <div class="student-statusq">
                        <i class="bi bi-circle-fill status-iconq ${statusClass}"></i>
                        <span class="status-textq ${statusTextClass}">${statusText}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Update counts
function updateCounts() {
    const connectedCount = students.filter(s => s.status === 'connected').length;
    const totalCount = students.filter(s => s.status !== 'pending').length;
    
    connectedCountEl.textContent = connectedCount;
    totalCountEl.textContent = totalCount;
}

// Simulate connection status changes
function startConnectionSimulation() {
    setInterval(() => {
        let hasChanges = false;
        
        students = students.map(student => {
            if (student.status === 'connecting') {
                hasChanges = true;
                return { ...student, status: 'connected' };
            }
            return student;
        });
        
        if (hasChanges) {
            renderStudents();
            updateCounts();
            updateStudentView();
        }
    }, 1500);
}
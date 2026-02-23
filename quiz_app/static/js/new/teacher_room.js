// Initial data
let students = [
    { id: 1, name: 'Олена Коваленко', status: 'connected', joinedAt: Date.now() - 5000 },
    { id: 2, name: 'Дмитро Шевченко', status: 'connected', joinedAt: Date.now() - 3000 },
    { id: 3, name: 'Марія Петренко', status: 'connected', joinedAt: Date.now() - 2000 },
    { id: 4, name: 'Іван Бойко', status: 'connecting', joinedAt: Date.now() - 1000 },
];

let currentView = 'student';

// DOM Elements
const studentView = document.getElementById('studentView');
const teacherView = document.getElementById('teacherView');
const participantsList = document.getElementById('participantsList');
const connectedCountEl = document.getElementById('connectedCount');
const totalCountEl = document.getElementById('totalCount');
const startBtn = document.getElementById('startBtn');
const toggleButtons = document.querySelectorAll('.toggle-btnq');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderStudents();
    updateCounts();
    setupEventListeners();
    startConnectionSimulation();
});

// Event Listeners
function setupEventListeners() {
    // Toggle buttons
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.getAttribute('data-view');
            switchView(view);
        });
    });

    // Start button
    startBtn.addEventListener('click', () => {
        if (!startBtn.classList.contains('disabledq')) {
            alert('Тест розпочато! 🚀');
        }
    });
}

// Switch between student and teacher view
function switchView(view) {
    currentView = view;
    
    // Update toggle buttons
    toggleButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('activeq');
        } else {
            btn.classList.remove('activeq');
        }
    });

    // Show/hide appropriate panels
    if (view === 'student') {
        studentView.style.display = 'block';
        teacherView.style.display = 'none';
    } else {
        studentView.style.display = 'none';
        teacherView.style.display = 'block';
    }

    // Re-render students to show/hide remove buttons
    renderStudents();
}

// Render students list
function renderStudents() {
    participantsList.innerHTML = '';
    
    students.forEach((student, index) => {
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
            ${currentView === 'teacher' ? `
                <button class="remove-btnq" onclick="removeStudent(${student.id})">
                    <i class="bi bi-x-lg remove-iconq"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Remove student
function removeStudent(id) {
    const card = document.querySelector(`[data-student-id="${id}"]`);
    
    if (card) {
        // Add fade out animation
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px) scale(0.95)';
        
        setTimeout(() => {
            students = students.filter(s => s.id !== id);
            renderStudents();
            updateCounts();
            updateStartButton();
        }, 300);
    }
}

// Update counts
function updateCounts() {
    const connectedCount = students.filter(s => s.status === 'connected').length;
    const totalCount = students.length;
    
    connectedCountEl.textContent = connectedCount;
    totalCountEl.textContent = totalCount;
}

// Update start button state
function updateStartButton() {
    const connectedCount = students.filter(s => s.status === 'connected').length;
    
    if (connectedCount === 0) {
        startBtn.classList.add('disabledq');
        startBtn.disabled = true;
    } else {
        startBtn.classList.remove('disabledq');
        startBtn.disabled = false;
    }
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
            updateStartButton();
        }
    }, 1500);
}

// Make removeStudent available globally
window.removeStudent = removeStudent;
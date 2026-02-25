// Initial data
let students = [
	{
		id: 1,
		name: "Олена Коваленко",
		status: "connected",
		joinedAt: Date.now() - 8000,
	},
	{
		id: 2,
		name: "Дмитро Шевченко",
		status: "connected",
		joinedAt: Date.now() - 7000,
	},
	{
		id: 3,
		name: "Марія Петренко",
		status: "pending",
		joinedAt: Date.now() - 6000,
	},
	{
		id: 4,
		name: "Іван Бойко",
		status: "pending",
		joinedAt: Date.now() - 5000,
	},
	{
		id: 5,
		name: "Анна Сидоренко",
		status: "pending",
		joinedAt: Date.now() - 4000,
	},
	{
		id: 6,
		name: "Петро Ткаченко",
		status: "pending",
		joinedAt: Date.now() - 3000,
	},
	{
		id: 7,
		name: "Софія Іваненко",
		status: "pending",
		joinedAt: Date.now() - 2000,
	},
];

let currentView = "student";

// DOM Elements
const studentView = document.getElementById("studentView");
const teacherView = document.getElementById("teacherView");
const participantsList = document.getElementById("participantsList");
const connectedCountEl = document.getElementById("connectedCount");
const totalCountEl = document.getElementById("totalCount");
const startBtn = document.getElementById("startBtn");
const toggleButtons = document.querySelectorAll(".toggle-btnq");
const pendingSection = document.getElementById("pendingSection");
const pendingList = document.getElementById("pendingList");
const pendingBadge = document.getElementById("pendingBadge");
const waitingConnected = document.getElementById("waitingConnected");
const waitingPending = document.getElementById("waitingPending");

// Current user simulation (for demo purposes)
// In real app, this would come from authentication
let currentUserId = 3; // Simulating user Марія Петренко who is pending

// Initialize
document.addEventListener("DOMContentLoaded", () => {
	renderStudents();
	renderPendingStudents();
	updateCounts();
	updateStudentView();
	setupEventListeners();
	startConnectionSimulation();
});

// Event Listeners
function setupEventListeners() {
	// Toggle buttons
	toggleButtons.forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const view = e.target.getAttribute("data-view");
			switchView(view);
		});
	});

	// Start button
	startBtn.addEventListener("click", () => {
		if (!startBtn.classList.contains("disabledq")) {
			alert("Тест розпочато! 🚀");
		}
	});
}

// Switch between student and teacher view
function switchView(view) {
	currentView = view;

	// Update toggle buttons
	toggleButtons.forEach((btn) => {
		if (btn.getAttribute("data-view") === view) {
			btn.classList.add("activeq");
		} else {
			btn.classList.remove("activeq");
		}
	});

	// Show/hide appropriate panels
	if (view === "student") {
		studentView.style.display = "block";
		teacherView.style.display = "none";
		updateStudentView();
	} else {
		studentView.style.display = "none";
		teacherView.style.display = "block";
		updatePendingSection();
	}

	// Re-render students to show/hide remove buttons
	renderStudents();
}

// Update student view based on current user status
function updateStudentView() {
	const currentUser = students.find((s) => s.id === currentUserId);

	if (!currentUser) {
		// User was rejected or removed
		waitingConnected.style.display = "none";
		waitingPending.style.display = "none";
		return;
	}

	if (currentUser.status === "pending") {
		waitingConnected.style.display = "none";
		waitingPending.style.display = "flex";
	} else {
		waitingConnected.style.display = "flex";
		waitingPending.style.display = "none";
	}
}

// Update pending section visibility
function updatePendingSection() {
	const pendingStudents = students.filter((s) => s.status === "pending");
	if (pendingStudents.length > 0) {
		pendingSection.style.display = "block";
		pendingBadge.textContent = pendingStudents.length;
	} else {
		pendingSection.style.display = "none";
	}
}

// Render pending students (for teacher view)
function renderPendingStudents() {
	const pendingStudents = students.filter((s) => s.status === "pending");
	pendingList.innerHTML = "";

	pendingStudents.forEach((student) => {
		const item = createPendingItem(student);
		pendingList.appendChild(item);
	});

	updatePendingSection();
}

// Create pending student item
function createPendingItem(student) {
	const item = document.createElement("div");
	item.className = "pending-itemq";
	item.setAttribute("data-pending-id", student.id);

	const initials = student.name
		.split(" ")
		.map((n) => n[0])
		.join("");

	item.innerHTML = `
        <div class="pending-avatarq">
            <span class="pending-avatar-textq">${initials}</span>
        </div>
        <span class="pending-nameq">${student.name}</span>
        <div class="pending-actionsq">
            <button class="approve-btnq" onclick="approveStudent(${student.id})">
                <i class="bi bi-check-lg pending-action-iconq"></i>
                Прийняти
            </button>
            <button class="reject-btnq" onclick="rejectStudent(${student.id})">
                <i class="bi bi-x-lg pending-action-iconq"></i>
                Відхилити
            </button>
        </div>
    `;

	return item;
}

// Approve student
function approveStudent(id) {
	students = students.map((s) =>
		s.id === id ? { ...s, status: "connecting" } : s,
	);

	renderStudents();
	renderPendingStudents();
	updateCounts();
	updateStartButton();
	updateStudentView();

	// Simulate connection
	setTimeout(() => {
		students = students.map((s) =>
			s.id === id ? { ...s, status: "connected" } : s,
		);
		renderStudents();
		updateCounts();
		updateStartButton();
		updateStudentView();
	}, 1000);
}

// Reject student
function rejectStudent(id) {
	const item = document.querySelector(`[data-pending-id="${id}"]`);

	if (item) {
		item.style.opacity = "0";
		item.style.transform = "translateX(-20px) scale(0.95)";

		setTimeout(() => {
			students = students.filter((s) => s.id !== id);
			renderStudents();
			renderPendingStudents();
			updateCounts();
			updateStartButton();
			updateStudentView();
		}, 300);
	}
}

// Render students list
function renderStudents() {
	participantsList.innerHTML = "";

	// Only show connected and connecting students in the main list
	const visibleStudents = students.filter((s) => s.status !== "pending");

	visibleStudents.forEach((student, index) => {
		const card = createStudentCard(student, index);
		participantsList.appendChild(card);
	});
}

// Create student card element
function createStudentCard(student, index) {
	const card = document.createElement("div");
	card.className = "student-cardq";
	card.setAttribute("data-student-id", student.id);

	const initials = student.name
		.split(" ")
		.map((n) => n[0])
		.join("");
	const statusClass =
		student.status === "connected" ? "connectedq" : "connectingq";
	const statusText =
		student.status === "connected" ? "Підключено" : "Підключається";
	const statusTextClass =
		student.status === "connected" ? "connected-textq" : "connecting-textq";

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
            ${
				currentView === "teacher"
					? `
                <button class="remove-btnq" onclick="removeStudent(${student.id})">
                    <i class="bi bi-x-lg remove-iconq"></i>
                </button>
            `
					: ""
			}
        </div>
    `;

	return card;
}
function removeStudent(id) {
	const card = document.querySelector(`[data-student-id="${id}"]`);

	if (card) {
		card.style.opacity = "0";
		card.style.transform = "translateX(20px) scale(0.95)";

		setTimeout(() => {
			students = students.filter((s) => s.id !== id);
			renderStudents();
			updateCounts();
			updateStartButton();
			updateStudentView();
		}, 300);
	}
}
function updateCounts() {
	const connectedCount = students.filter(
		(s) => s.status === "connected",
	).length;
	const totalCount = students.filter((s) => s.status !== "pending").length;

	connectedCountEl.textContent = connectedCount;
	totalCountEl.textContent = totalCount;
}

// Update start button state
function updateStartButton() {
	const connectedCount = students.filter(
		(s) => s.status === "connected",
	).length;

	if (connectedCount === 0) {
		startBtn.classList.add("disabledq");
		startBtn.disabled = true;
	} else {
		startBtn.classList.remove("disabledq");
		startBtn.disabled = false;
	}
}

// Simulate connection status changes
function startConnectionSimulation() {
	setInterval(() => {
		let hasChanges = false;

		students = students.map((student) => {
			if (student.status === "connecting") {
				hasChanges = true;
				return { ...student, status: "connected" };
			}
			return student;
		});

		if (hasChanges) {
			renderStudents();
			updateCounts();
			updateStartButton();
			updateStudentView();
		}
	}, 1500);
}

// Make functions available globally
window.removeStudent = removeStudent;
window.approveStudent = approveStudent;
window.rejectStudent = rejectStudent;

let code = document.getElementById('hostcode').textContent
socket = io();
socket.emit("join", { code, as_host: true });

socket.on("room:state", (info) => {
	console.log(`room:state \n\n`, info);
	if (info.participants){
		info.participants.forEach(participant => {
			createStudentCard(participant)
		});
	}
});

// const studentView = document.getElementById("studentView");
// const teacherView = document.getElementById("teacherView");
// const participantsList = document.getElementById("participantsList");
// const connectedCountEl = document.getElementById("connectedCount");
// const totalCountEl = document.getElementById("totalCount");
// const startBtn = document.getElementById("startBtn");
// const toggleButtons = document.querySelectorAll(".toggle-btnq");
// const pendingSection = document.getElementById("pendingSection");
// const pendingList = document.getElementById("pendingList");
// const pendingBadge = document.getElementById("pendingBadge");
// const waitingConnected = document.getElementById("waitingConnected");
// const waitingPending = document.getElementById("waitingPending");


// // renderStudents();
// // renderPendingStudents();
// // updateCounts();
// setupEventListeners();


// function setupEventListeners() {
// 	startBtn.addEventListener("click", () => {
		
// 	});
// }

// // function renderStudents() {
// // 	participantsList.innerHTML = "";

// // 	const visibleStudents = students.filter((s) => s.status !== "pending");

// // 	visibleStudents.forEach((student, index) => {
// // 		const card = createStudentCard(student, index);
// // 		participantsList.appendChild(card);
// // 	});
// // }

function createStudentCard(student, index) {
	const card = document.createElement("div");
	card.className = "student-cardq";
	card.setAttribute("data-student-id", student.id);

	const initials = student.name
		.split(" ")
		.map((n) => n[0])
		.join("");

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
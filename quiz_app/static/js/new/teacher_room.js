let code = document.getElementById('hostcode').textContent
socket = io();
socket.emit("join", { code, as_host: true });

socket.on("room:state", (info) => {
    console.log(`room:state \n\n`, info);
    if (info.participants) {
        const participantsList = document.getElementById("participantsList");
        participantsList.innerHTML = "";
        info.participants.forEach(participant => {
            participantsList.appendChild(createStudentCard(participant));
        });
        updateCount();
    }
});

function updateCount() {
    const count = document.querySelectorAll('#participantsList .student-cardq').length;
    document.getElementById('connectedCount').textContent = count;
}

const statusClass = '3452'
const statusText = '012'
const statusTextClass = '4678'

function createStudentCard(student) {
    const card = document.createElement("div");
    card.className = "student-cardq";
    card.setAttribute("data-student-id", student.user_id);

    const words = student.nickname.split(" ");
    const initials = words.length > 1
        ? words.map((n) => n[0]).join("")
        : words[0];

    card.innerHTML = `
        <div class="student-contentq">
            <div class="student-infoq">
                <div class="avatarq">
                    <span class="avatar-textq">${initials}</span>
                </div>
                <div class="student-detailsq">
                    <p class="student-nameq">${student.nickname}</p>
                </div>
            </div>
            <button class="remove-btnq">
                <i class="bi bi-x-lg remove-iconq"></i>
            </button>
        </div>
    `;

    card.querySelector(".remove-btnq").addEventListener("click", () => {
        card.style.opacity = "0";
        card.style.transform = "translateX(20px) scale(0.95)";
        card.style.transition = "all 0.3s ease";

        socket.emit("rm_user_from_session", { code, user_id: student.user_id });

        setTimeout(() => {
            card.remove();
            updateCount();
        }, 300);
    });

    return card;
}

document.querySelector('#startBtn').addEventListener('click', () => {
    socket.emit('teacher:start', { code });
});
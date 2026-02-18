const isTeacher = document.querySelector('#is_teach').textContent

if (isTeacher === 'True') {
    document.body.className = 'teacher-view';
} else {
    document.body.className = 'student-view';
}

function showSection(sectionId) {
    showSectionById(sectionId);

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

function showSectionById(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
}

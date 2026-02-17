// Function to switch between student and teacher views
function switchRole(role) {
    if (role === 'teacher') {
        document.body.className = 'teacher-view';
    } else {
        document.body.className = 'student-view';
    }
    
    const buttons = document.querySelectorAll('.role-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show first visible section
    const firstVisibleTab = document.querySelector('.tab:not(.teacher-only)');
    if (firstVisibleTab) {
        // Reset all tabs
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        firstVisibleTab.classList.add('active');
        
        // Show corresponding section
        const sectionId = firstVisibleTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        showSectionById(sectionId);
    }
}

// Function to show specific section
function showSection(sectionId) {
    showSectionById(sectionId);
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Helper function to show section by ID
function showSectionById(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
}

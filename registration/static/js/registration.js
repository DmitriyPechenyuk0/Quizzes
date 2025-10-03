document.addEventListener('DOMContentLoaded', function() {
    const flashContainer = document.getElementById('flash-container');
    if (flashContainer && flashContainer.children.length > 0) {

        setTimeout(() => {
            flashContainer.classList.add('show');
        }, 100);


        setTimeout(() => {
            flashContainer.classList.remove('show');
        }, 5000);
    }
});
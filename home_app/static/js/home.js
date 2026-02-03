document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior: 'smooth'});
    });
});
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    nav.style.boxShadow = window.scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.5)' : 'none';
});
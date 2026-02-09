// document.addEventListener('DOMContentLoaded', function() {
//     const form = document.getElementById('registration-form');
//     const modal = document.getElementById('successModal');
    
//     function showFlash(message, type = 'error') {
//         const flashContainer = document.getElementById('flash-container');
//         const flashMessage = document.createElement('div');
//         flashMessage.className = `alert alert-${type}`;
//         flashMessage.textContent = message;
        
//         flashContainer.innerHTML = '';
//         flashContainer.appendChild(flashMessage);
//         flashContainer.classList.add('show');
        
//         setTimeout(() => {
//             flashContainer.classList.remove('show');
//             setTimeout(() => flashContainer.innerHTML = '', 300);
//         }, 5000);
//     }

//     function validateForm() {
//         const login = form.querySelector('input[name="login"]').value;
//         const email = form.querySelector('input[name="email"]').value;
//         const password = form.querySelector('input[name="password"]').value;
//         const confirm = form.querySelector('input[name="confirm"]').value;

//         if (!login || login.length < 3) {
//             showFlash('Логін повинен містити мінімум 3 символи');
//             return false;
//         }

//         if (login.length > 50) {
//             showFlash('Логін занадто довгий (максимум 50 символів)');
//             return false;
//         }

//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(email)) {
//             showFlash('Введіть коректну електронну пошту');
//             return false;
//         }

//         if (password.length < 6) {
//             showFlash('Пароль повинен містити мінімум 6 символів');
//             return false;
//         }

//         if (!/[A-Z]/.test(password)) {
//             showFlash('Пароль повинен містити хоча б одну велику літеру');
//             return false;
//         }

//         if (!/[0-9]/.test(password)) {
//             showFlash('Пароль повинен містити хоча б одну цифру');
//             return false;
//         }

//         if (password !== confirm) {
//             showFlash('Паролі не співпадають');
//             return false;
//         }

//         return true;
//     }
    
//     if (form && modal) {
//         const submitModalBtn = document.querySelector('.sub');
//         let selectedGroup = null;

//         form.addEventListener('submit', function(e) {
//             e.preventDefault();
            
//             if (!validateForm()) {
//                 return;
//             }
            
//             modal.style.display = 'flex';
//         });

//         document.querySelectorAll('.button-grid .btn').forEach(btn => {
//             btn.addEventListener('click', () => {
//                 document.querySelectorAll('.button-grid .btn').forEach(b => b.classList.remove('active'));
//                 btn.classList.add('active');
//                 selectedGroup = btn.getAttribute('data-id') || btn.innerText;
//             });
//         });

//         if(submitModalBtn) {
//             submitModalBtn.addEventListener('click', () => {
//                 if (!selectedGroup) {
//                     showFlash('Будь ласка, виберіть свій клас!');
//                     return;
//                 }
                
//                 const oldInput = form.querySelector('input[name="group"]');
//                 if (oldInput) oldInput.remove();

//                 const hiddenInput = document.createElement('input');
//                 hiddenInput.type = 'hidden';
//                 hiddenInput.name = 'group';
//                 hiddenInput.value = selectedGroup;
//                 form.appendChild(hiddenInput);
                
//                 form.submit();
//             });
//         }
//     }

//     const flashContainer = document.getElementById('flash-container');
//     if (flashContainer && flashContainer.children.length > 0) {
//         setTimeout(() => {
//             flashContainer.classList.add('show');
//         }, 100);

//         setTimeout(() => {
//             flashContainer.classList.remove('show');
//         }, 5000);
//     }
// });


const registrationForm = document.getElementById('registrationForm');
const googleAuthBtn = document.getElementById('googleAuthBtn');
const githubAuthBtn = document.getElementById('githubAuthBtn');
const errorMessage = document.getElementById('errorMessage');


googleAuthBtn.addEventListener('click', function() {
    window.location.href = '/auth/google';
});

githubAuthBtn.addEventListener('click', function() {
    window.location.href = '/auth/github';
});

registrationForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    hideError();
    

    const formData = new FormData(registrationForm);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
        showError('Паролі не збігаються!');
        return;
    }

    registrationForm.classList.add('loading');

    fetch('/register', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        registrationForm.classList.remove('loading');
        
        if (data.success) {
            window.location.href = data.redirect || '/login';
        } else {
            showError(data.message || 'Помилка реєстрації. Спробуйте ще раз.');
        }
    })
    .catch(error => {
        registrationForm.classList.remove('loading');
        console.error('Error:', error);
        showError('Помилка з\'єднання з сервером. Спробуйте пізніше.');
    });
})

document.getElementById('registration-form').addEventListener('submit', function(e){
  e.preventDefault();
  document.getElementById('successModal').style.display = 'flex';
});

// Закрытие модалки
document.getElementById('closeModal').addEventListener('click', function(){
  document.getElementById('successModal').style.display = 'none';
});

let selectedGroup = null;

// Событие для кнопок выбора группы
document.querySelectorAll('.button-grid .btn').forEach(btn => {
  btn.addEventListener('click', () => {
      // снимаем класс active со всех кнопок
      document.querySelectorAll('.button-grid .btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedGroup = btn.innerText;
  });
});

// Кнопка подтверждения выбора группы
document.querySelector('.sub').addEventListener('click', () => {
  if (!selectedGroup) {
      alert("Выберите группу!");
      return;
  }

  const form = document.getElementById('registration-form');

  // Удаляем старое скрытое поле, если есть
  const oldInput = form.querySelector('input[name="group"]');
  if (oldInput) oldInput.remove();

  // Создаём скрытое поле с выбранной группой
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = 'group';
  hiddenInput.value = selectedGroup;
  form.appendChild(hiddenInput);

  // Отправляем форму
  form.submit();
});

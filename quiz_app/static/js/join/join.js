/* ═══════════════════════════════════════════════
   QUIZZES — join.js
═══════════════════════════════════════════════ */

const input     = document.getElementById('codeInput');
const btn       = document.getElementById('joinBtn');
const hintWrap  = document.getElementById('formHint');
const hintText  = document.getElementById('hintText');
const hintIcon  = hintWrap.querySelector('.hint-icon');
const overlay   = document.getElementById('waitingOverlay');
const cancelBtn = document.getElementById('cancelBtn');

function setWaiting(state) {
  const next = (state === undefined)
  ? !overlay.classList.contains('active')
  : Boolean(state);
  
  overlay.classList.toggle('active', next);
  input.disabled = next;
  
  if (!next) {
    /* Повертаємо кнопку у правильний стан */
    btn.disabled = input.value.length !== 6;
  } else {
    btn.disabled = true;
  }
}

/* Expose globally so Flask templates / other scripts can call it */
window.setWaiting = setWaiting;

/* ─────────────────────────────────────────────
   INPUT HANDLING
───────────────────────────────────────────── */
input.addEventListener('input', () => {
  /* Strip non-digits, limit to 6 */
  const clean = input.value.replace(/\D/g, '').slice(0, 6);
  input.value = clean;

  input.classList.remove('is-error');
  input.classList.toggle('has-value', clean.length > 0);
  btn.disabled = clean.length !== 6;

  if (clean.length === 0) {
    setHint('Лише цифри, 6 символів', '', 'bi-info-circle');
  } else if (clean.length < 6) {
    setHint(`Введено ${clean.length} із 6`, 'progress', 'bi-pencil');
  } else {
    setHint('Готово — натисніть «Перейти до тесту»', 'ready', 'bi-check-circle');
  }
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btn.disabled) handleJoin();
});

btn.addEventListener('click', handleJoin);
cancelBtn.addEventListener('click', () => setWaiting(false));

function handleJoin() {
  if (btn.disabled) return;

  const code = input.value;
  setWaiting(true);

  fetch('/api/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
      } else {
        onError();
      }
    })
    .catch(() => {
      /* Якщо сервер недоступний */
      onError();
    });

  /* ── Видаліть цей блок коли підключите реальний API ── */
  // Симуляція для демо (прибрати у продакшн):
  // const VALID = new Set(['123456', '654321', '202525']);
  // setTimeout(() => {
  //   if (VALID.has(code)) { /* success */ }
  //   else { onError(); }
  // }, 2200);
}

/* ─────────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────────── */
function onError() {
  setWaiting(false);
  input.classList.add('is-error');
  setHint('Код не знайдено. Перевірте та спробуйте ще раз.', 'err', 'bi-exclamation-circle');
  input.value = '';
  input.classList.remove('has-value');
  btn.disabled = true;
  input.focus();
}

/* ─────────────────────────────────────────────
   HINT HELPER
───────────────────────────────────────────── */
function setHint(text, cls, icon) {
  hintText.textContent = text;
  hintIcon.className   = `bi ${icon} hint-icon`;
  hintWrap.className   = 'form-hint' + (cls ? ' ' + cls : '');
}
setWaiting(true)
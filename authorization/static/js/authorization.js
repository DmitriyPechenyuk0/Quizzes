document.addEventListener("DOMContentLoaded", function () {
	const form = document.getElementById("login-form");
	const flashContainer = document.getElementById("flash-container");

	function showFlash(message, type = "error") {
		const flashMessage = document.createElement("div");
		flashMessage.className = `alert alert-${type}`;
		flashMessage.textContent = message;

		flashContainer.innerHTML = "";
		flashContainer.appendChild(flashMessage);
		flashContainer.classList.add("show");

		setTimeout(() => {
			flashContainer.classList.remove("show");
			setTimeout(() => (flashContainer.innerHTML = ""), 300);
		}, 5000);
	}

	function validateForm() {
		const username = form.querySelector('input[name="name"]').value;
		const password = form.querySelector('input[name="password"]').value;

		if (!username) {
			showFlash("Будь ласка, введіть ім'я користувача");
			return false;
		}

		if (!password) {
			showFlash("Будь ласка, введіть пароль");
			return false;
		}

		return true;
	}

	if (form) {
		form.addEventListener("submit", function (e) {
			e.preventDefault();
			if (validateForm()) {
				this.submit();
			}
		});
	}

	if (flashContainer && flashContainer.children.length > 0) {
		setTimeout(() => {
			flashContainer.classList.add("show");
		}, 100);

		const hasWarning = Array.from(flashContainer.children).some((child) =>
			child.classList.contains("flash-warning"),
		);

		const hideDelay = hasWarning ? 10000 : 5000;

		setTimeout(() => {
			flashContainer.classList.remove("show");
		}, hideDelay);
	}

	if (flashContainer) {
		flashContainer.addEventListener("click", function () {
			this.classList.remove("show");
		});
	}

	const usernameField = document.querySelector('input[name="name"]');
	if (usernameField) {
		usernameField.focus();
	}
});

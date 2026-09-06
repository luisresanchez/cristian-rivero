/* ============================================================
   FORMS — contact form validation, toasts, media kit modal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Contact form ── */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      const nameInput  = form.querySelector('#f-name');
      const emailInput = form.querySelector('#f-email');
      const msgInput   = form.querySelector('#f-message');

      clearError(nameInput);
      clearError(emailInput);
      clearError(msgInput);

      if (!nameInput.value.trim()) {
        showError(nameInput, 'El nombre es obligatorio');
        valid = false;
      }

      if (!emailInput.value.trim()) {
        showError(emailInput, 'El email es obligatorio');
        valid = false;
      } else if (!isValidEmail(emailInput.value)) {
        showError(emailInput, 'Ingresa un email válido');
        valid = false;
      }

      if (!msgInput.value.trim()) {
        showError(msgInput, 'El mensaje no puede estar vacío');
        valid = false;
      }

      if (valid) {
        form.reset();
        if (typeof showToast === 'function') {
          showToast('¡Mensaje enviado! Te responderemos pronto.', 'success');
        }
      }
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(input, msg) {
    input.classList.add('error');
    const errEl = input.parentElement.querySelector('.form-error-msg');
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add('visible');
    }
  }

  function clearError(input) {
    input.classList.remove('error');
    const errEl = input.parentElement.querySelector('.form-error-msg');
    if (errEl) errEl.classList.remove('visible');
  }

  /* ── Live clear on input ── */
  document.querySelectorAll('#contact-form input, #contact-form textarea').forEach(el => {
    el.addEventListener('input', () => clearError(el));
  });

  /* ── Media kit download ── */
  document.querySelectorAll('[data-action="download-kit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href     = 'assets/mediakit.pdf';
      link.download = 'Cristian-Rivero-MediaKit.pdf';
      link.click();
    });
  });

});

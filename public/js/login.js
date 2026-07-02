/**
 * Login Handler — Handles authentication form submission for the Admin portal
 */

import { authLogin, authMe, showToast } from './api-service.js';

document.addEventListener('DOMContentLoaded', async () => {
  // If already authenticated, redirect immediately
  try {
    const result = await authMe();
    if (result.authenticated) {
      window.location.href = result.user.role === 'admin' ? '/admin.html' : '/';
      return;
    }
  } catch {
    // Not authenticated — show login form
  }

  initLoginForm();
  initPasswordToggle();
  initDarkMode();
});

/**
 * Handle login form submission
 */
function initLoginForm() {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const errorText = document.getElementById('login-error-text');
  const btn = document.getElementById('login-btn');
  const btnText = document.getElementById('login-btn-text');
  const spinner = document.getElementById('login-spinner');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Username dan password harus diisi.');
      return;
    }

    // Disable button and show spinner
    btn.disabled = true;
    btnText.textContent = 'Memproses...';
    spinner.classList.remove('hidden');
    errorBox.classList.add('hidden');

    try {
      const result = await authLogin(username, password);

      if (result.success) {
        showToast('Login berhasil! Mengalihkan...', 'success');
        // Redirect based on role
        setTimeout(() => {
          window.location.href = result.user.role === 'admin' ? '/admin.html' : '/';
        }, 600);
      }
    } catch (err) {
      showError(err.message || 'Username atau password salah.');
      btn.disabled = false;
      btnText.textContent = 'Masuk';
      spinner.classList.add('hidden');
    }
  });

  function showError(msg) {
    errorText.textContent = msg;
    errorBox.classList.remove('hidden');
    // Shake animation
    errorBox.style.animation = 'none';
    requestAnimationFrame(() => {
      errorBox.style.animation = 'shake 0.4s ease';
    });
  }
}

/**
 * Toggle password visibility
 */
function initPasswordToggle() {
  const toggleBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eye-icon');

  if (!toggleBtn || !passwordInput) return;

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeIcon.innerHTML = isPassword
      ? '<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />'
      : '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />';
  });
}

/**
 * Sync dark mode with user preference
 */
function initDarkMode() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
}

/* DuelZone — theme persistence via localStorage */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'dz-theme';

  function getTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function setTheme(theme) {
    var t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch (e) { /* private browsing */ }
    syncToggleIcons(t);
    return t;
  }

  function syncToggleIcons(theme) {
    var moon = document.getElementById('iconMoon');
    var sun = document.getElementById('iconSun');
    if (!moon || !sun) return;
    var isLight = theme === 'light';
    moon.style.display = isLight ? 'block' : 'none';
    sun.style.display = isLight ? 'none' : 'block';
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    return setTheme(current === 'light' ? 'dark' : 'light');
  }

  function bindThemeToggle(btnId) {
    var btn = document.getElementById(btnId || 'themeToggle');
    if (!btn || btn._dzThemeWired) return;
    btn._dzThemeWired = true;
    btn.addEventListener('click', toggleTheme);
  }

  setTheme(getTheme());

  global.dzGetTheme = getTheme;
  global.dzSetTheme = setTheme;
  global.dzToggleTheme = toggleTheme;
  global.dzBindThemeToggle = bindThemeToggle;
  global.dzSyncThemeIcons = function () { syncToggleIcons(getTheme()); };

  document.addEventListener('DOMContentLoaded', function () {
    syncToggleIcons(getTheme());
    bindThemeToggle('themeToggle');
  });
})(typeof window !== 'undefined' ? window : this);

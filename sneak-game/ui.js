// This file manages the user interface elements, such as menus, buttons, and HUD (heads-up display).

class UI {
    constructor() {
        this.menuElement = document.getElementById('menu');
        this.hudElement = document.getElementById('hud');
        this.gameOverElement = document.getElementById('game-over');
    }

    showMenu() {
        this.menuElement.style.display = 'block';
        this.hudElement.style.display = 'none';
        this.gameOverElement.style.display = 'none';
    }

    hideMenu() {
        this.menuElement.style.display = 'none';
    }

    showHUD() {
        this.hudElement.style.display = 'block';
    }

    updateHUD(score, health) {
        this.hudElement.querySelector('.score').innerText = `Score: ${score}`;
        this.hudElement.querySelector('.health').innerText = `Health: ${health}`;
    }

    showGameOver(score) {
        this.gameOverElement.querySelector('.final-score').innerText = `Final Score: ${score}`;
        this.gameOverElement.style.display = 'block';
        this.hudElement.style.display = 'none';
    }
}

// UI layer: attract mode, menu navigation, button wiring
document.addEventListener('DOMContentLoaded', () => {

  // query elements after DOM is ready
  const arcadeScreen = document.getElementById('arcade-screen');
  const attractOverlay = document.getElementById('attract-overlay');
  const attractMenu = document.getElementById('attract-menu');
  const tapOverlay = document.getElementById('tap-overlay');
  const resetBtn = document.getElementById('reset-button');
  const goRetry = document.getElementById('go-retry');
  const gameoverScreen = document.getElementById('gameover-screen');
  const goScore = document.getElementById('go-score');
  const hiScoreEl = document.getElementById('hi-score');

  // main menu elements
  const mainMenu = document.getElementById('main-menu');
  const menuStartBtn = document.getElementById('menu-start');
  const menuHighBtn = document.getElementById('menu-highscores');
  const menuCreditsBtn = document.getElementById('menu-credits');

  // Ensure interactive layers accept clicks (some CSS used pointer-events:none)
  if (attractOverlay) attractOverlay.style.pointerEvents = 'none';
  if (attractMenu) attractMenu.style.pointerEvents = 'auto';
  if (mainMenu) mainMenu.style.pointerEvents = 'auto';
  // ensure buttons can receive pointer events
  document.querySelectorAll('.mm-btn, .btn-arcade, .menu-item, #go-retry').forEach(el => el.style.pointerEvents = 'auto');

  // hide old "INSERT COIN" title and ensure attract overlay menu is hidden initially
  if (attractOverlay) {
    attractOverlay.classList.add('hidden');
    const atTitle = attractOverlay.querySelector('.attract-title');
    if (atTitle) atTitle.style.display = 'none';
  }

  // show main menu on load (if present)
  if (mainMenu) {
    mainMenu.classList.remove('hidden');
    if (tapOverlay) tapOverlay.style.display = 'none';
  }

  // safe helper to attach event only when element exists
  const safeOn = (el, ev, fn) => { if (!el) return; el.addEventListener(ev, fn); };

  // Start from main menu -> show internal CRT menu (or start game)
  safeOn(menuStartBtn, 'click', () => {
    mainMenu && mainMenu.classList.add('hidden');
    if (attractMenu) { attractMenu.classList.remove('hidden'); window.addEventListener('keydown', onKeyNav); }
    const canvas = document.getElementById('game-canvas'); if (canvas) canvas.focus();
    attemptStartGame();
  });

  // Try to call the real game start functions; poll a few times and emit a requestStart event as fallback
  function attemptStartGame(attempt = 0) {
   const maxAttempts = 20;
   // prefer explicit exported startGame
   if (typeof window.startGame === 'function') {
     try { window.startGame(); console.info('UI: window.startGame() called'); } catch (e) { console.warn('UI: startGame threw', e); }
     return;
   }
   // try reset+start if available
   if (typeof window.resetGame === 'function' && typeof window.startGame === 'function') {
     try { window.resetGame(); window.startGame(); console.info('UI: resetGame() + startGame() called'); } catch (e) { console.warn('UI: reset/resetGame threw', e); }
     return;
   }
   // dispatch requestStart so main.js can listen if desired
   document.dispatchEvent(new CustomEvent('requestStart'));
   if (attempt < maxAttempts) {
     setTimeout(() => attemptStartGame(attempt + 1), 250);
     if (attempt === 0) console.info('UI: waiting for startGame to become available...');
   } else {
     console.warn('UI: startGame not available after polling; check main.js export order.');
   }
 }

  safeOn(menuHighBtn, 'click', () => alert('High scores — placeholder'));
  safeOn(menuCreditsBtn, 'click', () => alert('Credits — built with Canvas + JS'));

  // menu navigation
  let menuVisible = false;
  let menuIndex = 0;
  const menuItems = attractMenu ? Array.from(attractMenu.querySelectorAll('.menu-item')) : [];

  function showMenu() {
    if (!attractMenu) return;
    attractMenu.classList.remove('hidden');
    menuVisible = true;
    menuIndex = 0;
    updateMenuSelection();
    tapOverlay && (tapOverlay.style.display = 'none');
    window.addEventListener('keydown', onKeyNav);
  }

  function hideMenu() {
    if (!attractMenu) return;
    attractMenu.classList.add('hidden');
    menuVisible = false;
    window.removeEventListener('keydown', onKeyNav);
  }

  function updateMenuSelection() {
    menuItems.forEach((el, i) => el.classList.toggle('selected', i === menuIndex));
  }

  function onKeyNav(e) {
    if (!menuVisible && !attractMenu.classList.contains('hidden')) menuVisible = true;
    if (!menuVisible) return;
    if (e.key === 'ArrowDown') { menuIndex = Math.min(menuItems.length - 1, menuIndex + 1); updateMenuSelection(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { menuIndex = Math.max(0, menuIndex - 1); updateMenuSelection(); e.preventDefault(); }
    if (e.key === 'Enter') { activateMenu(menuIndex); e.preventDefault(); }
  }

  function activateMenu(i) {
    const sel = menuItems[i];
    if (!sel) return;
    const txt = sel.textContent.trim();
    if (txt === 'START GAME') {
      hideMenu();
      attemptStartGame();
    } else if (txt === 'HIGH SCORES') {
      alert('High scores — placeholder');
    } else if (txt === 'CREDITS') {
      alert('Credits — built with Canvas + JS');
    }
  }

  // Click behavior for arcade screen (skip main menu handling when main menu visible)
  if (arcadeScreen) {
    arcadeScreen.addEventListener('click', () => {
      if (mainMenu && !mainMenu.classList.contains('hidden')) return;
      if (!menuVisible) showMenu();
      else activateMenu(menuIndex);
    });
  }

  // keyboard: Enter opens menu/start
  window.addEventListener('keydown', (e) => {
    if (mainMenu && !mainMenu.classList.contains('hidden') && (e.key === 'Enter' || e.key === ' ')) {
      menuStartBtn && menuStartBtn.click();
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (!menuVisible) showMenu();
      else activateMenu(menuIndex);
    }
  });

  // wire Reset and Retry to game functions (safe)
  safeOn(resetBtn, 'click', () => {
    if (typeof window.resetGame === 'function') window.resetGame();
    if (typeof window.startGame === 'function') window.startGame();
    if (gameoverScreen) gameoverScreen.classList.add('hidden');
    if (tapOverlay) tapOverlay.style.display = 'none';
  });

  safeOn(goRetry, 'click', () => {
    if (typeof window.resetGame === 'function') window.resetGame();
    if (typeof window.startGame === 'function') window.startGame();
    if (gameoverScreen) gameoverScreen.classList.add('hidden');
    if (tapOverlay) tapOverlay.style.display = 'none';
  });

  // expose update helper
  function updateGameOverUI(score, hi) {
    goScore && (goScore.textContent = String(score));
    hiScoreEl && (hiScoreEl.textContent = String(hi || score));
    if (gameoverScreen) gameoverScreen.classList.remove('hidden');
  }
  window.__arcadeUI = { updateGameOverUI };

  // debug: if buttons still not found, log missing ids
  const expected = ['menu-start','menu-highscores','menu-credits','reset-button','go-retry'];
  const missing = expected.filter(id => !document.getElementById(id));
  if (missing.length) console.warn('UI: missing elements (check index.html):', missing);
});
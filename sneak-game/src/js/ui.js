// UI layer (robust): safeOn helper, DOMContentLoaded init, start fallback via requestStart
(function () {
  // helper safe attach
  function safeOn(el, ev, fn) { if (!el) return; el.addEventListener(ev, fn); }

  document.addEventListener('DOMContentLoaded', () => {
    // query elements
    const arcadeScreen = document.getElementById('arcade-screen');
    const attractOverlay = document.getElementById('attract-overlay');
    const attractMenu = document.getElementById('attract-menu');
    const tapOverlay = document.getElementById('tap-overlay');
    const resetBtn = document.getElementById('reset-button');
    const goRetry = document.getElementById('go-retry');
    const gameoverScreen = document.getElementById('gameover-screen');
    const goScore = document.getElementById('go-score');
    const hiScoreEl = document.getElementById('hi-score');

    const mainMenu = document.getElementById('main-menu');
    const menuStartBtn = document.getElementById('menu-start');
    const menuHighBtn = document.getElementById('menu-highscores');
    const menuCreditsBtn = document.getElementById('menu-credits');

    // make interactive elements pointer-active (in case CSS set pointer-events:none)
    [attractMenu, mainMenu].forEach(el => { if (el) el.style.pointerEvents = 'auto'; });
    document.querySelectorAll('.mm-btn, .btn-arcade, .menu-item, #go-retry').forEach(el => { el.style.pointerEvents = 'auto'; });

    // menu navigation state
    let menuVisible = false;
    let menuIndex = 0;
    const menuItems = attractMenu ? Array.from(attractMenu.querySelectorAll('.menu-item')) : [];

    function updateMenuSelection() { menuItems.forEach((el,i)=> el.classList.toggle('selected', i===menuIndex)); }
    function showMenu() { if (!attractMenu) return; attractMenu.classList.remove('hidden'); menuVisible=true; menuIndex=0; updateMenuSelection(); if (tapOverlay) tapOverlay.style.display='none'; window.addEventListener('keydown', onKeyNav); }
    function hideMenu() { if (!attractMenu) return; attractMenu.classList.add('hidden'); menuVisible=false; window.removeEventListener('keydown', onKeyNav); }

    function onKeyNav(e){
      if (!menuVisible && attractMenu && !attractMenu.classList.contains('hidden')) menuVisible = true;
      if (!menuVisible) return;
      if (e.key === 'ArrowDown'){ menuIndex = Math.min(menuItems.length-1, menuIndex+1); updateMenuSelection(); e.preventDefault(); }
      if (e.key === 'ArrowUp'){ menuIndex = Math.max(0, menuIndex-1); updateMenuSelection(); e.preventDefault(); }
      if (e.key === 'Enter'){ activateMenu(menuIndex); e.preventDefault(); }
    }

    function activateMenu(i){
      const sel = menuItems[i]; if (!sel) return;
      const txt = sel.textContent.trim();
      if (txt === 'START GAME'){ hideMenu(); attemptStartGame(); }
      else if (txt === 'HIGH SCORES') alert('High scores — placeholder');
      else if (txt === 'CREDITS') alert('Credits — built with Canvas + JS');
    }

    // attempt to call startGame; poll + dispatch requestStart fallback
    function attemptStartGame(attempt = 0){
      const maxAttempts = 20;
      if (typeof window.startGame === 'function') {
        try { window.startGame(); console.info('UI: window.startGame() called'); } catch(e){ console.warn('UI: startGame threw', e); }
        hideAllOverlays();
        return;
      }
      // if resetGame present try that once
      if (typeof window.resetGame === 'function' && typeof window.startGame === 'function') {
        try { window.resetGame(); window.startGame(); console.info('UI: resetGame()+startGame() called'); hideAllOverlays(); } catch(e){ console.warn('UI: reset/start threw', e); }
        return;
      }
      // notify main.js to start if it listens
      document.dispatchEvent(new CustomEvent('requestStart'));
      if (attempt < maxAttempts) {
        setTimeout(()=>attemptStartGame(attempt+1), 250);
        if (attempt === 0) console.info('UI: waiting for startGame to become available...');
      } else {
        console.warn('UI: startGame not available after polling; check main.js script load/export');
      }
    }

    function hideAllOverlays(){
      if (mainMenu){ mainMenu.classList.add('hidden'); mainMenu.style.display='none'; }
      if (attractMenu){ attractMenu.classList.add('hidden'); attractMenu.style.display='none'; }
      if (tapOverlay){ tapOverlay.style.display='none'; }
      const legacyMenu = document.getElementById('menu-overlay'); if (legacyMenu){ legacyMenu.classList.add('hidden'); legacyMenu.style.display='none'; }
      window.removeEventListener('keydown', onKeyNav);
    }

    // UI wiring
    safeOn(menuStartBtn, 'click', () => {
      // hide main menu immediately
      if (mainMenu){ mainMenu.classList.add('hidden'); mainMenu.style.display='none'; }
      const legacyMenu = document.getElementById('menu-overlay'); if (legacyMenu){ legacyMenu.classList.add('hidden'); legacyMenu.style.display='none'; }

      // do NOT request fullscreen — instead fill browser viewport via responsive canvas
      const canvas = document.getElementById('game-canvas');
      if (canvas) try { canvas.focus(); } catch(e){}

      if (attractMenu) { attractMenu.classList.remove('hidden'); window.addEventListener('keydown', onKeyNav); }

      // start game (will resize canvas to fit container)
      attemptStartGame();
    });

    safeOn(menuHighBtn, 'click', ()=> alert('High scores — placeholder'));
    safeOn(menuCreditsBtn, 'click', ()=> alert('Credits — built with Canvas + JS'));

    safeOn(arcadeScreen, 'click', () => {
      if (mainMenu && !mainMenu.classList.contains('hidden')) return;
      if (!menuVisible) showMenu(); else activateMenu(menuIndex);
    });

    window.addEventListener('keydown', (e) => {
      if (mainMenu && !mainMenu.classList.contains('hidden') && (e.key==='Enter' || e.key===' ')) { menuStartBtn && menuStartBtn.click(); e.preventDefault(); return; }
      if (e.key === 'Enter' || e.key === ' ') { if (!menuVisible) showMenu(); else activateMenu(menuIndex); }
    });

    safeOn(resetBtn, 'click', ()=> { if (typeof window.resetGame === 'function') window.resetGame(); if (typeof window.startGame === 'function') window.startGame(); hideAllOverlays(); });
    safeOn(goRetry, 'click', ()=> { if (typeof window.resetGame === 'function') window.resetGame(); if (typeof window.startGame === 'function') window.startGame(); hideAllOverlays(); });

    // expose update helper
    function updateGameOverUI(score, hi){ if (goScore) goScore.textContent = String(score); if (hiScoreEl) hiScoreEl.textContent = String(hi || score); if (gameoverScreen) gameoverScreen.classList.remove('hidden'); }
    window.__arcadeUI = { updateGameOverUI };

    // debug: missing elements
    const expected = ['menu-start','menu-highscores','menu-credits','reset-button','go-retry'];
    const missing = expected.filter(id => !document.getElementById(id));
    if (missing.length) console.warn('UI: missing elements (check index.html):', missing);
  });
})();
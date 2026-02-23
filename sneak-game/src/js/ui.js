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

    // remove any old gameover overlay element that may exist
    (function cleanupOldGameover(){
      const old = document.getElementById('gameover-screen');
      if (old) old.parentElement && old.parentElement.removeChild(old);
    })();

    // create a simple custom game-over overlay (hidden until shown)
    function createGameOverOverlay(){
      if (document.getElementById('custom-gameover')) return;
      const ov = document.createElement('div');
      ov.id = 'custom-gameover';
      ov.style.position = 'fixed';
      ov.style.left = '0';
      ov.style.top = '0';
      ov.style.width = '100%';
      ov.style.height = '100%';
      ov.style.display = 'flex';
      ov.style.alignItems = 'center';
      ov.style.justifyContent = 'center';
      ov.style.pointerEvents = 'none';
      ov.style.zIndex = '9999';

      const card = document.createElement('div');
      card.style.pointerEvents = 'auto';
      card.style.minWidth = '220px';
      card.style.background = 'rgba(10,14,16,0.95)';
      card.style.border = '2px solid rgba(255,255,255,0.08)';
      card.style.padding = '18px';
      card.style.borderRadius = '8px';
      card.style.textAlign = 'center';
      card.style.color = '#00d1ff';
      card.style.fontFamily = '"Press Start 2P", monospace';

      const ico = document.createElement('div');
      ico.textContent = '0';
      ico.style.fontSize = '34px';
      ico.style.marginBottom = '8px';
      ico.style.color = '#ffffff';
      card.appendChild(ico);

      const hi = document.createElement('div');
      hi.textContent = 'HI-SCORE: 0';
      hi.style.marginBottom = '12px';
      hi.style.fontSize = '12px';
      card.appendChild(hi);

      const retry = document.createElement('button');
      retry.textContent = 'RETRY';
      retry.style.margin = '6px';
      retry.style.padding = '8px 14px';
      retry.style.border = 'none';
      retry.style.background = '#222';
      retry.style.color = '#fff';
      retry.style.borderRadius = '6px';
      retry.style.cursor = 'pointer';
      retry.addEventListener('click', () => {
        hideOverlay();
        if (typeof window.resetGame === 'function') window.resetGame();
        if (typeof window.startGame === 'function') window.startGame();
      });
      card.appendChild(retry);

      const close = document.createElement('button');
      close.textContent = 'CLOSE';
      close.style.margin = '6px';
      close.style.padding = '8px 10px';
      close.style.border = 'none';
      close.style.background = '#444';
      close.style.color = '#fff';
      close.style.borderRadius = '6px';
      close.style.cursor = 'pointer';
      close.addEventListener('click', () => { hideOverlay(); });
      card.appendChild(close);

      ov.appendChild(card);
      document.body.appendChild(ov);

      // helper to set values
      ov.__set = (score, hi) => {
        ico.textContent = String(score || 0);
        hi.textContent = 'HI-SCORE: ' + String(hi || score || 0);
      };

      // show / hide
      ov.__show = () => { ov.style.pointerEvents = 'auto'; ov.style.visibility = 'visible'; ov.style.opacity = '1'; };
      ov.__hide = () => { ov.style.pointerEvents = 'none'; ov.style.visibility = 'hidden'; ov.style.opacity = '0'; };

      // start hidden
      ov.__hide();
    }

    function showOverlay(score, hi){
      createGameOverOverlay();
      const ov = document.getElementById('custom-gameover');
      if (!ov) return;
      ov.__set(score, hi);
      ov.__show();
    }

    function hideOverlay(){
      const ov = document.getElementById('custom-gameover');
      if (!ov) return;
      ov.__hide();
    }

    // expose API for main.js to call when the player truly loses
    window.__arcadeUI = window.__arcadeUI || {};
    // ensure we do not overwrite other helpers
    window.__arcadeUI.updateGameOverUI = function(score, hi){
      // only show overlay when explicitly invoked
      try { showOverlay(score, hi); } catch(e){ console.warn('UI: showOverlay failed', e); }
    };

    // also hide overlay when menu start/reset is clicked
    safeOn(menuStartBtn, 'click', () => {
      // hide any overlays/menus first
      hideOverlay();
      if (mainMenu){ mainMenu.classList.add('hidden'); mainMenu.style.display='none'; }
      if (attractMenu){ attractMenu.classList.add('hidden'); attractMenu.style.display='none'; }
      const legacyMenu = document.getElementById('menu-overlay'); if (legacyMenu){ legacyMenu.classList.add('hidden'); legacyMenu.style.display='none'; }
      // attempt to start the game (will call window.startGame or dispatch requestStart)
      attemptStartGame();
    });

    safeOn(resetBtn, 'click', () => {
      hideOverlay();
      if (typeof window.resetGame === 'function') {
        try { window.resetGame(); console.info('UI: window.resetGame() called'); } catch(e){ console.warn('UI: resetGame threw', e); }
      }
    });

    // debug: missing elements
    const expected = ['menu-start','menu-highscores','menu-credits','reset-button','go-retry'];
    const missing = expected.filter(id => !document.getElementById(id));
    if (missing.length) console.warn('UI: missing elements (check index.html):', missing);
  });
})();
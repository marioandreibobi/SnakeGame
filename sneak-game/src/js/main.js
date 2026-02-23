document.addEventListener('DOMContentLoaded', () => {
  // elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const startBtn = document.getElementById('start-button');
  const pauseBtn = document.getElementById('pause-button');
  const resetBtn = document.getElementById('reset-button');
  const scoreEl = document.getElementById('score');
  const lengthEl = document.getElementById('length');

  const menuOverlay = document.getElementById('menu-overlay');
  const menuPlayBig = document.getElementById('menu-play-big');
  const menuSettings = document.getElementById('menu-settings');
  const menuCredits = document.getElementById('menu-credits');
  const settingsOverlay = document.getElementById('settings-overlay');
  const creditsOverlay = document.getElementById('credits-overlay');
  const settingsSave = document.getElementById('settings-save');
  const settingsCancel = document.getElementById('settings-cancel');
  const creditsClose = document.getElementById('credits-close');
  const speedRange = document.getElementById('speed-range');
  const gridRange = document.getElementById('grid-range');
  const speedValue = document.getElementById('speed-value');
  const gridValue = document.getElementById('grid-value');

  const gameoverOverlay = document.getElementById('gameover-overlay');
  const goTitle = document.getElementById('go-title');
  const goMsg = document.getElementById('go-msg');
  const goRestart = document.getElementById('go-restart');
  const goMenu = document.getElementById('go-menu');

  // defaults & state
  let gridSize = parseInt(gridRange?.value || 16, 10);
  let speed = parseInt(speedRange?.value || 120, 10);
  let cols = Math.floor(canvas.width / gridSize);
  let rows = Math.floor(canvas.height / gridSize);

  let snake = [];
  let dir = {x:1,y:0};
  let nextDir = {x:1,y:0};
  let food = {x:0,y:0};
  let running = false;
  let lastTime = 0;
  let accumulator = 0;
  let prevSnake = null;
  const particles = [];

  // helpers
  function safe(el) { return el instanceof Element ? el : null; }
  function showOverlay(el) { if (!el) return; el.classList.remove('hidden'); el.classList.add('visible'); el.style.display = 'flex'; el.style.pointerEvents = 'auto'; }
  function hideOverlay(el) { if (!el) return; el.classList.add('hidden'); el.classList.remove('visible'); el.style.pointerEvents = 'none'; setTimeout(()=>{ if (el.classList.contains('hidden')) el.style.display='none'; }, 280); }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  // UI live values
  speedRange?.addEventListener('input', ()=> speedValue && (speedValue.textContent = speedRange.value));
  gridRange?.addEventListener('input', ()=> gridValue && (gridValue.textContent = gridRange.value));

  function applySettings() {
    gridSize = parseInt(gridRange?.value || gridSize, 10);
    speed = parseInt(speedRange?.value || speed, 10);
    cols = Math.floor(canvas.width / gridSize);
    rows = Math.floor(canvas.height / gridSize);
    speedValue && (speedValue.textContent = speed);
    gridValue && (gridValue.textContent = gridSize);
  }

  function resetGame() {
    cols = Math.floor(canvas.width / gridSize);
    rows = Math.floor(canvas.height / gridSize);
    snake = [{x: Math.floor(cols/2), y: Math.floor(rows/2)}];
    dir = {x:1,y:0};
    nextDir = {x:1,y:0};
    placeFood();
    updateScore();
    running = false;
    prevSnake = snake.map(s=>({x:s.x,y:s.y}));
    lastTime = 0;
    accumulator = 0;
  }

  function placeFood() {
    do {
      food = {x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows)};
    } while (snake.some(s => s.x===food.x && s.y===food.y));
  }

  function updateScore() {
    scoreEl && (scoreEl.textContent = `Score: ${snake.length - 1}`);
    lengthEl && (lengthEl.textContent = `${snake.length}`);
  }

  function insideGrid(p){ return p.x>=0 && p.x<cols && p.y>=0 && p.y<rows; }

  // particles
  function spawnParticles(px,py){
    const count = 18 + Math.floor(Math.random()*6);
    for(let i=0;i<count;i++){
      particles.push({
        x:px, y:py,
        vx:(Math.random()-0.5)*2.4,
        vy:(Math.random()-1.4)*-2.2,
        life:400+Math.random()*400, age:0,
        size:2+Math.random()*3,
        color:`hsl(${140 + Math.random()*80},80%,${45 + Math.random()*8}%)`
      });
    }
  }
  function updateParticles(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.age+=dt;
      p.x += p.vx*(dt/16);
      p.y += p.vy*(dt/16);
      p.vy += 0.03*(dt/16);
      p.vx *= 0.996;
      if(p.age>=p.life) particles.splice(i,1);
    }
  }

  // game logic tick
  function tickLogic(){
    prevSnake = snake.map(s=>({x:s.x,y:s.y}));
    dir = nextDir;
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    if(!insideGrid(head) || snake.some((s,i)=>i>0 && s.x===head.x && s.y===head.y)){
      gameOver(); return;
    }
    snake.unshift(head);
    if(head.x===food.x && head.y===food.y){
      // spawn at pixel center
      spawnParticles((food.x+0.5)*gridSize, (food.y+0.5)*gridSize);
      placeFood();
      updateScore();
    } else {
      snake.pop();
    }
  }

  function gameOver(){
    running=false;
    goTitle && (goTitle.textContent = 'Game Over');
    goMsg && (goMsg.textContent = 'Score: ' + (snake.length-1));
    showOverlay(gameoverOverlay);
  }

  // rendering with interpolation
  function renderInterpolated(t){
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    // background
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#001217'); bg.addColorStop(1,'#021218');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
    for(let gx=0; gx<cols; gx+=2){
      const x = gx*gridSize + 0.5;
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }

    // food glow
    const fx = (food.x+0.5)*gridSize, fy = (food.y+0.5)*gridSize;
    ctx.save();
    ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(255,90,90,0.28)';
    ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(fx,fy,gridSize*0.42,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // build interpolated positions
    if(!prevSnake) prevSnake = snake.map(s=>({x:s.x,y:s.y}));
    const interpPos = [];
    for(let i=0;i<snake.length;i++){
      const a = prevSnake[i] || snake[i];
      const b = snake[i];
      const ix = (a.x + (b.x-a.x)*t)*gridSize;
      const iy = (a.y + (b.y-a.y)*t)*gridSize;
      interpPos.push({x: ix + gridSize*0.5, y: iy + gridSize*0.5});
    }

    // draw from tail to head
    for(let i=interpPos.length-1;i>=0;i--){
      const p = interpPos[i];
      const isHead = i===0;
      const next = interpPos[i-1] || p;
      const dx = next.x - p.x, dy = next.y - p.y;
      const angle = Math.atan2(dy,dx);
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(angle);
      const w = gridSize * (isHead?1.05:0.95);
      const h = gridSize * 0.9;
      // gradient
      const grad = ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);
      if(isHead){
        grad.addColorStop(0,'#eafff5'); grad.addColorStop(1,'#00e5c0');
      } else {
        grad.addColorStop(0, `hsl(${100 + (i*6)%140},70%,${35 + (i%4)}%)`);
        grad.addColorStop(1, `hsl(${70 + (i*4)%160},62%,${28 + (i%6)}%)`);
      }
      ctx.fillStyle = grad;
      roundRect(ctx, -w/2, -h/2, w, h, Math.min(12, w*0.2));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.stroke();
      // eyes
      if(isHead){
        const ex = w*0.18, ey = -h*0.12, er = Math.max(2, gridSize*0.08);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-ex,ey,er,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex,ey,er,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#002b25'; ctx.beginPath(); ctx.arc(-ex+0.4,ey+0.6,er*0.45,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex-0.4,ey+0.6,er*0.45,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }

    // particles
    for(const p of particles){
      const a = clamp(1 - (p.age / p.life), 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  // main loop (fixed-step logic + interpolation)
  function gameLoop(ts){
    if(!lastTime) lastTime = ts;
    const dt = Math.min(ts - lastTime, 100);
    lastTime = ts;
    if(running){
      accumulator += dt;
      while(accumulator >= speed){
        tickLogic();
        accumulator -= speed;
      }
    }
    updateParticles(dt);
    const interp = Math.max(0, Math.min(1, accumulator / Math.max(1, speed)));
    renderInterpolated(interp);
    requestAnimationFrame(gameLoop);
  }

  // input
  window.addEventListener('keydown', (e)=>{
    const map = {
      ArrowUp:{x:0,y:-1}, w:{x:0,y:-1}, W:{x:0,y:-1},
      ArrowDown:{x:0,y:1}, s:{x:0,y:1}, S:{x:0,y:1},
      ArrowLeft:{x:-1,y:0}, a:{x:-1,y:0}, A:{x:-1,y:0},
      ArrowRight:{x:1,y:0}, d:{x:1,y:0}, D:{x:1,y:0},
    };
    const nd = map[e.key];
    if(nd){
      if(dir && nd.x === -dir.x && nd.y === -dir.y) return;
      nextDir = nd; e.preventDefault();
    }
    if(e.key === ' ' && !running){ hideOverlay(menuOverlay); startGame(); }
  });

  // control functions
  function startGame(){
    if(running) return;
    hideOverlay(menuOverlay);
    hideOverlay(gameoverOverlay);
    running = true;
    lastTime = 0; accumulator = 0;
    prevSnake = snake.map(s=>({x:s.x,y:s.y}));
    requestAnimationFrame(gameLoop);
    pauseBtn && (pauseBtn.textContent = 'Pause');
  }

  function togglePause(){
    if(!running){
      // resume
      running = true; lastTime = 0; requestAnimationFrame(gameLoop); hideOverlay(gameoverOverlay);
      pauseBtn && (pauseBtn.textContent = 'Pause');
      return;
    }
    // pause
    running = false;
    showOverlay(gameoverOverlay);
    goTitle && (goTitle.textContent = 'Paused');
    goMsg && (goMsg.textContent = 'Game paused');
    goRestart && (goRestart.textContent = 'Resume');
    pauseBtn && (pauseBtn.textContent = 'Resume');
  }

  // attach listeners AFTER definitions to be safe
  function attachListeners(){
    // main UI
    startBtn && startBtn.addEventListener('click', ()=> startGame());
    pauseBtn && pauseBtn.addEventListener('click', ()=> togglePause());
    resetBtn && resetBtn.addEventListener('click', ()=> { resetGame(); particles.length=0; renderInterpolated(1); showOverlay(menuOverlay); });

    // menu
    menuPlayBig && menuPlayBig.addEventListener('click', ()=> startGame());
    menuSettings && menuSettings.addEventListener('click', ()=> showOverlay(settingsOverlay));
    menuCredits && menuCredits.addEventListener('click', ()=> showOverlay(creditsOverlay));
    settingsCancel && settingsCancel.addEventListener('click', ()=> hideOverlay(settingsOverlay));
    creditsClose && creditsClose.addEventListener('click', ()=> hideOverlay(creditsOverlay));
    settingsSave && settingsSave.addEventListener('click', ()=> { applySettings(); resetGame(); hideOverlay(settingsOverlay); });

    // gameover
    goRestart && goRestart.addEventListener('click', ()=>{
      hideOverlay(gameoverOverlay);
      if(goRestart.textContent === 'Resume'){ startGame(); }
      else { resetGame(); startGame(); }
    });
    goMenu && goMenu.addEventListener('click', ()=> { hideOverlay(gameoverOverlay); showOverlay(menuOverlay); resetGame(); renderInterpolated(1); });

    // ensure canvas focus
    canvas && canvas.addEventListener('click', ()=> canvas.focus());
    canvas && canvas.setAttribute('tabindex','0');
  }

  // init
  applySettings();
  resetGame();
  renderInterpolated(1);
  attachListeners();
  requestAnimationFrame(gameLoop);

  // expose core controls to global so UI script can call them
  // (insert these lines before the end of DOMContentLoaded handler)
  window.startGame = startGame;
  window.resetGame = resetGame;
  window.gameOver = gameOver;
  window.updateScoreUI = updateScore;
});

// Add this after your DOMContentLoaded initialization so elements exist:

(function attachArcadeUI() {
  const arcadeScreen = document.getElementById('arcade-screen');
  const tapOverlay = document.getElementById('tap-overlay');
  const resetBtn = document.getElementById('reset-button');
  const goRetry = document.getElementById('go-retry');
  const gameoverScreen = document.getElementById('gameover-screen');

  // tap to play: call your existing startGame() if present
  if (arcadeScreen) {
    arcadeScreen.addEventListener('click', () => {
      if (typeof startGame === 'function') startGame();
      if (tapOverlay) tapOverlay.style.display = 'none';
    });
  }

  // reset handlers
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (typeof resetGame === 'function') resetGame();
    if (typeof startGame === 'function') startGame();
    if (tapOverlay) tapOverlay.style.display = 'none';
    if (gameoverScreen) gameoverScreen.classList.add('hidden');
  });

  if (goRetry) goRetry.addEventListener('click', ()=> {
    if (typeof resetGame === 'function') resetGame();
    if (typeof startGame === 'function') startGame();
    if (gameoverScreen) gameoverScreen.classList.add('hidden');
    if (tapOverlay) tapOverlay.style.display = 'none';
  });
})();
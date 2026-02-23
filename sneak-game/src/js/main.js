// Minimal main.js shim — înlocuiește cu logica reală după ce verifici UI
(function(){
  // Grid / rendering
  const TILE = 16;
  let canvas, ctx;
  let cols = 40, rows = 40; // will be recomputed from canvas size
  // Game state
  let running = false;
  let lastTime = 0;
  let accumulator = 0;
  let msPerTick = 120; // tick speed (smaller = faster)
  let snake = []; // array of {x,y}
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = null;
  let score = 0;
  let hiScore = 0;
  let attached = false;
  let prevHead = null;
  let foodSpawnAt = 0; // used to animate food spawn
  let lost = false; // prevent duplicate gameOver notifications
  const containerSelector = '.crt-bezel'; // element wrapping the canvas

  function fitCanvasToContainer(){
    const container = document.querySelector(containerSelector) || document.body;
    if (!container) return;
    // compute available inner size (use client area)
    const w = container.clientWidth;
    const h = container.clientHeight;
    // make canvas size a multiple of TILE
    const cw = Math.max(TILE, Math.floor(w / TILE) * TILE);
    const ch = Math.max(TILE, Math.floor(h / TILE) * TILE);
    if (!canvas) return;
    canvas.width = cw;
    canvas.height = ch;
    cols = Math.floor(canvas.width / TILE);
    rows = Math.floor(canvas.height / TILE);
  }

  function initCanvas(){
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    // ensure canvas can receive keyboard focus
    canvas.setAttribute('tabindex','0');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    fitCanvasToContainer();
    window.addEventListener('resize', () => { fitCanvasToContainer(); render(); });
    attachListeners();
    drawSplash();
  }

  function attachListeners(){
    if (attached) return;
    attached = true;
    // use document so overlays can't steal keys
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { setDir(0, -1); e.preventDefault(); }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { setDir(0, 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { setDir(-1, 0); e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { setDir(1, 0); e.preventDefault(); }

      // pause / resume
      if ((e.key === 'p' || e.key === 'Escape')) {
        if (running) { running = false; console.info('main.js: paused'); }
        else if (snake.length) { running = true; lastTime = 0; accumulator = 0; requestAnimationFrame(loop); console.info('main.js: resumed'); }
      }
    });
  }

  function setDir(x,y){
    // prevent reverse into self if length>1
    if (snake.length > 1 && x === -dir.x && y === -dir.y) return;
    nextDir = { x, y };
  }

  function resetState(){
    fitCanvasToContainer();
    // initialize snake in center, length 4
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    snake = [];
    const initialLen = 4;
    for (let i = initialLen - 1; i >= 0; i--) snake.push({ x: cx - i, y: cy });
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    placeFood();
    // prevHead initialised to current head so interpolation has a baseline
    prevHead = { ...snake[snake.length - 1] };
  }

  function placeFood(){
    const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
    let tries = 0;
    while (tries < 1000){
      const fx = Math.floor(Math.random() * cols);
      const fy = Math.floor(Math.random() * rows);
      if (!occupied.has(`${fx},${fy}`)) {
        food = { x: fx, y: fy };
        foodSpawnAt = performance.now();
        return;
      }
      tries++;
    }
    food = null;
  }
  
  function step(){
    // buffer direction
    dir = nextDir;
    // store previous head for interpolation
    prevHead = { ...snake[snake.length - 1] };

    const head = { x: snake[snake.length - 1].x + dir.x, y: snake[snake.length - 1].y + dir.y };

    // walls are deadly (no wrap) -> lose if outside
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows){
      gameOver();
      return;
    }

    // self collision => lose
    if (snake.some(s => s.x === head.x && s.y === head.y)){
      gameOver();
      return;
    }

    // move snake
    snake.push(head);

    // eat food?
    if (food && head.x === food.x && head.y === food.y){
      score += 10;
      if (score > hiScore) hiScore = score;
      placeFood();
    } else {
      // remove tail
      snake.shift();
    }
  }

  function render(){
    if (!ctx || !canvas) return;
    const now = performance.now();
    // interpolation alpha (0..1)
    let alpha = (msPerTick > 0) ? Math.max(0, Math.min(1, accumulator / msPerTick)) : 1;

    // background
    ctx.fillStyle = '#001414';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // subtle checker grid
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x=0;x<cols;x++){
      for (let y=0;y<rows;y++){
        if (((x+y) & 1) === 0) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }

    // Food: spawn animation + pulse + halo
    if (food){
      const since = Math.max(0, now - (foodSpawnAt || 0));
      const spawnT = Math.min(1, since / 300); // 0..1 during spawn
      const pulse = 1 + Math.sin(now / 350) * 0.12;
      const base = TILE - 6;
      const fw = base * pulse * (0.6 + 0.4 * spawnT); // grows on spawn
      const ox = (TILE - fw) / 2;

      // halo
      ctx.save();
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(now / 200);
      ctx.fillStyle = '#ffcf66';
      ctx.fillRect(food.x * TILE - 2, food.y * TILE - 2, TILE + 4, TILE + 4);
      ctx.restore();

      // main food block with soft stroke
      ctx.fillStyle = '#ffcc00';
      roundRectFill(ctx, food.x * TILE + 3 + ox/2, food.y * TILE + 3 + ox/2, fw, fw, 3);
      ctx.strokeStyle = 'rgba(255,204,0,0.18)';
      ctx.strokeRect(food.x * TILE + 2, food.y * TILE + 2, TILE - 4, TILE - 4);
    }

    // Snake body with gradient and subtle wobble wave
    const t = now / 300;
    for (let i=0;i<snake.length;i++){
      const p = snake[i];
      // compute slight wobble offsets so body looks organic
      const wobbleX = Math.sin(t + i * 0.7) * 0.22; // in cell units
      const wobbleY = Math.cos(t * 1.1 + i * 0.6) * 0.18;
      // segment pixel pos
      const px = (p.x + wobbleX) * TILE;
      const py = (p.y + wobbleY) * TILE;

      // color gradient per segment (darker tail, brighter head)
      const ratio = i / Math.max(1, snake.length - 1);
      const rA = lerpColor('#007b88', '#00f0ff', ratio * 0.9);

      // draw rounded segment
      const segSize = TILE - 2;
      const rad = 3;
      ctx.save();
      // slight inner glow for head
      if (i === snake.length - 1){
        const g = ctx.createLinearGradient(px, py, px + segSize, py + segSize);
        g.addColorStop(0, '#7ffcff');
        g.addColorStop(1, '#00b8c6');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = rA;
      }
      roundRectFill(ctx, px + 1, py + 1, segSize, segSize, rad);
      ctx.restore();
    }

    // draw head eyes (position interpolated)
    if (snake.length){
      const curHead = snake[snake.length - 1];
      const hx = (prevHead.x + (curHead.x - prevHead.x) * alpha) * TILE;
      const hy = (prevHead.y + (curHead.y - prevHead.y) * alpha) * TILE;
      // small eye offset depending on dir
      const ex = dir.x * 4;
      const ey = dir.y * 4;
      ctx.fillStyle = '#012';
      ctx.beginPath();
      ctx.arc(hx + TILE * 0.3 + ex, hy + TILE * 0.35 + ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + TILE * 0.7 + ex, hy + TILE * 0.35 + ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#001a2a';
    ctx.fillRect(8,8,140,28);
    ctx.fillStyle = '#00d1ff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('SCORE ' + score, 12, 28);
  }

  // small helper: draw rounded rect filled
  function roundRectFill(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  // helper to lerp between two hex colors (very simple)
  function lerpColor(a, b, t){
    // parse hex #rrggbb
    function hexToRgb(h){
      const v = h.replace('#','');
      return [parseInt(v.substr(0,2),16), parseInt(v.substr(2,2),16), parseInt(v.substr(4,2),16)];
    }
    function rgbToHex(r,g,b){ return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join(''); }
    const A = hexToRgb(a), B = hexToRgb(b);
    const R = Math.round(A[0] + (B[0] - A[0]) * t);
    const G = Math.round(A[1] + (B[1] - A[1]) * t);
    const Bv = Math.round(A[2] + (B[2] - A[2]) * t);
    return rgbToHex(R,G,Bv);
  }

  function loop(ts){
    if (!running) return;
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    accumulator += delta;
    // advance fixed ticks
    while (accumulator >= msPerTick){
      step();
      accumulator -= msPerTick;
    }
    render();
    lastTime = ts;
    requestAnimationFrame(loop);
  }

  function startGame(){
    if (!canvas) initCanvas();
    if (!canvas) { console.warn('main.js: no canvas found'); return; }
    if (running) return;
    lost = false;
    resetState();
    running = true;
    lastTime = 0;
    accumulator = 0;
    // focus the canvas to improve keyboard reliability
    try { canvas.focus(); } catch(e){}
    console.info('main.js: startGame called');
    requestAnimationFrame(loop);
  }

  function resetGame(){
    running = false;
    lost = false;
    resetState();
    render();
    console.info('main.js: resetGame()');
  }

  function gameOver(){
    // ignore duplicate/invalid calls
    if (lost) return;
    lost = true;
    running = false;
    if (score > hiScore) hiScore = score;
    console.info('main.js: gameOver', score, hiScore);

    // small debounce: wait a short moment and only show the UI if lost is still true
    // this prevents transient gameOver calls from showing the overlay during reset/start
    setTimeout(() => {
      if (!lost) return;      // was cleared by a reset/start
      if (running) return;    // resumed meanwhile
      if (window.__arcadeUI && typeof window.__arcadeUI.updateGameOverUI === 'function'){
        try {
          window.__arcadeUI.updateGameOverUI(score, hiScore);
        } catch(e){
          console.warn('main.js: updateGameOverUI threw', e);
        }
      }
    }, 150);
  }

  // simple splash / idle draw (fixes "drawSplash is not defined")
  function drawSplash(){
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#001414';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x=0;x<cols;x++){
      for (let y=0;y<rows;y++){
        if (((x+y) & 1) === 0) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    ctx.fillStyle = '#00d1ff';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText('PRESS START', 12, 36);
  }

  // exports
  window.startGame = startGame;
  window.resetGame = resetGame;
  window.gameOver = gameOver;
  // disable external score updates to avoid UI showing while playing
  window.updateScore = v => { /* no-op */ };

  // support requestStart fallback
  document.addEventListener('requestStart', ()=> {
    try {
      resetGame();
      startGame();
      console.info('main.js: requestStart handled');
    } catch(e){ console.warn('main.js: requestStart failed', e); }
  });

  document.addEventListener('DOMContentLoaded', initCanvas);
})();
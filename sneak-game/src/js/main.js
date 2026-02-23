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
  // --- added: previous head for interpolation + minor timing vars
  let prevHead = null;
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
    // pick a random empty cell
    const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
    let tries = 0;
    while (tries < 1000){
      const fx = Math.floor(Math.random() * cols);
      const fy = Math.floor(Math.random() * rows);
      if (!occupied.has(`${fx},${fy}`)) { food = { x: fx, y: fy }; return; }
      tries++;
    }
    // fallback: no space
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
    // interpolation alpha
    let alpha = (msPerTick > 0) ? Math.max(0, Math.min(1, accumulator / msPerTick)) : 1;

    // background
    ctx.fillStyle = '#001414';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // subtle grid
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x=0;x<cols;x++){
      for (let y=0;y<rows;y++){
        if (((x+y) & 1) === 0) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }

    // food pulse
    if (food){
      const t = performance.now() / 400;
      const pulse = 1 + Math.sin(t) * 0.12;
      const fw = (TILE - 6) * pulse;
      const ox = (TILE - fw) / 2;
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(food.x * TILE + 3 + ox/2, food.y * TILE + 3 + ox/2, fw, fw);
    }

    // body
    for (let i=0;i<snake.length-1;i++){
      const p = snake[i];
      ctx.fillStyle = '#007b88';
      ctx.fillRect(p.x * TILE + 1, p.y * TILE + 1, TILE - 2, TILE - 2);
    }

    // head interpolated
    const curHead = snake[snake.length - 1];
    const hx = (prevHead.x + (curHead.x - prevHead.x) * alpha) * TILE;
    const hy = (prevHead.y + (curHead.y - prevHead.y) * alpha) * TILE;
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(hx + 1, hy + 1, TILE - 2, TILE - 2);

    // HUD
    ctx.fillStyle = '#001a2a';
    ctx.fillRect(8,8,140,28);
    ctx.fillStyle = '#00d1ff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('SCORE ' + score, 12, 28);
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
    resetState();
    render();
    console.info('main.js: resetGame()');
  }

  function gameOver(){
    running = false;
    if (score > hiScore) hiScore = score;
    console.info('main.js: gameOver', score, hiScore);
    // notify UI
    if (window.__arcadeUI && typeof window.__arcadeUI.updateGameOverUI === 'function'){
      window.__arcadeUI.updateGameOverUI(score, hiScore);
    }
  }

  // exports
  window.startGame = startGame;
  window.resetGame = resetGame;
  window.gameOver = gameOver;
  window.updateScore = v => { score = v; };

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
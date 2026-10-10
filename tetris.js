/* DuelZone Tetris */
(function () {
  'use strict';

  var COLS = 10, ROWS = 20, BLOCK = 30;
  var SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,1,0],[0,1,1]]
  ];
  var COLORS = ['#00e5ff','#9d4edd','#43a047','#e53935','#fdd835','#1e88e5','#ff9800'];

  var canvas, ctx, grid, piece, px, py, score, lines, level, timer, running, loopId;

  function emptyGrid() {
    var g = [];
    for (var r = 0; r < ROWS; r++) {
      g[r] = [];
      for (var c = 0; c < COLS; c++) g[r][c] = 0;
    }
    return g;
  }

  function newPiece() {
    var i = Math.floor(Math.random() * SHAPES.length);
    return { shape: SHAPES[i].map(function (row) { return row.slice(); }), color: COLORS[i], idx: i };
  }

  function collide(g, p, x, y) {
    for (var r = 0; r < p.shape.length; r++) {
      for (var c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        var nr = y + r, nc = x + c;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || g[nr][nc]) return true;
      }
    }
    return false;
  }

  function merge(g, p, x, y) {
    for (var r = 0; r < p.shape.length; r++) {
      for (var c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c]) g[y + r][x + c] = p.color;
      }
    }
  }

  function rotate(p) {
    var s = p.shape, rows = s.length, cols = s[0].length;
    var rot = [];
    for (var c = 0; c < cols; c++) {
      rot[c] = [];
      for (var r = rows - 1; r >= 0; r--) rot[c].push(s[r][c]);
    }
    return { shape: rot, color: p.color, idx: p.idx };
  }

  function clearLines() {
    var cleared = 0;
    for (var r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every(function (v) { return v !== 0; })) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += cleared * 100 * level;
      level = 1 + Math.floor(lines / 10);
      updateHud();
    }
  }

  function updateHud() {
    document.getElementById('t-score').textContent = score;
    document.getElementById('t-lines').textContent = lines;
    document.getElementById('t-level').textContent = level;
  }

  function spawn() {
    piece = newPiece();
    px = Math.floor((COLS - piece.shape[0].length) / 2);
    py = 0;
    if (collide(grid, piece, px, py)) endGame();
  }

  function drawBlock(c, r, color) {
    var x = c * BLOCK;
    var y = r * BLOCK;
    var pad = 1;
    var size = BLOCK - pad * 2;
    
    // Base color
    ctx.fillStyle = color;
    ctx.fillRect(x + pad, y + pad, size, size);
    
    // Top-left highlight bevel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad + size);
    ctx.lineTo(x + pad, y + pad);
    ctx.lineTo(x + pad + size, y + pad);
    ctx.lineTo(x + pad + size - 4, y + pad + 4);
    ctx.lineTo(x + pad + 4, y + pad + 4);
    ctx.lineTo(x + pad + 4, y + pad + size - 4);
    ctx.fill();
    
    // Bottom-right shadow bevel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x + pad + size, y + pad);
    ctx.lineTo(x + pad + size, y + pad + size);
    ctx.lineTo(x + pad, y + pad + size);
    ctx.lineTo(x + pad + 4, y + pad + size - 4);
    ctx.lineTo(x + pad + size - 4, y + pad + size - 4);
    ctx.lineTo(x + pad + size - 4, y + pad + 4);
    ctx.fill();

    // Inner darker core
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x + pad + 4, y + pad + 4, size - 8, size - 8);
  }

  function draw() {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dz-bg-card').trim() || '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background faintly
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for(var r=0; r<=ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r*BLOCK); ctx.lineTo(COLS*BLOCK, r*BLOCK); ctx.stroke(); }
    for(var c=0; c<=COLS; c++) { ctx.beginPath(); ctx.moveTo(c*BLOCK, 0); ctx.lineTo(c*BLOCK, ROWS*BLOCK); ctx.stroke(); }

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c]) {
          drawBlock(c, r, grid[r][c]);
        }
      }
    }
    for (var r = 0; r < piece.shape.length; r++) {
      for (var c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        drawBlock(px + c, py + r, piece.color);
      }
    }
  }

  function tick() {
    if (!running) return;
    if (!collide(grid, piece, px, py + 1)) py++;
    else {
      merge(grid, piece, px, py);
      clearLines();
      spawn();
    }
    draw();
  }

  function move(dx) {
    if (!running) return;
    if (!collide(grid, piece, px + dx, py)) { px += dx; draw(); }
  }

  function softDrop() {
    if (!running) return;
    if (!collide(grid, piece, px, py + 1)) { py++; score += 1; updateHud(); draw(); }
    else {
      merge(grid, piece, px, py);
      clearLines();
      spawn();
      draw();
    }
  }

  function hardDrop() {
    if (!running) return;
    while (!collide(grid, piece, px, py + 1)) { py++; score += 2; }
    merge(grid, piece, px, py);
    clearLines();
    spawn();
    updateHud();
    draw();
  }

  function rotPiece() {
    if (!running) return;
    var np = rotate(piece);
    if (!collide(grid, np, px, py)) { piece = np; draw(); }
  }

  function endGame() {
    running = false;
    if (loopId) clearInterval(loopId);
    dzShowResult({
      title: 'Game Over',
      subtitle: 'Score: ' + score + ' · Lines: ' + lines,
      stats: 'Level ' + level,
      onAgain: function () { startGame(); }
    });
  }

  function startGame() {
    grid = emptyGrid();
    score = 0; lines = 0; level = 1;
    running = true;
    updateHud();
    spawn();
    draw();
    clearInterval(loopId);
    var speed = Math.max(100, 500 - (level - 1) * 40);
    loopId = setInterval(tick, speed);
    if (typeof dzRegisterGameLoop === 'function') {
      dzRegisterGameLoop(function () { running = false; clearInterval(loopId); });
    }
  }

  function resetAll() {
    running = false;
    if (loopId) clearInterval(loopId);
    dzHideResult();
    startGame();
  }

  document.addEventListener('DOMContentLoaded', function () {
    canvas = document.getElementById('tetris-canvas');
    ctx = canvas.getContext('2d');

    document.getElementById('tetris-start').addEventListener('click', function () {
      document.getElementById('tetris-setup').classList.add('hidden');
      document.getElementById('tetris-play').classList.remove('hidden');
      startGame();
    });

    document.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var a = btn.getAttribute('data-act');
        if (a === 'left') move(-1);
        if (a === 'right') move(1);
        if (a === 'down') softDrop();
        if (a === 'drop') hardDrop();
        if (a === 'rotate') rotPiece();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (!running) return;
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowDown') softDrop();
      if (e.key === 'ArrowUp') rotPiece();
      if (e.key === ' ') hardDrop();
    });

    dzInitGamePage({ onRestart: resetAll, onLeave: function () { running = false; clearInterval(loopId); } });

  });
})();

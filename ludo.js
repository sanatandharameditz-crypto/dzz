/* ─── DuelZone Ludo — ludo.js ───────────────────────────────────────────── */
"use strict";

const SHARED_PATH = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
  [6,0]
];

const HOME_COLS = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]
};

const START_IDX = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const HOME_ENTRY_REL = 51;
const TRACK_LENGTH = 52;

const HOME_POSITIONS = {
  red:    [[1,1],[1,3],[3,1],[3,3]],
  green:  [[1,11],[1,13],[3,11],[3,13]],
  yellow: [[11,11],[11,13],[13,11],[13,13]],
  blue:   [[11,1],[11,3],[13,1],[13,3]]
};

const COLORS = ['red','green','yellow','blue'];
const COLOR_NAMES = { red:'Red', green:'Green', yellow:'Yellow', blue:'Blue' };

const STACK_LAYOUTS = {
  1: [{ left: '14%', top: '14%', size: 72 }],
  2: [
    { left: '4%', top: '28%', size: 46 },
    { left: '50%', top: '28%', size: 46 },
  ],
  3: [
    { left: '28%', top: '4%', size: 42 },
    { left: '4%', top: '50%', size: 42 },
    { left: '50%', top: '50%', size: 42 },
  ],
  4: [
    { left: '4%', top: '4%', size: 40 },
    { left: '50%', top: '4%', size: 40 },
    { left: '4%', top: '50%', size: 40 },
    { left: '50%', top: '50%', size: 40 },
  ],
};

let state = {};
let boardEl;
let gameConfig = null; // Save config for restarts
let isAnimating = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function initState(config) {
  gameConfig = config || gameConfig || {
    red: { active: true, bot: false },
    green: { active: true, bot: false },
    yellow: { active: true, bot: false },
    blue: { active: true, bot: false }
  };

  state = {
    turn: 0,
    dice: 0,
    rolled: false,
    gameOver: false,
    tokens: {},
    winner: null,
    log: [],
    players: gameConfig
  };

  for (const c of COLORS) {
    if (!state.players[c].active) continue;
    state.tokens[c] = HOME_POSITIONS[c].map((pos, i) => ({
      id: i,
      color: c,
      pos: 'home',
      row: pos[0],
      col: pos[1],
    }));
  }
  
  // Advance to first active player
  while (!state.players[COLORS[state.turn]].active) {
    state.turn = (state.turn + 1) % 4;
  }
}

function sharedIdxToCell(idx) {
  return SHARED_PATH[((idx % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH];
}

function isAtHomeCol(token) {
  return typeof token.pos === 'number' && token.pos >= 100;
}

function homeColDepth(token) {
  return token.pos - 100;
}

function sharedRelativePos(color, token) {
  const startOffset = START_IDX[color];
  return ((token.pos - startOffset) + TRACK_LENGTH) % TRACK_LENGTH;
}

function canMove(color, token, dice) {
  if (token.pos === 'done') return false;
  if (token.pos === 'home') return dice === 6;
  if (isAtHomeCol(token)) {
    return homeColDepth(token) + dice <= 5;
  }
  const relPos = sharedRelativePos(color, token);
  const newRel = relPos + dice;
  if (newRel < HOME_ENTRY_REL) return true;
  // Entering home column: remaining steps after reaching entry point
  const stepsOnTrack = HOME_ENTRY_REL - relPos; // steps to reach home entry
  const stepsInHome = dice - stepsOnTrack;       // remaining steps go into home col
  return stepsInHome <= 5; // home col has 6 cells (0-5), 5 = center
}

function getMovableTokens(color, dice) {
  return state.tokens[color].filter(t => canMove(color, t, dice));
}

async function animateMoveToken(color, tokenIdx, dice) {
  const token = state.tokens[color][tokenIdx];
  let captures = 0;

  if (token.pos === 'home') {
    const idx = START_IDX[color];
    token.pos = idx;
    const [r, c] = sharedIdxToCell(idx);
    token.row = r;
    token.col = c;
    render();
    await sleep(150);
    addLog(color, `Token ${tokenIdx + 1} entered the board!`);
    captures += checkCapture(color, token, idx);
  } else {
    for (let step = 1; step <= dice; step++) {
      if (isAtHomeCol(token)) {
        // Already in home column, move deeper
        const newDepth = homeColDepth(token) + 1;
        if (newDepth === 5) {
          token.pos = 'done';
          token.row = 7;
          token.col = 7;
          render();
          await sleep(150);
          addLog(color, `Token ${tokenIdx + 1} reached HOME!`);
          checkWin(color);
          break;
        } else {
          token.pos = 100 + newDepth;
          const [r, c] = HOME_COLS[color][newDepth];
          token.row = r;
          token.col = c;
          render();
          await sleep(150);
        }
      } else {
        // On shared track
        const relPos = sharedRelativePos(color, token);
        const newRel = relPos + 1;

        if (newRel >= HOME_ENTRY_REL) {
          // Enter home column
          token.pos = 100;
          const [r, c] = HOME_COLS[color][0];
          token.row = r;
          token.col = c;
          render();
          await sleep(150);
          addLog(color, `Token ${tokenIdx + 1} entered the home column!`);
        } else {
          const startOffset = START_IDX[color];
          const newAbsIdx = (startOffset + newRel) % TRACK_LENGTH;
          token.pos = newAbsIdx;
          const [r, c] = sharedIdxToCell(newAbsIdx);
          token.row = r;
          token.col = c;
          render();
          await sleep(150);
        }
      }
    }
    
    if (typeof token.pos === 'number' && token.pos < 100) {
      const cap = checkCapture(color, token, token.pos);
      captures += cap;
      if (cap > 0) {
         render();
         await sleep(150);
      }
    }
  }

  return captures;
}

function checkCapture(myColor, myToken, sharedIdx) {
  if (SAFE_CELLS.has(sharedIdx)) return 0;
  let captures = 0;
  for (const c of COLORS) {
    if (c === myColor) continue;
    if (!state.tokens[c]) continue;
    for (const t of state.tokens[c]) {
      if (t.pos === sharedIdx) {
        t.pos = 'home';
        const homePos = HOME_POSITIONS[c][t.id];
        t.row = homePos[0];
        t.col = homePos[1];
        addLog(myColor, `Token ${myToken.id + 1} captured ${COLOR_NAMES[c]}'s token ${t.id + 1}!`);
        captures++;
      }
    }
  }
  return captures;
}

function checkWin(color) {
  const done = state.tokens[color].filter(t => t.pos === 'done').length;
  if (done === 4) {
    state.gameOver = true;
    state.winner = color;
    addLog(color, `${COLOR_NAMES[color]} WINS THE GAME!`);
  }
}

function addLog(color, msg) {
  state.log.unshift({ color, msg });
  if (state.log.length > 20) state.log.pop();
}

function buildBoard() {
  boardEl = document.getElementById('ludo-board');
  boardEl.innerHTML = '';

  const bases = [
    { color: 'red', area: '1 / 1 / 7 / 7' },
    { color: 'green', area: '1 / 10 / 7 / 16' },
    { color: 'yellow', area: '10 / 10 / 16 / 16' },
    { color: 'blue', area: '10 / 1 / 16 / 7' }
  ];

  bases.forEach(b => {
    const base = document.createElement('div');
    base.className = `home-base base-${b.color}`;
    base.style.gridArea = b.area;
    
    const whiteBox = document.createElement('div');
    whiteBox.className = 'home-white-box';
    
    for(let i=0; i<4; i++) {
      const circle = document.createElement('div');
      circle.className = `home-circle circle-${b.color}`;
      const pos = HOME_POSITIONS[b.color][i];
      circle.dataset.row = pos[0];
      circle.dataset.col = pos[1];
      whiteBox.appendChild(circle);
    }
    
    base.appendChild(whiteBox);
    boardEl.appendChild(base);
  });

  const center = document.createElement('div');
  center.className = 'board-center';
  center.style.gridArea = '7 / 7 / 10 / 10';
  boardEl.appendChild(center);

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (
        (r <= 5 && c <= 5) ||
        (r <= 5 && c >= 9) ||
        (r >= 9 && c >= 9) ||
        (r >= 9 && c <= 5) ||
        (r >= 6 && r <= 8 && c >= 6 && c <= 8)
      ) {
        continue;
      }
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;
      classifyCell(cell, r, c);
      cell.style.gridArea = `${r+1} / ${c+1} / ${r+2} / ${c+2}`;
      boardEl.appendChild(cell);
    }
  }
}

function classifyCell(cell, r, c) {
  if (r === 2 && c === 6) cell.innerHTML = '<span class="star-icon gray-star">★</span>';
  if (r === 6 && c === 12) cell.innerHTML = '<span class="star-icon gray-star">★</span>';
  if (r === 12 && c === 8) cell.innerHTML = '<span class="star-icon gray-star">★</span>';
  if (r === 8 && c === 2) cell.innerHTML = '<span class="star-icon gray-star">★</span>';

  if (r === 6 && c === 1) cell.classList.add('path-red');
  if (r === 1 && c === 8) cell.classList.add('path-green');
  if (r === 8 && c === 13) cell.classList.add('path-yellow');
  if (r === 13 && c === 6) cell.classList.add('path-blue');

  if (r === 7 && c >= 1 && c <= 5) cell.classList.add('col-red');
  if (c === 7 && r >= 1 && r <= 5) cell.classList.add('col-green');
  if (r === 7 && c >= 9 && c <= 13) cell.classList.add('col-yellow');
  if (c === 7 && r >= 9 && r <= 13) cell.classList.add('col-blue');

  if (r === 7 && c === 0) cell.innerHTML = '<span class="arrow red-arrow">➔</span>';
  if (r === 0 && c === 7) cell.innerHTML = '<span class="arrow green-arrow">⬇</span>';
  if (r === 7 && c === 14) cell.innerHTML = '<span class="arrow yellow-arrow">⬅</span>';
  if (r === 14 && c === 7) cell.innerHTML = '<span class="arrow blue-arrow">⬆</span>';
}

function renderTokens() {
  document.querySelectorAll('.token').forEach(el => el.remove());

  const color = COLORS[state.turn];
  const isHuman = state.players[color] && !state.players[color].bot;
  const movable = (state.rolled && !state.gameOver && isHuman)
    ? getMovableTokens(color, state.dice)
    : [];

  const groups = new Map();

  for (const color of COLORS) {
    if (!state.players[color].active) continue;
    for (const token of state.tokens[color]) {
      const row = token.pos === 'done' ? 7 : token.row;
      const col = token.pos === 'done' ? 7 : token.col;
      const key = `${row},${col}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ color, token, row, col });
    }
  }

  for (const [, tokensAtCell] of groups) {
    const layout = STACK_LAYOUTS[Math.min(tokensAtCell.length, 4)] || STACK_LAYOUTS[4];
    tokensAtCell.forEach((entry, i) => {
      placeToken(entry.row, entry.col, entry.color, entry.token, movable, layout[i]);
    });
  }
}

function placeToken(row, col, color, token, movable, layout) {
  const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;

  const el = document.createElement('div');
  el.classList.add('token', color);
  el.textContent = token.id + 1;
  el.dataset.color = color;
  el.dataset.id = token.id;

  if (layout) {
    el.style.width = `${layout.size}%`;
    el.style.height = `${layout.size}%`;
    el.style.left = layout.left;
    el.style.top = layout.top;
  }

  const isMovable = movable.some(t => t.id === token.id && t.color === color);
  if (isMovable) {
    el.classList.add('movable');
    el.title = 'Click to move';
    el.addEventListener('click', () => onTokenClick(color, token.id));
  }

  cell.appendChild(el);
}

const DOT_POSITIONS = {
  1: [[50,50]],
  2: [[25,25],[75,75]],
  3: [[25,25],[50,50],[75,75]],
  4: [[25,25],[75,25],[25,75],[75,75]],
  5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
  6: [[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
};

function renderDice(value) {
  const face = document.getElementById('dice-face');
  const dotsEl = face.querySelector('.dice-dots');
  dotsEl.innerHTML = '';
  if (!value) return;
  for (const [x, y] of DOT_POSITIONS[value]) {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    dot.style.left = `calc(${x}% - 5px)`;
    dot.style.top = `calc(${y}% - 5px)`;
    dotsEl.appendChild(dot);
  }
}

function renderTurnPanel() {
  for (const c of COLORS) {
    const row = document.querySelector(`.turn-row[data-color="${c}"]`);
    if (!row) continue;
    if (!state.players[c].active) {
      row.style.display = 'none';
      continue;
    }
    row.style.display = 'flex';
    const isActive = COLORS[state.turn] === c && !state.gameOver;
    row.classList.toggle('active', isActive);
    
    // Add bot icon to name if needed
    const nameSpan = row.querySelector('span:nth-child(2)');
    if (nameSpan) {
      nameSpan.textContent = COLOR_NAMES[c] + (state.players[c].bot ? ' 🤖' : '');
    }

    const score = row.querySelector('.turn-score');
    const tokens = state.tokens[c];
    const done = tokens ? tokens.filter(t => t.pos === 'done').length : 0;
    if (score) score.textContent = `${done}/4`;
  }
}

function renderLog() {
  const list = document.getElementById('log-list');
  list.innerHTML = '';
  for (const entry of state.log) {
    const el = document.createElement('li');
    el.classList.add(`log-${entry.color}`);
    el.innerHTML = `<strong>${COLOR_NAMES[entry.color]}:</strong> ${entry.msg}`;
    list.appendChild(el);
  }
}

function renderRollBtn() {
  const btn = document.getElementById('btn-roll');
  const isBot = state.players[COLORS[state.turn]] && state.players[COLORS[state.turn]].bot;
  btn.disabled = state.rolled || state.gameOver || isBot || isAnimating;
  btn.textContent = state.gameOver ? 'Game Over' : (isBot || isAnimating ? 'Bot Thinking...' : (state.rolled ? 'Pick a Token' : 'Roll Dice'));
}

function render() {
  renderTurnPanel();
  renderDice(state.dice);
  renderTokens();
  renderLog();
  renderRollBtn();
}

function onRoll() {
  if (state.rolled || state.gameOver || isAnimating) return;

  const value = Math.floor(Math.random() * 6) + 1;
  state.dice = value;
  state.rolled = true;

  const face = document.getElementById('dice-face');
  face.classList.remove('rolling');
  void face.offsetWidth;
  face.classList.add('rolling');
  setTimeout(() => face.classList.remove('rolling'), 500);

  const color = COLORS[state.turn];
  addLog(color, `Rolled a ${value}!`);

  const movable = getMovableTokens(color, value);
  if (movable.length === 0) {
    addLog(color, 'No moves available. Passing turn.');
    render();
    setTimeout(() => endTurn(false), 800);
    return;
  }

  render();

  if (state.players[color].bot) {
    setTimeout(() => doBotMove(color), 800);
  } else if (movable.length === 1) {
    onTokenClick(color, movable[0].id);
  }
}

async function onTokenClick(color, tokenId) {
  if (!state.rolled || state.gameOver || isAnimating) return;
  if (COLORS[state.turn] !== color) return;

  const token = state.tokens[color][tokenId];
  if (!canMove(color, token, state.dice)) return;

  isAnimating = true;
  const diceVal = state.dice;
  state.rolled = false;
  renderRollBtn();

  const captures = await animateMoveToken(color, tokenId, diceVal);
  const bonusTurn = diceVal === 6 || captures > 0;
  
  isAnimating = false;

  if (state.gameOver) {
    render();
    showWinModal(color);
    return;
  }

  render();
  if (bonusTurn) {
    addLog(color, `Bonus turn! (${diceVal === 6 ? 'rolled 6' : 'captured!'})`);
    render();
    checkBotTurn();
  } else {
    endTurn(false);
  }
}

async function doBotMove(color) {
  if (!state.rolled || state.gameOver) return;
  const movable = getMovableTokens(color, state.dice);
  if (movable.length === 0) {
    // No moves available - pass turn
    addLog(color, 'No moves available. Passing turn.');
    render();
    setTimeout(() => endTurn(false), 400);
    return;
  }
  
  let chosenToken = movable[0];
  let bestScore = -1;
  
  for (const t of movable) {
    let score = 0;
    if (t.pos === 'home') {
       score += 50; 
    } else if (isAtHomeCol(t)) {
       score += 20;
    } else {
       const relPos = sharedRelativePos(color, t);
       const newRel = relPos + state.dice;
       if (newRel >= HOME_ENTRY_REL) score += 40;
       else {
          const newAbsIdx = (START_IDX[color] + newRel) % TRACK_LENGTH;
          if (!SAFE_CELLS.has(newAbsIdx)) {
            let cap = 0;
            for(const c of COLORS) {
              if (c===color || !state.players[c].active) continue;
              for(const ot of state.tokens[c]) {
                 if (ot.pos === newAbsIdx) cap++;
              }
            }
            if (cap > 0) score += 100;
          }
          score += (relPos / 51) * 10;
       }
    }
    
    if (score > bestScore) {
      bestScore = score;
      chosenToken = t;
    }
  }
  
  await onTokenClick(color, chosenToken.id);
}

function endTurn(bonus) {
  if (!bonus) {
    do {
      state.turn = (state.turn + 1) % 4;
    } while (!state.players[COLORS[state.turn]].active);
  }
  state.dice = 0;
  state.rolled = false;
  render();
  checkBotTurn();
}

function checkBotTurn() {
  if (state.gameOver || isAnimating) return;
  const c = COLORS[state.turn];
  if (state.players[c].bot) {
    setTimeout(onRoll, 800);
  }
}

function showWinModal(color) {
  if (typeof dzShowResult === 'function') {
    dzShowResult({
      title: COLOR_NAMES[color] + ' Wins!',
      subtitle: COLOR_NAMES[color] + ' got all 4 tokens home first.',
      stats: 'Ludo · 4-player local',
      onAgain: function () {
        dzHideResult();
        onRestart();
      }
    });
  }
}

function onRestart() {
  if (typeof dzHideResult === 'function') dzHideResult();
  isAnimating = false;
  initState();
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  buildBoard();
  initState();

  var startBtn = document.getElementById('ludo-start');
  var setup = document.getElementById('ludo-setup');
  var play = document.getElementById('ludo-play');

  // UI elements
  var mode4p = document.getElementById('dz-mode-4p');
  var mode2p = document.getElementById('dz-mode-2p');
  var modeBot = document.getElementById('dz-mode-bot');
  var p2Config = document.getElementById('ludo-2p-config');
  var botConfig = document.getElementById('ludo-bot-config');
  
  let currentMode = '4p';

  function setMode(mode) {
    currentMode = mode;
    mode4p.classList.toggle('selected', mode === '4p');
    mode2p.classList.toggle('selected', mode === '2p');
    modeBot.classList.toggle('selected', mode === 'bot');
    
    p2Config.style.display = mode === '2p' ? 'block' : 'none';
    botConfig.style.display = mode === 'bot' ? 'block' : 'none';
  }

  if (mode4p) mode4p.onclick = () => setMode('4p');
  if (mode2p) mode2p.onclick = () => setMode('2p');
  if (modeBot) modeBot.onclick = () => setMode('bot');

  if (startBtn) {
    startBtn.addEventListener('click', function () {
      let config = {
        red: { active: false, bot: false },
        green: { active: false, bot: false },
        yellow: { active: false, bot: false },
        blue: { active: false, bot: false }
      };

      if (currentMode === '4p') {
        Object.keys(config).forEach(c => config[c].active = true);
      } 
      else if (currentMode === '2p') {
        const c1 = document.getElementById('ludo-p1-color').value;
        const c2 = document.getElementById('ludo-p2-color').value;
        if (c1 === c2) {
           alert("Please choose different colors for Player 1 and Player 2.");
           return;
        }
        config[c1].active = true;
        config[c2].active = true;
      }
      else if (currentMode === 'bot') {
        const human = document.getElementById('ludo-human-color').value;
        const botCount = parseInt(document.getElementById('ludo-bot-count').value, 10) || 1;
        config[human].active = true;
        
        // Pick opponents
        const otherColors = COLORS.filter(c => c !== human);
        for(let i=0; i<botCount; i++) {
           const bc = otherColors[i];
           config[bc].active = true;
           config[bc].bot = true;
        }
      }

      setup.classList.add('hidden');
      play.classList.remove('hidden');
      initState(config);
      render();
      checkBotTurn();
    });
  }

  document.getElementById('btn-roll').addEventListener('click', onRoll);

  if (typeof dzInitGamePage === 'function') {
    dzInitGamePage({ onRestart: onRestart });
  }

});

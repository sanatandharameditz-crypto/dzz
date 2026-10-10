/* DuelZone — game registry. Every game must be registered or findGame() returns null. */
(function (global) {
  'use strict';


  var GAMES = [
    { id: 'chess', title: 'Chess', icon: '♟️', desc: 'Outsmart your rival', category: 'strategy', modes: 'pvp+bot', status: 'live', href: 'chess.html', plays: '14.2k', badge: 'hot' },
    { id: 'ludo', title: 'Ludo', icon: '🎲', desc: 'Roll. Race. Win.', category: 'board', modes: 'pvp', status: 'live', href: 'ludo.html', plays: '9.8k', badge: 'new' },
    { id: 'tetris', title: 'Tetris', icon: '🟦', desc: 'Stack to survive', category: 'arcade', modes: 'solo', status: 'live', href: 'tetris.html', plays: '6.4k' },
    { id: 'battleship', title: 'Battleship', icon: '🚢', desc: 'Sink or be sunk', category: 'strategy', modes: 'pvp+bot', status: 'live', href: 'battleship.html', plays: '5.2k' },
    { id: 'checkers', title: 'Checkers', icon: '⬛', desc: 'Jump and crown', category: 'strategy', modes: 'pvp+bot', status: 'live', href: 'checkers.html', plays: '4.8k' },
    { id: 'carrom', title: 'Carrom', icon: '🎯', desc: 'Flick. Pocket. Score.', category: 'board', modes: 'pvp', status: 'soon', href: null, plays: 'Coming soon', badge: 'soon' },
    { id: 'sudoku', title: 'Sudoku', icon: '🔢', desc: 'Fill the grid', category: 'puzzle', modes: 'solo', status: 'live', href: 'sudoku.html', plays: '4.1k' },
    { id: 'minesweeper', title: 'Minesweeper', icon: '💣', desc: 'One wrong move...', category: 'puzzle', modes: 'solo', status: 'live', href: 'minesweeper.html', plays: '3.1k', badge: 'new' },
    { id: 'airhockey', title: 'Air Hockey', icon: '🏒', desc: 'Slide and score', category: 'arcade', modes: 'pvp', status: 'live', href: 'airhockey.html', plays: '2.9k' },
    { id: 'tanks', title: 'Tanks Arena', icon: '🛡️', desc: 'Blast your rival', category: 'arcade', modes: 'pvp', status: 'live', href: 'tanks.html', plays: '2.7k' },
    { id: 'bomberman', title: 'Bomberman', icon: '💥', desc: 'Bomb battle', category: 'arcade', modes: 'pvp', status: 'live', href: 'bomberman.html', plays: '2.5k' },
    { id: 'starcatcher', title: 'Star Catcher', icon: '⭐', desc: 'Catch falling stars', category: 'arcade', modes: 'solo', status: 'live', href: 'starcatcher.html', plays: '2.3k' },
    { id: 'spacedodge', title: 'Space Dodge', icon: '🚀', desc: 'Dodge asteroids', category: 'arcade', modes: 'solo', status: 'live', href: 'spacedodge.html', plays: '2.1k' },
    { id: 'territory', title: 'Territory', icon: '🗺️', desc: 'Claim the map', category: 'strategy', modes: 'pvp', status: 'live', href: 'territory.html', plays: '2.0k' },
    { id: 'pingpong', title: 'Ping Pong', icon: '🏓', desc: 'Classic paddle duel', category: 'arcade', modes: 'pvp', status: 'live', href: 'pingpong.html', plays: '1.9k' },
    { id: 'darts', title: 'Darts', icon: '🎯', desc: 'Hit the bullseye', category: 'arcade', modes: 'solo+pvp', status: 'live', href: 'darts.html', plays: '1.8k' },
    { id: 'reaction', title: 'Reaction Test', icon: '⚡', desc: 'Tap when it turns green', category: 'casual', modes: 'solo', status: 'live', href: 'reaction.html', plays: '1.7k' },
    { id: 'snake', title: 'Snake Duel', icon: '🐍', desc: 'Grow or crash', category: 'arcade', modes: 'pvp', status: 'live', href: 'snake.html', plays: '1.6k' },
    { id: 'connect4', title: 'Connect Four', icon: '🔴', desc: 'Four in a row', category: 'board', modes: 'pvp', status: 'live', href: 'connect4.html', plays: '1.5k' },
    { id: 'wordduel', title: 'Word Duel', icon: '📝', desc: 'Race to type', category: 'casual', modes: 'pvp', status: 'live', href: 'wordduel.html', plays: '1.4k' },
    { id: 'pool', title: '8-Ball Pool', icon: '🎱', desc: 'Sink the eight', category: 'arcade', modes: 'pvp', status: 'live', href: 'pool.html', plays: '1.3k' },
    { id: 'blackjack', title: 'Blackjack', icon: '🃏', desc: 'Beat the dealer', category: 'card', modes: 'solo', status: 'live', href: 'blackjack.html', plays: '1.2k' },
    { id: 'memory', title: 'Memory Match', icon: '🧠', desc: 'Flip and remember', category: 'puzzle', modes: 'solo', status: 'live', href: 'memory.html', plays: '1.1k' },
    { id: '2048', title: '2048 Duel', icon: '🔲', desc: 'Merge to win', category: 'puzzle', modes: 'pvp', status: 'live', href: 'game2048.html', plays: '1.0k' },
    { id: 'pong', title: 'Pong Classic', icon: '🕹️', desc: 'Retro paddle war', category: 'arcade', modes: 'pvp', status: 'live', href: 'pong.html', plays: '980' }
  ];

  var FILTER_MAP = {
    All: null,
    Strategy: ['strategy'],
    Board: ['board'],
    Arcade: ['arcade'],
    Puzzle: ['puzzle'],
    Card: ['card'],
    Casual: ['casual']
  };

  function findGame(id) {
    if (!id) return null;
    var key = String(id).toLowerCase();
    for (var i = 0; i < GAMES.length; i++) {
      if (GAMES[i].id === key) return GAMES[i];
    }
    return null;
  }

  function liveGames() {
    return GAMES.filter(function (g) { return g.status === 'live'; });
  }

  function topRated() {
    return liveGames().slice().sort(function (a, b) {
      var pa = parseFloat(String(a.plays).replace(/[^\d.]/g, '')) || 0;
      var pb = parseFloat(String(b.plays).replace(/[^\d.]/g, '')) || 0;
      return pb - pa;
    });
  }

  global.DZ_GAMES = GAMES;
  global.DZ_FILTER_MAP = FILTER_MAP;
  global.findGame = findGame;
  global.dzLiveGames = liveGames;
  global.dzTopRated = topRated;
})(typeof window !== 'undefined' ? window : this);

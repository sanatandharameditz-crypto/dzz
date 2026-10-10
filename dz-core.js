/* DuelZone — Core Logic, Player Profile, and Global Audio */
(function (global) {
  'use strict';

  // --- GAME LIFECYCLE ---
  var gameLoops = [];
  function registerGameLoop(fn) { gameLoops.push(fn); }
  function unregisterGameLoop(fn) { gameLoops = gameLoops.filter(function (f) { return f !== fn; }); }
  function stopAllGames() {
    gameLoops.forEach(function (fn) { try { fn(); } catch (e) {} });
    gameLoops = [];
  }

  // --- PLAYER PROFILE & XP SYSTEM ---
  var DZPlayer = {
    data: {
      name: "Player",
      avatar: "👽",
      xp: 0,
      level: 1,
      matches: 0,
      wins: 0,
      prefs: { music: false, sfx: true }
    },
    load: function() {
      try {
        var d = localStorage.getItem('dz_player_v1');
        if (d) {
          var parsed = JSON.parse(d);
          for (var k in parsed) {
            if (parsed.hasOwnProperty(k)) this.data[k] = parsed[k];
          }
        }
      } catch(e) {}
      this.recalcLevel();
    },
    save: function() {
      try { localStorage.setItem('dz_player_v1', JSON.stringify(this.data)); } catch(e) {}
    },
    recalcLevel: function() {
      this.data.level = Math.floor(Math.pow(this.data.xp / 100, 0.5)) + 1;
    },
    addXP: function(amount) {
      var oldLevel = this.data.level;
      this.data.xp += amount;
      this.recalcLevel();
      this.save();
      if (this.data.level > oldLevel) {
        if (typeof DZAudio !== 'undefined') DZAudio.playSFX('levelup');
        if (typeof dzFireConfetti === 'function') dzFireConfetti();
      }
    },
    addMatch: function(won) {
      this.data.matches++;
      if (won) this.data.wins++;
      this.save();
    },
    setName: function(newName) {
      if (newName && newName.trim().length > 0) {
        this.data.name = newName.trim().substring(0, 15); // limit length
        this.save();
      }
    },
    xpForNextLevel: function() {
      return Math.pow(this.data.level, 2) * 100;
    },
    xpForCurrentLevel: function() {
      return Math.pow(this.data.level - 1, 2) * 100;
    },
    getProgressPercent: function() {
      var currentFloor = this.xpForCurrentLevel();
      var nextCeil = this.xpForNextLevel();
      var range = nextCeil - currentFloor;
      var into = this.data.xp - currentFloor;
      return Math.min(100, Math.max(0, (into / range) * 100));
    }
  };
  DZPlayer.load();

  // --- GLOBAL AUDIO GENERATOR ---
  var DZAudio = {
    ctx: null,
    bgmNodes: [],
    initialized: false,
    init: function() {
      if (this.initialized) return;
      if (!this.ctx) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.initialized = true;
      if (DZPlayer.data.prefs.music) this.playBGM();
    },
    playBGM: function() {
      this.stopBGM();
      if (!DZPlayer.data.prefs.music || !this.ctx) return;
      var t = this.ctx.currentTime;
      
      var osc1 = this.ctx.createOscillator();
      var gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 110.00;
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.04, t + 4);
      osc1.connect(gain1); gain1.connect(this.ctx.destination);
      osc1.start(t);
      this.bgmNodes.push({o: osc1, g: gain1});
      
      var osc2 = this.ctx.createOscillator();
      var gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.value = 164.81;
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.02, t + 6);
      osc2.connect(gain2); gain2.connect(this.ctx.destination);
      osc2.start(t);
      this.bgmNodes.push({o: osc2, g: gain2});
    },
    stopBGM: function() {
      var t = this.ctx ? this.ctx.currentTime : 0;
      this.bgmNodes.forEach(function(n) {
        try {
          n.g.gain.linearRampToValueAtTime(0, t + 1);
          setTimeout(function() { try { n.o.stop(); } catch(e){} }, 1100);
        } catch(e) {}
      });
      this.bgmNodes = [];
    },
    toggleMusic: function(on) {
      DZPlayer.data.prefs.music = on;
      DZPlayer.save();
      if (on) {
        if (!this.initialized) this.init();
        else this.playBGM();
      } else {
        this.stopBGM();
      }
    },
    toggleSFX: function(on) {
      DZPlayer.data.prefs.sfx = on;
      DZPlayer.save();
    },
    isSFXEnabled: function() {
      return DZPlayer.data.prefs.sfx;
    },
    playSFX: function(type) {
      if (!this.isSFXEnabled() || !this.ctx) return;
      var t = this.ctx.currentTime;
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.setValueAtTime(500, t + 0.1);
        osc.frequency.setValueAtTime(600, t + 0.2);
        osc.frequency.setValueAtTime(800, t + 0.3);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
      } else if (type === 'levelup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(554.37, t + 0.15); // C#
        osc.frequency.setValueAtTime(659.25, t + 0.3); // E
        osc.frequency.setValueAtTime(880, t + 0.45); // A
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.8);
        osc.start(t);
        osc.stop(t + 0.8);
      }
    }
  };

  document.addEventListener('click', function _initAudio(e) {
    if (DZPlayer.data.prefs.music) DZAudio.init();
    document.removeEventListener('click', _initAudio);
  }, { once: true });

  // Play SFX on button clicks
  document.addEventListener('click', function(e) {
    if (e.target.closest('button') || e.target.closest('.dz-btn') || e.target.closest('.dz-icon-btn') || e.target.closest('.dz-mode-card') || e.target.closest('.dz-swatch')) {
      if (typeof DZAudio !== 'undefined') DZAudio.playSFX('click');
    }
  });

  global.dzRegisterGameLoop = registerGameLoop;
  global.dzUnregisterGameLoop = unregisterGameLoop;
  global.dzStopAllGames = stopAllGames;
  global.DZPlayer = DZPlayer;
  global.DZAudio = DZAudio;

  // --- GLOBAL CONFETTI VFX ---
  global.dzFireConfetti = function() {
    var count = 100;
    var colors = ['#00e5ff', '#ff007f', '#ffd700', '#10b981', '#a855f7'];
    var particles = [];
    var canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    var ctx = canvas.getContext('2d');
    var w = canvas.width = window.innerWidth;
    var h = canvas.height = window.innerHeight;
    
    for (var i=0; i<count; i++) {
      particles.push({
        x: w / 2, y: h / 2,
        vx: (Math.random() - 0.5) * (w > 600 ? 25 : 15),
        vy: (Math.random() - 0.8) * (h > 600 ? 25 : 15),
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }
    
    function render() {
      ctx.clearRect(0, 0, w, h);
      var active = false;
      particles.forEach(function(p) {
        p.vy += 0.5; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (p.y < h + 20) active = true;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
      });
      if (active) requestAnimationFrame(render);
      else document.body.removeChild(canvas);
    }
    render();
  };

})(typeof window !== 'undefined' ? window : this);

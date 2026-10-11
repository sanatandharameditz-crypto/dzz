/* DuelZone — hub rendering, search, filters, nav */
(function () {
  'use strict';

  function badgeHtml(game) {
    if (!game.badge) return '';
    var cls = game.badge === 'soon' ? 'soon' : game.badge;
    var label = game.badge === 'hot' ? 'HOT' : game.badge === 'new' ? 'NEW' : 'SOON';
    return '<span class="dz-badge ' + cls + '">' + label + '</span>';
  }

  function gameCardHtml(game) {
    var soon = game.status === 'soon' || !game.href;
    var tag = soon ? 'div' : 'a';
    var href = soon ? '' : ' href="' + game.href + '" data-dz-game="' + game.id + '"';
    var classes = 'dz-card' + (soon ? ' soon' : '');
    var style = soon ? '' : ' style="text-decoration:none;"';

    return '<' + tag + ' class="' + classes + '"' + href + style + ' data-category="' + game.category + '" data-title="' + game.title.toLowerCase() + '">' +
      badgeHtml(game) +
      '<div class="dz-card-icon">' + game.icon + '</div>' +
      '<div class="dz-card-content">' +
        '<div class="dz-card-name">' + game.title + '</div>' +
        '<div class="dz-card-desc">' + game.desc + '</div>' +
      '</div>' +
      '<div class="dz-card-footer"><span class="dz-card-plays">' + game.plays + '</span></div>' +
    '</' + tag + '>';
  }

  function miniCardHtml(game, rank) {
    return '<a href="' + (game.href || '#') + '" class="dz-card-mini" data-dz-game="' + game.id + '" style="text-decoration:none;color:inherit;">' +
      '<div class="dz-card-mini-rank">#' + rank + '</div>' +
      '<div class="dz-card-mini-icon">' + game.icon + '</div>' +
      '<div class="dz-card-mini-name">' + game.title + '</div>' +
      '<div class="dz-card-mini-plays">' + game.plays + '</div>' +
    '</a>';
  }

  function renderGamesGrid() {
    var grid = document.getElementById('dz-games-grid');
    if (!grid || typeof DZ_GAMES === 'undefined') return;
    grid.innerHTML = DZ_GAMES.map(gameCardHtml).join('');
  }

  function renderTrending() {
    var row = document.getElementById('dz-trending-row');
    if (!row || typeof dzTopRated !== 'function') return;
    var top = dzTopRated().slice(0, 5);
    row.innerHTML = top.map(function (g, i) { return miniCardHtml(g, i + 1); }).join('');
  }

  function filterGames(query, categoryKey) {
    var cards = document.querySelectorAll('#dz-games-grid .dz-card');
    var q = (query || '').trim().toLowerCase();
    var ids = null;
    if (categoryKey && DZ_FILTER_MAP && DZ_FILTER_MAP[categoryKey]) {
      ids = DZ_FILTER_MAP[categoryKey];
    } else if (categoryKey && categoryKey !== 'All') {
      ids = [categoryKey.toLowerCase()];
    }

    cards.forEach(function (card) {
      var title = card.getAttribute('data-title') || '';
      var cat = card.getAttribute('data-category') || '';
      var matchQ = !q || title.indexOf(q) >= 0 || cat.indexOf(q) >= 0;
      var matchCat = !ids || ids.indexOf(cat) >= 0 || ids.indexOf(title) >= 0;
      card.style.display = matchQ && matchCat ? '' : 'none';
    });
  }

  function bindSearch() {
    var input = document.querySelector('.dz-search-input');
    if (!input || input._dzSearchWired) return;
    input._dzSearchWired = true;
    input.addEventListener('input', function () {
      var active = document.querySelector('.dz-filter-pill.active');
      var cat = active ? active.textContent.trim() : 'All';
      filterGames(input.value, cat);
    });
  }

  function bindFilters() {
    document.querySelectorAll('.dz-filter-pill').forEach(function (pill) {
      if (pill._dzFilterWired) return;
      pill._dzFilterWired = true;
      pill.addEventListener('click', function () {
        document.querySelectorAll('.dz-filter-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        var input = document.querySelector('.dz-search-input');
        filterGames(input ? input.value : '', pill.textContent.trim());
      });
    });
  }

  function bindNav() {
    var panels = {
      home: document.getElementById('dz-panel-home'),
      games: document.getElementById('dz-panel-games'),
      profile: document.getElementById('dz-panel-profile'),
      about: document.getElementById('dz-panel-about')
    };

    function renderProfile() {
      if (typeof DZPlayer === 'undefined') return;
      document.getElementById('dz-prof-name').textContent = DZPlayer.data.name || 'Player';
      var avatarEl = document.getElementById('dz-prof-avatar');
      if (avatarEl) avatarEl.textContent = DZPlayer.data.avatar || '👽';
      document.getElementById('dz-prof-level').textContent = DZPlayer.data.level;
      document.getElementById('dz-prof-matches').textContent = DZPlayer.data.matches;
      document.getElementById('dz-prof-xp-current').textContent = Math.floor(DZPlayer.data.xp) + ' XP';
      document.getElementById('dz-prof-xp-next').textContent = DZPlayer.xpForNextLevel() + ' XP';
      
      var fill = document.getElementById('dz-prof-xp-fill');
      if (fill) {
        fill.style.width = '0%';
        setTimeout(function() {
          fill.style.width = DZPlayer.getProgressPercent() + '%';
        }, 50);
      }
      
      var tMusic = document.getElementById('dz-toggle-music');
      var tSfx = document.getElementById('dz-toggle-sfx');
      if (tMusic) tMusic.checked = DZPlayer.data.prefs.music;
      if (tSfx) tSfx.checked = DZPlayer.data.prefs.sfx;
    }

    var editBtn = document.getElementById('dz-prof-edit-name');
    if (editBtn && !editBtn._dzWired) {
      editBtn._dzWired = true;
      editBtn.addEventListener('click', function() {
        var avatars = ['👽', '🤖', '👾', '👻', '🦊', '🐉', '🐱', '🦄'];
        var currentAvatar = DZPlayer.data.avatar || '👽';
        var avatarHtml = '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">' +
          avatars.map(function(a) {
            return '<div class="dz-avatar-opt" data-avatar="'+a+'" style="font-size:24px;cursor:pointer;padding:4px;border-radius:8px;background:' + (a===currentAvatar ? 'rgba(0,229,255,0.2)' : 'transparent') + ';border:1px solid ' + (a===currentAvatar ? '#00e5ff' : 'transparent') + ';">'+a+'</div>';
          }).join('') + '</div>';

        var modalHTML = `
          <div id="dz-edit-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);">
            <div style="background:#0f172a;border:1px solid rgba(0,229,255,0.3);border-radius:16px;padding:24px;width:90%;max-width:340px;text-align:center;box-shadow:0 10px 40px rgba(0,229,255,0.2);">
              <h2 style="margin:0 0 12px 0;font-size:20px;font-weight:900;color:#fff;">Edit Profile</h2>
              <p style="margin:0 0 8px 0;font-size:12px;color:rgba(255,255,255,0.5);">Choose Avatar</p>
              ${avatarHtml}
              <input type="text" id="dz-edit-input" value="${DZPlayer.data.name !== 'Player' ? DZPlayer.data.name : ''}" placeholder="Your Name" style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:#1e293b;color:#fff;font-size:16px;margin-bottom:20px;box-sizing:border-box;outline:none;" maxlength="12">
              <div style="display:flex;gap:10px;">
                <button id="dz-edit-cancel" style="flex:1;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff;font-weight:700;cursor:pointer;">Cancel</button>
                <button id="dz-edit-submit" style="flex:1;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg, #00e5ff, #0ea5e9);color:#000;font-weight:800;cursor:pointer;">Save</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        var modal = document.getElementById('dz-edit-modal');
        var input = document.getElementById('dz-edit-input');
        input.focus();
        
        var selectedAvatar = currentAvatar;
        var opts = modal.querySelectorAll('.dz-avatar-opt');
        opts.forEach(function(opt) {
          opt.addEventListener('click', function() {
            opts.forEach(function(o) { o.style.background = 'transparent'; o.style.borderColor = 'transparent'; });
            opt.style.background = 'rgba(0,229,255,0.2)';
            opt.style.borderColor = '#00e5ff';
            selectedAvatar = opt.getAttribute('data-avatar');
          });
        });

        function close() {
          modal.style.opacity = '0';
          setTimeout(function() { modal.remove(); }, 300);
        }

        document.getElementById('dz-edit-cancel').addEventListener('click', close);
        
        function save() {
          var val = input.value.trim();
          DZPlayer.data.avatar = selectedAvatar;
          if (val) {
            DZPlayer.setName(val);
          } else {
            DZPlayer.save();
          }
          renderProfile();
          close();
        }
        
        document.getElementById('dz-edit-submit').addEventListener('click', save);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') save(); });
      });
    }

    document.querySelectorAll('.dz-nav-item[data-nav]').forEach(function (btn) {
      if (btn._dzNavWired) return;
      btn._dzNavWired = true;
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-nav');
        document.querySelectorAll('.dz-nav-item').forEach(function (n) { n.classList.remove('active'); });
        btn.classList.add('active');
        
        // Hide all panels, strip animation class
        Object.keys(panels).forEach(function (k) {
          if (panels[k]) {
            panels[k].classList.add('hidden');
            panels[k].classList.remove('dz-panel--animated');
          }
        });

        // Show active panel with animation
        var targetPanel = key === 'games' ? panels['home'] : panels[key];
        if (targetPanel) {
          targetPanel.classList.remove('hidden');
          void targetPanel.offsetHeight;
          targetPanel.classList.add('dz-panel--animated');
        }
        
        if (key === 'profile') renderProfile();
        if (key === 'games') {
          setTimeout(function() {
            var el = document.getElementById('dz-games-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      });
    });

    // Wire up settings toggles
    var tMusic = document.getElementById('dz-toggle-music');
    var tSfx = document.getElementById('dz-toggle-sfx');
    if (tMusic) tMusic.addEventListener('change', function(e) {
      if (typeof DZAudio !== 'undefined') DZAudio.toggleMusic(e.target.checked);
    });
    if (tSfx) tSfx.addEventListener('change', function(e) {
      if (typeof DZAudio !== 'undefined') DZAudio.toggleSFX(e.target.checked);
    });
  }

  function heroCycle() {
    var dynEl = document.getElementById('dynamicWord');
    if (!dynEl) return;
    var words = ['Play.', 'Challenge.', 'Compete.', 'Dominate.'];
    var wi = 0;
    setInterval(function () {
      dynEl.style.opacity = '0';
      dynEl.style.transform = 'translateY(-8px)';
      setTimeout(function () {
        wi = (wi + 1) % words.length;
        dynEl.textContent = words[wi];
        dynEl.style.opacity = '1';
        dynEl.style.transform = 'translateY(0)';
      }, 300);
    }, 2000);
  }

  function initParticles() {
    var canvas = document.getElementById('dz-hero-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h;
    var particles = [];
    
    function resize() {
      w = canvas.width = canvas.parentElement.offsetWidth;
      h = canvas.height = canvas.parentElement.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    
    for(var i=0; i<30; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.2, // slight upward drift
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1
      });
    }
    
    function loop() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0, 229, 255, 1)';
      
      for(var i=0; i<particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderGamesGrid();
    renderTrending();
    bindSearch();
    bindFilters();
    bindNav();
    heroCycle();
    initParticles();
    if (typeof dzBindGameLinks === 'function') dzBindGameLinks();
  });
  
  // Handle Loader removal and First-time Setup
  window.addEventListener('load', function() {
    var loader = document.getElementById('dz-loader');
    if (loader) {
      loader.classList.add('hidden-loader');
      setTimeout(function() { loader.style.display = 'none'; }, 600);
    }

    // First time user name prompt (Custom Modal)
    if (!localStorage.getItem('dz_player_v1') || DZPlayer.data.name === 'Player') {
      setTimeout(function() {
        var avatars = ['👽', '🤖', '👾', '👻', '🦊', '🐉', '🐱', '🦄'];
        var currentAvatar = '👽';
        var avatarHtml = '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">' +
          avatars.map(function(a) {
            return '<div class="dz-avatar-opt2" data-avatar="'+a+'" style="font-size:24px;cursor:pointer;padding:4px;border-radius:8px;background:' + (a===currentAvatar ? 'rgba(0,229,255,0.2)' : 'transparent') + ';border:1px solid ' + (a===currentAvatar ? '#00e5ff' : 'transparent') + ';">'+a+'</div>';
          }).join('') + '</div>';

        var modalHTML = `
          <div id="dz-name-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);">
            <div style="background:#0f172a;border:1px solid rgba(0,229,255,0.3);border-radius:16px;padding:24px;width:90%;max-width:340px;text-align:center;box-shadow:0 10px 40px rgba(0,229,255,0.2);">
              <h2 style="margin:0 0 12px 0;font-size:24px;font-weight:900;color:#fff;">Welcome to <span style="color:#00e5ff;">DuelZone</span></h2>
              <p style="margin:0 0 8px 0;font-size:12px;color:rgba(255,255,255,0.5);">Choose an Avatar</p>
              ${avatarHtml}
              <input type="text" id="dz-name-input" placeholder="Your Player Name" style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:#1e293b;color:#fff;font-size:16px;margin-bottom:20px;box-sizing:border-box;outline:none;" maxlength="12">
              <button id="dz-name-submit" style="width:100%;padding:14px;border-radius:8px;border:none;background:linear-gradient(135deg, #00e5ff, #0ea5e9);color:#000;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 4px 15px rgba(0,229,255,0.4);">Let's Go!</button>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        var modal = document.getElementById('dz-name-modal');
        var input = document.getElementById('dz-name-input');
        var btn = document.getElementById('dz-name-submit');
        
        var selectedAvatar = currentAvatar;
        var opts = modal.querySelectorAll('.dz-avatar-opt2');
        opts.forEach(function(opt) {
          opt.addEventListener('click', function() {
            opts.forEach(function(o) { o.style.background = 'transparent'; o.style.borderColor = 'transparent'; });
            opt.style.background = 'rgba(0,229,255,0.2)';
            opt.style.borderColor = '#00e5ff';
            selectedAvatar = opt.getAttribute('data-avatar');
          });
        });

        input.focus();
        
        function saveName() {
          var val = input.value.trim();
          DZPlayer.data.avatar = selectedAvatar;
          if (val) {
            DZPlayer.setName(val);
          } else {
            DZPlayer.save(); // saves default
          }
          if (typeof renderProfile === 'function') renderProfile();
          modal.style.opacity = '0';
          setTimeout(function() { modal.remove(); }, 300);
        }
        
        btn.addEventListener('click', saveName);
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') saveName();
        });
      }, 700); // Wait for loader animation to finish
    }
  });
})();

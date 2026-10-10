/* DuelZone — shared game page helpers */
(function (global) {
  'use strict';

  function initGamePage(opts) {
    var options = opts || {};


    var back = document.getElementById('dz-back-hub');
    if (back && !back._dzWired) {
      back._dzWired = true;
      back.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof dzStopAllGames === 'function') dzStopAllGames();
        if (options.onLeave) options.onLeave();
        if (typeof dzGoHub === 'function') dzGoHub();
        else window.location.href = 'index.html';
      });
    }

    var restart = document.getElementById('dz-restart');
    if (restart && options.onRestart && !restart._dzWired) {
      restart._dzWired = true;
      restart.addEventListener('click', options.onRestart);
    }
  }

  function wireResultButtons(opts) {
    var overlay = document.getElementById('dz-result-overlay');
    if (!overlay) return;

    var again = document.getElementById('dz-result-again');
    if (again && opts.onAgain) {
      again.onclick = function () {
        overlay.classList.remove('show');
        opts.onAgain();
      };
    }

    var share = document.getElementById('dz-result-share');
    if (share) {
      share.onclick = function () {
        if (typeof dzShareWin === 'function') {
          dzShareWin({
            title: opts.title,
            subtitle: opts.subtitle,
            stats: opts.stats
          });
        }
      };
    }
  }

  function showResult(opts) {
    var overlay = document.getElementById('dz-result-overlay');
    if (!overlay) return;
    overlay.classList.add('show');
    var title = document.getElementById('dz-result-title');
    var sub = document.getElementById('dz-result-sub');
    if (title) title.textContent = opts.title || 'Victory!';
    
    var statsCard = document.getElementById('dz-result-stats');
    if (statsCard && opts.stats) {
      statsCard.style.display = 'grid';
      var timeEl = document.getElementById('dz-stat-time');
      var accEl = document.getElementById('dz-stat-acc');
      var xpEl = document.getElementById('dz-stat-xp');
      if (timeEl) timeEl.textContent = opts.stats.time || '00:00';
      if (accEl) accEl.textContent = opts.stats.accuracy || '100%';
      if (xpEl) xpEl.textContent = opts.stats.xp || '+50';
    } else if (statsCard) {
      statsCard.style.display = 'none';
    }

    // Award XP and update subtitle in one pass
    if (typeof DZPlayer !== 'undefined') {
      var xpEarned = 50;
      var isWin = opts.title && opts.title.toLowerCase().indexOf('win') >= 0;
      if (isWin) {
        xpEarned = 100;
        if (typeof DZAudio !== 'undefined') DZAudio.playSFX('win');
        if (typeof dzFireConfetti === 'function') dzFireConfetti();
      }
      DZPlayer.addMatch(isWin);
      DZPlayer.addXP(xpEarned);
      if (sub) {
        sub.innerHTML = (opts.subtitle || '') + '<br><span style="color:var(--dz-cyan);font-weight:bold;margin-top:8px;display:inline-block;"> | +' + xpEarned + ' XP Earned!</span>';
      }
    } else {
      if (sub) sub.textContent = opts.subtitle || '';
    }

    wireResultButtons(opts);
  }

  function hideResult() {
    var overlay = document.getElementById('dz-result-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  global.dzInitGamePage = initGamePage;
  global.dzShowResult = showResult;
  global.dzHideResult = hideResult;
})(typeof window !== 'undefined' ? window : this);

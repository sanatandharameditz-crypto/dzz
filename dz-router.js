/* DuelZone — query-param routing (?game=chess), history.pushState */
(function (global) {
  'use strict';

  function getGameParam() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('game');
    } catch (e) {
      var m = window.location.search.match(/[?&]game=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : null;
    }
  }

  function hubUrl(gameId) {
    if (!gameId) return 'index.html';
    return 'index.html?game=' + encodeURIComponent(gameId);
  }

  function gamePageUrl(game) {
    if (!game) return 'index.html';
    if (game.href) return game.href;
    return hubUrl(game.id);
  }

  function navigateToGame(gameId, usePushState) {
    var game = typeof findGame === 'function' ? findGame(gameId) : null;
    if (!game || game.status !== 'live' || !game.href) return false;
    var url = game.href;
    if (usePushState && window.history && window.history.pushState) {
      window.history.pushState({ dzGame: game.id }, '', hubUrl(game.id));
    }
    window.location.href = url;
    return true;
  }

  function goHub() {
    window.location.href = 'index.html';
  }

  function initHubRouter() {
    var id = getGameParam();
    if (!id) return;
    if (typeof findGame !== 'function') return;
    var game = findGame(id);
    if (game && game.status === 'live' && game.href) {
      window.location.replace(game.href);
    }
  }

  function bindGameLinks() {
    document.querySelectorAll('[data-dz-game]').forEach(function (el) {
      if (el._dzRouterWired) return;
      el._dzRouterWired = true;
      el.addEventListener('click', function (e) {
        var id = el.getAttribute('data-dz-game');
        if (!id) return;
        e.preventDefault();
        navigateToGame(id, true);
      });
    });
  }

  global.dzGetGameParam = getGameParam;
  global.dzHubUrl = hubUrl;
  global.dzNavigateToGame = navigateToGame;
  global.dzGoHub = goHub;
  global.dzInitHubRouter = initHubRouter;
  global.dzBindGameLinks = bindGameLinks;

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body && document.body.id === 'dz-hub') {
      initHubRouter();
      bindGameLinks();
    }
  });
})(typeof window !== 'undefined' ? window : this);

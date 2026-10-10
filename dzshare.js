(function (global) {
  'use strict';

  // Load qrious for QR Code generation
  var qrReady = false;
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
  script.onload = function() { qrReady = true; };
  document.head.appendChild(script);

  function _safe(text) {
    if (!text) return '';
    return String(text).replace(/<[^>]*>/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  }

  function _hex2rgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawGlitchText(ctx, text, x, y, size) {
    ctx.font = '900 ' + size + 'px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Cyan offset
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(text, x - 4, y - 3);
    // Magenta offset
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(text, x + 4, y + 3);
    // White top
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
  }

  function createShareCard(options) {
    var opts = options || {};
    var w = 540;
    var h = 960; // Vertical format matching the design
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');

    // Black background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    // Floating colorful squares
    var squares = [
      { x: 80, y: 150, size: 80, r: -15, color1: '#f97316', color2: '#fbbf24' },
      { x: 420, y: 220, size: 70, r: 10, color1: '#a855f7', color2: '#ec4899' },
      { x: 120, y: 820, size: 80, r: -20, color1: '#3b82f6', color2: '#00e5ff' },
      { x: 450, y: 780, size: 65, r: 25, color1: '#ec4899', color2: '#f43f5e' },
      { x: 90, y: 550, size: 55, r: 5, color1: '#10b981', color2: '#34d399' },
      { x: 480, y: 480, size: 75, r: -12, color1: '#8b5cf6', color2: '#6366f1' }
    ];

    squares.forEach(function(sq) {
      ctx.save();
      ctx.translate(sq.x, sq.y);
      ctx.rotate(sq.r * Math.PI / 180);
      var grad = ctx.createLinearGradient(0, 0, sq.size, sq.size);
      grad.addColorStop(0, sq.color1);
      grad.addColorStop(1, sq.color2);
      ctx.fillStyle = grad;
      drawRoundedRect(ctx, -sq.size/2, -sq.size/2, sq.size, sq.size, 20);
      ctx.restore();
    });

    // Top Right: Player info
    if (typeof window !== 'undefined' && window.DZPlayer) {
      var pName = window.DZPlayer.data.name || 'Player';
      var pLevel = 'Lv.' + (window.DZPlayer.data.level || 1);
      var avatar = window.DZPlayer.data.avatar || '👽';
      
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      
      // Avatar
      ctx.font = '36px sans-serif';
      ctx.fillText(avatar, w - 30, 40);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
      ctx.fillText(_safe(pName), w - 85, 35);
      
      // Level
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
      ctx.fillText(_safe(pLevel), w - 85, 65);
    }

    // Main Text (Glitch)
    drawGlitchText(ctx, "DUELZONE", w/2, 280, 75);
    drawGlitchText(ctx, _safe((opts.title || "VICTORY").toUpperCase()), w/2, 400, 55);

    if (opts.stats) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(_safe(opts.stats), w/2, 520);
    }

    // QR Code
    if (qrReady && typeof QRious !== 'undefined') {
      var gameUrl = window.location.href; // Direct to game
      var qr = new QRious({
        value: gameUrl,
        size: 160,
        background: '#ffffff',
        foreground: '#050505',
        level: 'H'
      });
      
      var qrImg = new Image();
      qrImg.src = qr.toDataURL();
      
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, w/2 - 95, 620, 190, 190, 16);
      
      // Draw QR Code onto canvas
      ctx.drawImage(qrImg, w/2 - 80, 635, 160, 160);
      
      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("SCAN TO PLAY", w/2, 840);
    }

    return canvas;
  }

  function shareWin(options) {
    var canvas = createShareCard(options);
    var dataUrl = canvas.toDataURL('image/png');
    if (navigator.share && options.tryNativeShare) {
      canvas.toBlob(function (blob) {
        if (!blob) return downloadDataUrl(dataUrl, 'duelzone-win.png');
        var file = new File([blob], 'duelzone-win.png', { type: 'image/png' });
        navigator.share({ files: [file], title: _safe(options.title || 'DuelZone Win') })
          .catch(function () { downloadDataUrl(dataUrl, 'duelzone-win.png'); });
      });
    } else {
      downloadDataUrl(dataUrl, 'duelzone-win.png');
    }
  }

  function downloadDataUrl(dataUrl, filename) {
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  global.dzShareSafe = _safe;
  global.dzShareHex2Rgba = _hex2rgba;
  global.dzCreateShareCard = createShareCard;
  global.dzShareWin = shareWin;
})(typeof window !== 'undefined' ? window : this);

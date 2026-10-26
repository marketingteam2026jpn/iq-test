/* AI-KNOW 脳タイプIQテスト — 図形描画ライブラリ
   spec: { shape, fill, color, rot, mirror, size, count, inner, items }
   drawFigure(spec) → inline SVG 文字列（viewBox 0 0 100 100） */
(function (global) {
  var COLORS = { blue: '#1E4FD8', navy: '#0B1F4B', sky: '#4FA3FF', gold: '#F2B544', red: '#E35D6A' };
  var uid = 0;

  function star(cx, cy, R, r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var rad = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r : R;
      pts.push((cx + rr * Math.cos(rad)).toFixed(1) + ',' + (cy + rr * Math.sin(rad)).toFixed(1));
    }
    return pts.join(' ');
  }
  function hexagon(cx, cy, R) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var rad = Math.PI / 3 * i - Math.PI / 2;
      pts.push((cx + R * Math.cos(rad)).toFixed(1) + ',' + (cy + R * Math.sin(rad)).toFixed(1));
    }
    return pts.join(' ');
  }

  // 形の輪郭パス（塗り・線は attrs で渡す）
  function outline(shape, attrs) {
    switch (shape) {
      case 'circle':   return '<circle cx="50" cy="50" r="31" ' + attrs + '/>';
      case 'square':   return '<rect x="21" y="21" width="58" height="58" rx="3" ' + attrs + '/>';
      case 'triangle': return '<polygon points="50,16 84,80 16,80" ' + attrs + '/>';
      case 'diamond':  return '<polygon points="50,14 86,50 50,86 14,50" ' + attrs + '/>';
      case 'star':     return '<polygon points="' + star(50, 52, 36, 15) + '" ' + attrs + '/>';
      case 'hexagon':  return '<polygon points="' + hexagon(50, 50, 34) + '" ' + attrs + '/>';
      case 'cross':    return '<path d="M38 16h24v22h22v24H62v22H38V62H16V38h22z" ' + attrs + '/>';
      case 'flag':     return '<path d="M30 24h30l24 18-24 18H30z" ' + attrs + '/><circle cx="38" cy="32" r="4.5" fill="#fff" stroke="none"/>';
      case 'lshape':   return '<path d="M30 18h16v48h28v16H30z" ' + attrs + '/>';
      case 'arrow':    return '<path d="M20 42h36V26l28 24-28 24V58H20z" ' + attrs + '/>';
      case 'dot':      return '<circle cx="50" cy="50" r="9" ' + attrs + '/>';
    }
    return '';
  }

  function one(spec) {
    var col = COLORS[spec.color || 'blue'];
    var fill = spec.fill || 'solid';
    var id = 'f' + (++uid);
    var s = '';
    if (fill === 'solid') {
      s += outline(spec.shape, 'fill="' + col + '" stroke="' + col + '" stroke-width="3" stroke-linejoin="round"');
    } else if (fill === 'empty') {
      s += outline(spec.shape, 'fill="none" stroke="' + col + '" stroke-width="5" stroke-linejoin="round"');
    } else if (fill === 'dots') {
      s += '<defs><pattern id="' + id + '" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.2" fill="' + col + '"/></pattern></defs>';
      s += outline(spec.shape, 'fill="url(#' + id + ')" stroke="' + col + '" stroke-width="4" stroke-linejoin="round"');
    } else { // quarter / half / threeq  → 下から塗る
      var frac = { quarter: .25, half: .5, threeq: .75 }[fill] || .5;
      var y = 100 - 100 * frac;
      s += '<defs><clipPath id="' + id + '"><rect x="0" y="' + y + '" width="100" height="100"/></clipPath></defs>';
      s += outline(spec.shape, 'fill="none" stroke="' + col + '" stroke-width="5" stroke-linejoin="round"');
      s += '<g clip-path="url(#' + id + ')">' + outline(spec.shape, 'fill="' + col + '" stroke="' + col + '" stroke-width="5" stroke-linejoin="round"') + '</g>';
    }
    if (spec.inner) {
      s += '<g transform="translate(50 50) scale(.42) translate(-50 -50)">' + one(spec.inner) + '</g>';
    }
    var t = [];
    if (spec.mirror) t.push('translate(100 0) scale(-1 1)');
    if (spec.rot) t.push('rotate(' + spec.rot + ' 50 50)');
    var sc = { s: .62, m: .82, l: 1 }[spec.size || 'l'];
    if (sc !== 1) t.push('translate(50 50) scale(' + sc + ') translate(-50 -50)');
    return t.length ? '<g transform="' + t.join(' ') + '">' + s + '</g>' : s;
  }

  // 複数配置（count または items）
  function multi(list) {
    var n = list.length;
    var pos = n === 1 ? [[50, 50]]
      : n === 2 ? [[28, 50], [72, 50]]
      : n === 3 ? [[28, 28], [72, 28], [50, 72]]
      : [[28, 28], [72, 28], [28, 72], [72, 72]];
    var s = '';
    for (var i = 0; i < n; i++) {
      s += '<g transform="translate(' + pos[i][0] + ' ' + pos[i][1] + ') scale(.46) translate(-50 -50)">' + one(list[i]) + '</g>';
    }
    return s;
  }

  function drawFigure(spec) {
    if (spec === null || spec === undefined) return '<svg viewBox="0 0 100 100" aria-hidden="true"></svg>';
    var body;
    if (spec.items) body = multi(spec.items);
    else if (spec.count && spec.count > 1) {
      var arr = [];
      for (var i = 0; i < spec.count; i++) arr.push(Object.assign({}, spec, { count: 1 }));
      body = multi(arr);
    } else if (spec.question) {
      body = '<text x="50" y="64" text-anchor="middle" font-size="44" font-weight="800" fill="#9CCBFF" font-family="Inter,sans-serif">?</text>';
    } else body = one(spec);
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + body + '</svg>';
  }

  global.drawFigure = drawFigure;
  global.FIG_COLORS = COLORS;
})(window);

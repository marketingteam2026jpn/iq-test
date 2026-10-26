/* AI-KNOW IQテスト — 行列推理（Mensa型）問題エンジン
   セル = トークン配列。トークンを白黒の線画SVGに描画し、規則（和・排他・回転・鏡映・移動・ラテン方陣）で
   3×3行列と6択を生成する。生成は決定的（乱数は問題番号シード）。 */
(function (global) {
  'use strict';
  var SW = 4; // stroke width
  var P = { TL: [25, 25], TC: [50, 25], TR: [75, 25], ML: [25, 50], C: [50, 50], MR: [75, 50], BL: [25, 75], BC: [50, 75], BR: [75, 75] };

  /* ---------- トークン描画 ---------- */
  function attrs(fill) { return 'fill="' + (fill ? '#111' : 'none') + '" stroke="#111" stroke-width="' + SW + '" stroke-linecap="round" stroke-linejoin="round"'; }
  var DRAW = {
    sq: function () { return '<rect x="18" y="18" width="64" height="64" ' + attrs() + '/>'; },
    ci: function () { return '<circle cx="50" cy="50" r="33" ' + attrs() + '/>'; },
    dia: function () { return '<polygon points="50,14 86,50 50,86 14,50" ' + attrs() + '/>'; },
    tri0: function () { return '<polygon points="50,16 84,80 16,80" ' + attrs() + '/>'; },
    tri90: function () { return '<polygon points="84,50 20,84 20,16" ' + attrs() + '/>'; },
    tri180: function () { return '<polygon points="50,84 16,20 84,20" ' + attrs() + '/>'; },
    tri270: function () { return '<polygon points="16,50 80,16 80,84" ' + attrs() + '/>'; },
    hex: function () { return '<polygon points="50,15 80,32 80,68 50,85 20,68 20,32" ' + attrs() + '/>'; },
    sqS: function () { return '<rect x="36" y="36" width="28" height="28" ' + attrs() + '/>'; },
    ciS: function () { return '<circle cx="50" cy="50" r="14" ' + attrs() + '/>'; },
    hl: function () { return '<line x1="14" y1="50" x2="86" y2="50" ' + attrs() + '/>'; },
    vl: function () { return '<line x1="50" y1="14" x2="50" y2="86" ' + attrs() + '/>'; },
    d1: function () { return '<line x1="18" y1="18" x2="82" y2="82" ' + attrs() + '/>'; },
    d2: function () { return '<line x1="82" y1="18" x2="18" y2="82" ' + attrs() + '/>'; },
    hl2: function () { return '<line x1="14" y1="38" x2="86" y2="38" ' + attrs() + '/><line x1="14" y1="62" x2="86" y2="62" ' + attrs() + '/>'; },
    hl3: function () { return '<line x1="14" y1="30" x2="86" y2="30" ' + attrs() + '/><line x1="14" y1="50" x2="86" y2="50" ' + attrs() + '/><line x1="14" y1="70" x2="86" y2="70" ' + attrs() + '/>'; },
    vl2: function () { return '<line x1="38" y1="14" x2="38" y2="86" ' + attrs() + '/><line x1="62" y1="14" x2="62" y2="86" ' + attrs() + '/>'; },
    vl3: function () { return '<line x1="30" y1="14" x2="30" y2="86" ' + attrs() + '/><line x1="50" y1="14" x2="50" y2="86" ' + attrs() + '/><line x1="70" y1="14" x2="70" y2="86" ' + attrs() + '/>'; },
    plus: function () { return '<path d="M50 28v44M28 50h44" ' + attrs() + '/>'; },
    x: function () { return '<path d="M30 30l40 40M70 30L30 70" ' + attrs() + '/>'; },
    arcN: function () { return '<path d="M20 50a30 30 0 0 1 60 0" ' + attrs() + '/>'; },
    arcS: function () { return '<path d="M80 50a30 30 0 0 1-60 0" ' + attrs() + '/>'; },
    arcE: function () { return '<path d="M50 20a30 30 0 0 1 0 60" ' + attrs() + '/>'; },
    arcW: function () { return '<path d="M50 80a30 30 0 0 1 0-60" ' + attrs() + '/>'; },
    chevN: function () { return '<path d="M22 66L50 30l28 36" ' + attrs() + '/>'; },
    chevS: function () { return '<path d="M22 34L50 70l28-36" ' + attrs() + '/>'; },
    chevE: function () { return '<path d="M34 22l36 28-36 28" ' + attrs() + '/>'; },
    chevW: function () { return '<path d="M66 22L30 50l36 28" ' + attrs() + '/>'; },
    zig: function () { return '<path d="M16 68l17-36 17 36 17-36 17 36" ' + attrs() + '/>'; },
    wave: function () { return '<path d="M14 50c9-18 18-18 27 0s18 18 27 0 18-18 18 0" ' + attrs() + '/>'; },
    bar: function () { return '<rect x="22" y="40" width="56" height="20" ' + attrs(true) + '/>'; }
  };
  // 位置付きトークン: dot@TL / ring@C / sqm@BR（小さな正方形）/ cross@TR
  function drawPos(kind, pos) {
    var p = P[pos]; if (!p) return '';
    var x = p[0], y = p[1];
    switch (kind) {
      case 'dot': return '<circle cx="' + x + '" cy="' + y + '" r="6" ' + attrs(true) + '/>';
      case 'ring': return '<circle cx="' + x + '" cy="' + y + '" r="6.5" ' + attrs() + '/>';
      case 'sqm': return '<rect x="' + (x - 6) + '" y="' + (y - 6) + '" width="12" height="12" ' + attrs() + '/>';
      case 'sqf': return '<rect x="' + (x - 6) + '" y="' + (y - 6) + '" width="12" height="12" ' + attrs(true) + '/>';
      case 'cross': return '<path d="M' + (x - 6) + ' ' + (y - 6) + 'l12 12M' + (x + 6) + ' ' + (y - 6) + 'l-12 12" ' + attrs() + '/>';
      case 'tick': return '<line x1="' + x + '" y1="' + (y - 9) + '" x2="' + x + '" y2="' + (y + 9) + '" ' + attrs() + '/>';
    }
    return '';
  }
  function drawToken(t) {
    if (DRAW[t]) return DRAW[t]();
    var m = t.split('@'); if (m.length === 2) return drawPos(m[0], m[1]);
    return '';
  }
  function drawCell(cell) {
    if (cell === '?') return '<svg viewBox="0 0 100 100" aria-hidden="true"><text x="50" y="66" text-anchor="middle" font-size="46" font-weight="700" fill="#111" font-family="Inter,sans-serif">?</text></svg>';
    var s = cell.map(drawToken).join('');
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + s + '</svg>';
  }

  /* ---------- 集合演算 ---------- */
  function uniq(a) { var o = {}; return a.filter(function (t) { if (o[t]) return false; o[t] = 1; return true; }); }
  function union(a, b) { return uniq(a.concat(b)); }
  function xor(a, b) { return uniq(a.filter(function (t) { return b.indexOf(t) < 0; }).concat(b.filter(function (t) { return a.indexOf(t) < 0; }))); }
  function inter(a, b) { return a.filter(function (t) { return b.indexOf(t) >= 0; }); }
  function minus(a, b) { return a.filter(function (t) { return b.indexOf(t) < 0; }); }
  function key(c) { return c.slice().sort().join('|'); }
  function same(a, b) { return key(a) === key(b); }

  /* ---------- 変換 ---------- */
  var ROT90 = { TL: 'TR', TR: 'BR', BR: 'BL', BL: 'TL', TC: 'MR', MR: 'BC', BC: 'ML', ML: 'TC', C: 'C' };
  var MIRH = { TL: 'TR', TR: 'TL', BL: 'BR', BR: 'BL', ML: 'MR', MR: 'ML', TC: 'TC', BC: 'BC', C: 'C' };
  var MIRV = { TL: 'BL', BL: 'TL', TR: 'BR', BR: 'TR', TC: 'BC', BC: 'TC', ML: 'ML', MR: 'MR', C: 'C' };
  var ROT_TOKEN = { hl: 'vl', vl: 'hl', d1: 'd2', d2: 'd1', arcN: 'arcE', arcE: 'arcS', arcS: 'arcW', arcW: 'arcN', chevN: 'chevE', chevE: 'chevS', chevS: 'chevW', chevW: 'chevN', tri0: 'tri90', tri90: 'tri180', tri180: 'tri270', tri270: 'tri0', hl2: 'vl2', vl2: 'hl2', hl3: 'vl3', vl3: 'hl3' };
  var MIRH_TOKEN = { d1: 'd2', d2: 'd1', arcE: 'arcW', arcW: 'arcE', chevE: 'chevW', chevW: 'chevE', tri90: 'tri270', tri270: 'tri90' };
  var MIRV_TOKEN = { d1: 'd2', d2: 'd1', arcN: 'arcS', arcS: 'arcN', chevN: 'chevS', chevS: 'chevN', tri0: 'tri180', tri180: 'tri0' };
  function mapTok(t, tokMap, posMap) {
    var m = t.split('@');
    if (m.length === 2) return m[0] + '@' + (posMap[m[1]] || m[1]);
    return tokMap[t] || t;
  }
  function rot90(c) { return c.map(function (t) { return mapTok(t, ROT_TOKEN, ROT90); }); }
  function mirH(c) { return c.map(function (t) { return mapTok(t, MIRH_TOKEN, MIRH); }); }
  function mirV(c) { return c.map(function (t) { return mapTok(t, MIRV_TOKEN, MIRV); }); }

  /* ---------- シード乱数 ---------- */
  function rng(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- 誤答生成 ---------- */
  var VOCAB_MARKS = ['dot@TL', 'dot@TR', 'dot@BL', 'dot@BR', 'dot@C', 'ring@C', 'ring@TL', 'ring@BR', 'cross@C', 'sqm@C', 'tick@C'];
  var VOCAB_LINES = ['hl', 'vl', 'd1', 'd2', 'plus', 'x', 'arcN', 'arcS', 'arcE', 'arcW'];
  var VOCAB_SHAPES = ['sq', 'ci', 'dia', 'tri0', 'tri180', 'hex'];
  function distractors(ans, cells, r, extraPool) {
    var pool = [], seen = {}; seen[key(ans)] = 1;
    function push(c) { if (!c || !c.length) return; var k = key(c); if (seen[k]) return; seen[k] = 1; pool.push(c); }
    // 行列内の他セル（典型的な誤答）
    cells.forEach(function (c) { if (c !== '?') push(c); });
    // 1要素除去
    ans.forEach(function (t) { push(ans.filter(function (u) { return u !== t; })); });
    // 変換
    push(rot90(ans)); push(mirH(ans)); push(mirV(ans)); push(rot90(rot90(ans)));
    // 1要素追加
    (extraPool || VOCAB_MARKS.concat(VOCAB_LINES)).forEach(function (t) { if (ans.indexOf(t) < 0) push(ans.concat([t])); });
    // 形の差し替え
    ans.forEach(function (t) {
      if (VOCAB_SHAPES.indexOf(t) >= 0) VOCAB_SHAPES.forEach(function (s) { if (s !== t) push(ans.map(function (u) { return u === t ? s : u; })); });
    });
    // 優先：他セル→変換→除去/追加 の順で混ぜつつ、5つ選ぶ
    var picked = [];
    var fromCells = pool.filter(function (c) { return cells.some(function (x) { return x !== '?' && same(x, c); }); });
    var rest = shuffle(pool.filter(function (c) { return fromCells.indexOf(c) < 0; }), r);
    shuffle(fromCells, r).slice(0, 2).forEach(function (c) { picked.push(c); });
    rest.forEach(function (c) { if (picked.length < 5) picked.push(c); });
    return picked;
  }

  function build(id, cells, extraPool) {
    var r = rng(id * 7 + 3);
    var ans = cells[8];
    var opts = distractors(ans, cells.slice(0, 8), r, extraPool).concat([ans]);
    opts = shuffle(opts, r);
    var answer = opts.findIndex(function (o) { return same(o, ans); });
    return { cells: cells.slice(0, 8).concat(['?']), options: opts, answer: answer };
  }

  /* ---------- 規則ごとの行列定義（9セル・最後が正答） ---------- */
  function latin(rowsA, colsB) { // 各行・各列に A,B の組合せが一度ずつ（ラテン方陣）
    var m = [];
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push([rowsA[(i + j) % 3], colsB[j]]);
    return m;
  }
  function rowOp(base, op) { // base: 3行×2セル → 3列目を op で生成
    var m = [];
    base.forEach(function (row) { m.push(row[0], row[1], op(row[0], row[1])); });
    return m;
  }
  function progression(start, step) { // 行ごとに start から step を3回
    var m = [];
    start.forEach(function (c) { var cur = c; for (var j = 0; j < 3; j++) { m.push(cur); cur = step(cur); } });
    return m;
  }

  /* ---------- レベル1：単純なパターン（単一属性の変化） ---------- */
  var EASY = [
    /* E1 行＝同じ形、列＝点が1つずつ増える */
    function () {
      var shapes = ['sq', 'ci', 'tri0']; var dots = [['dot@C'], ['dot@TL', 'dot@BR'], ['dot@TL', 'dot@C', 'dot@BR']];
      var m = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push([shapes[i]].concat(dots[j])); return m;
    },
    /* E2 行方向に90°ずつ回転（要素は1つ） */
    function () { return progression([['chevN'], ['tri0'], ['arcN']], rot90); },
    /* E3 形のラテン方陣（各行・各列に一度ずつ） */
    function () { var s = ['sq', 'ci', 'dia']; var m = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push([s[(i + j) % 3]]); return m; },
    /* E4 行＝同じ形、列＝線が1本ずつ増える */
    function () {
      var shapes = ['sq', 'ci', 'hex']; var lines = ['hl', 'hl2', 'hl3'];
      var m = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push([shapes[i], lines[j]]); return m;
    },
    /* E5 行の和（1列目＋2列目＝3列目）・要素は少なく */
    function () { return rowOp([[['hl'], ['vl']], [['d1'], ['d2']], [['sq'], ['dot@C']]], union); },
    /* E6 列＝同じ形、点が左上→中央→右下へ移動 */
    function () {
      var shapes = ['sq', 'ci', 'tri0']; var pos = ['TL', 'C', 'BR'];
      var m = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push([shapes[j], 'dot@' + pos[i]]); return m;
    }
  ];

  var ITEMS = [
    /* 1 ラテン方陣：外形×内マーク */
    function () { return latin(['sq', 'ci', 'tri0'], ['dot@C', 'plus', 'x']); },
    /* 2 行の和 */
    function () { return rowOp([[['hl'], ['vl']], [['d1'], ['dot@C']], [['arcN', 'dot@BL'], ['vl']]], union); },
    /* 3 行の排他的論理和 */
    function () { return rowOp([[['hl', 'd1'], ['d1', 'vl']], [['sq', 'dot@C'], ['dot@C', 'x']], [['arcN', 'arcS', 'dot@C'], ['arcS', 'hl']]], xor); },
    /* 4 回転（行方向90°）＋列ごとの点の数 */
    function () {
      var m = [];
      var rows = [['chevN'], ['tri0', 'dot@C'], ['arcN', 'd1']];
      var colDots = [[], ['dot@TL'], ['dot@TL', 'dot@BR']];
      rows.forEach(function (c) { var cur = c; for (var j = 0; j < 3; j++) { m.push(union(cur, colDots[j])); cur = rot90(cur); } });
      return m;
    },
    /* 5 点が時計回りに移動・輪は反時計回り */
    function () {
      var m = []; var cw = ['TL', 'TR', 'BR']; var ccw = ['BR', 'BL', 'TL'];
      var frames = ['sq', 'ci', 'dia'];
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push([frames[i], 'dot@' + cw[(i + j) % 3], 'ring@' + ccw[(i + j) % 3]]);
      return m;
    },
    /* 6 列方向の排他的論理和 */
    function () {
      var top = [['sq', 'hl'], ['ci', 'd1'], ['dia', 'vl']];
      var mid = [['hl', 'vl'], ['d1', 'dot@C'], ['vl', 'x']];
      var m = [];
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push(i === 0 ? top[j] : i === 1 ? mid[j] : xor(top[j], mid[j]));
      return m;
    },
    /* 7 行の共通部分 */
    function () { return rowOp([[['sq', 'hl', 'dot@C'], ['sq', 'vl', 'dot@C']], [['ci', 'd1', 'x'], ['d1', 'x', 'hl']], [['arcN', 'arcS', 'vl', 'dot@TL'], ['arcS', 'vl', 'dot@BR', 'hl']]], inter); },
    /* 8 鏡映：2列目=左右反転、3列目=上下反転 */
    function () {
      var rows = [['chevE', 'dot@TL'], ['tri90', 'dot@BR', 'd1'], ['arcE', 'arcN', 'dot@TR']];
      var m = []; rows.forEach(function (c) { m.push(c, mirH(c), mirV(c)); }); return m;
    },
    /* 9 形のラテン方陣 + 線の数が行方向に増加 */
    function () {
      var shapes = ['sq', 'ci', 'hex']; var lines = ['hl', 'hl2', 'hl3'];
      var m = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push([shapes[(i + j) % 3], lines[j]]);
      return m;
    },
    /* 10 行の和 − 共通部分（＝排他）だが外形は維持 */
    function () {
      return rowOp([[['sq', 'dot@TL', 'dot@BR'], ['sq', 'dot@BR', 'dot@BL']], [['ci', 'hl', 'dot@C'], ['ci', 'dot@C', 'vl']], [['dia', 'd1', 'ring@TL'], ['dia', 'ring@TL', 'd2']]],
        function (a, b) { var outer = a[0]; return [outer].concat(xor(a.slice(1), b.slice(1))); });
    },
    /* 11 全体の90°回転が行方向に連続 */
    function () { return progression([['chevN', 'dot@TL', 'hl'], ['tri0', 'ring@TR', 'd1'], ['arcN', 'arcE', 'dot@BL']], rot90); },
    /* 12 行ごとに要素を加算（2列目=+列固有A、3列目=+列固有B） */
    function () {
      var start = [['sq'], ['ci'], ['tri0']]; var add2 = ['dot@C']; var add3 = ['d1', 'd2'];
      var m = []; start.forEach(function (c) { m.push(c, union(c, add2), union(union(c, add2), add3)); }); return m;
    },
    /* 13 行・列ともに排他が成り立つ（4基底） */
    function () {
      var a = ['hl', 'dot@TL'], b = ['vl', 'dot@TL', 'ring@BR'], c = ['d1', 'hl'], d = ['dot@C', 'vl'];
      var r1 = [a, b, xor(a, b)], r2 = [c, d, xor(c, d)];
      var r3 = [xor(a, c), xor(b, d), xor(xor(a, b), xor(c, d))];
      return r1.concat(r2, r3);
    },
    /* 14 弧が時計回りに1つずつ増える（行）・列で基準位置が回る */
    function () {
      var seq = ['arcN', 'arcE', 'arcS', 'arcW'];
      var m = [];
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) { var c = []; for (var k = 0; k <= j; k++) c.push(seq[(i + k) % 4]); m.push(c); }
      return m;
    },
    /* 15 点の数の加算（行）：3列目 = 1列目の点 + 2列目の点、位置は固定順 */
    function () {
      var order = ['TL', 'TR', 'BR', 'BL', 'C'];
      function dots(n) { return order.slice(0, n).map(function (p) { return 'dot@' + p; }); }
      var rows = [[1, 1], [2, 1], [1, 3]];
      var m = []; rows.forEach(function (rw) { m.push(dots(rw[0]), dots(rw[1]), dots(rw[0] + rw[1])); }); return m;
    },
    /* 16 鏡映＋排他：3列目 = 左右反転(1列目) XOR 2列目 */
    function () {
      return rowOp([[['chevE', 'dot@TL'], ['dot@TR', 'hl']], [['arcE', 'd1', 'dot@BL'], ['d2', 'vl']], [['tri90', 'ring@TR'], ['ring@TL', 'hl', 'dot@C']]],
        function (a, b) { return xor(mirH(a), b); });
    },
    /* 17 三つ組の分配：各行に sq/ci/dia・hl/vl/d1・dot位置3種が一度ずつ（列は不規則） */
    function () {
      return [['sq', 'hl', 'dot@TL'], ['ci', 'd1', 'dot@BR'], ['dia', 'vl', 'dot@TR'],
        ['dia', 'hl', 'dot@BR'], ['sq', 'vl', 'dot@TL'], ['ci', 'd1', 'dot@TR'],
        ['ci', 'vl', 'dot@BR'], ['dia', 'd1', 'dot@TL'], ['sq', 'hl', 'dot@TR']];
    },
    /* 18 回転＋排他：3列目 = 90°回転(1列目) XOR 2列目 */
    function () {
      return rowOp([[['chevN', 'hl'], ['vl', 'dot@C']], [['arcN', 'dot@TL', 'd1'], ['d2', 'dot@TR']], [['tri0', 'ring@BL', 'vl'], ['hl', 'ring@TL', 'x']]],
        function (a, b) { return xor(rot90(a), b); });
    },
    /* 19 2つの内側マークが別々に移動（点は時計回り、小四角は上下）＋外形は列固定 */
    function () {
      var cw = ['TL', 'TR', 'BR', 'BL']; var ud = ['TC', 'BC'];
      var outer = ['sq', 'ci', 'hex'];
      var m = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) m.push([outer[j], 'dot@' + cw[(i * 3 + j) % 4], 'sqm@' + ud[(i + j) % 2]]);
      return m;
    },
    /* 20 3規則：形ラテン＋線の排他＋点が列で増える */
    function () {
      var shapes = ['sq', 'ci', 'tri0'];
      var la = [['hl', 'd1'], ['vl', 'd2'], ['d1', 'd2']]; var lb = [['d1', 'vl'], ['hl', 'd2'], ['d2', 'x']];
      var dots = [[], ['dot@BL'], ['dot@BL', 'dot@BR']];
      var m = [];
      for (var i = 0; i < 3; i++) {
        var l3 = xor(la[i], lb[i]);
        var ls = [la[i], lb[i], l3];
        for (var j = 0; j < 3; j++) m.push([shapes[(i + j) % 3]].concat(ls[j], dots[j]));
      }
      return m;
    },
    /* 21 行の差（1列目 − 2列目） */
    function () {
      return rowOp([[['sq', 'hl', 'vl', 'dot@C'], ['hl', 'dot@C']], [['ci', 'd1', 'd2', 'ring@TL', 'dot@BR'], ['d2', 'ring@TL']], [['arcN', 'arcS', 'arcE', 'arcW', 'dot@C', 'x'], ['arcS', 'arcW', 'x']]], minus);
    },
    /* 22 全体180°回転が列方向・行方向は要素追加 */
    function () {
      // 行方向：要素を1つずつ追加。列方向：90°ずつ回転（セル(i,j) = rot^i(base_j)）
      var b0 = ['chevN', 'dot@TL'];
      var base = [b0, union(b0, ['hl']), union(b0, ['hl', 'ring@BR'])];
      var r1 = base, r2 = base.map(rot90), r3 = base.map(function (c) { return rot90(rot90(c)); });
      return r1.concat(r2, r3);
    }
  ];

  /* ---------- 出題順（難易度4段階） ----------
     L1 単純なパターン（EASY 1〜6）／L2 1規則／L3 2規則・変換／L4 3規則・排他の組合せ */
  var ORDER = [
    { lv: 1, f: EASY[0] }, { lv: 1, f: EASY[1] }, { lv: 1, f: EASY[2] }, { lv: 1, f: EASY[3] }, { lv: 1, f: EASY[4] }, { lv: 1, f: EASY[5] },
    { lv: 2, f: ITEMS[0] }, { lv: 2, f: ITEMS[1] }, { lv: 2, f: ITEMS[6] }, { lv: 2, f: ITEMS[4] }, { lv: 2, f: ITEMS[11] }, { lv: 2, f: ITEMS[14] },
    { lv: 3, f: ITEMS[2] }, { lv: 3, f: ITEMS[7] }, { lv: 3, f: ITEMS[8] }, { lv: 3, f: ITEMS[10] }, { lv: 3, f: ITEMS[13] }, { lv: 3, f: ITEMS[9] },
    { lv: 4, f: ITEMS[12] }, { lv: 4, f: ITEMS[15] }, { lv: 4, f: ITEMS[17] }, { lv: 4, f: ITEMS[19] }
  ];
  function matrixItem(n) { // n: 1..22（出題順）
    var it = build(n, ORDER[n - 1].f());
    it.level = ORDER[n - 1].lv;
    return it;
  }

  global.MX = { drawCell: drawCell, matrixItem: matrixItem, count: ORDER.length, same: same };
})(window);

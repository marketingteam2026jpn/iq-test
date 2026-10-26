# AI-KNOW 脳タイプIQテスト

言葉を使わない図形推理20問で、推定IQ・パーセンタイル・6つの脳タイプを判定する静的サイト。

| ファイル | 役割 |
|---|---|
| `index.html` | LP |
| `quiz.html` | 20問の出題・採点（`QUESTIONS` 配列が問題の正本） |
| `result.html` | 結果表示（無料部分＋有料レポートのロック表示） |
| `figures.js` | 図形をSVGで描画するライブラリ（画像ファイル不使用） |
| `style.css` | 共通スタイル |
| `planning.md` | 設計仕様書（問題構成・配点・IQ変換・脳タイプ判定・課金の切り分け） |

外部依存は Google Fonts のみ。結果は `localStorage.aiknow_iq_result` に保存して result.html が読む。

決済ボタン（result.html の `#buy`）は AI-KNOW 本体への接続待ちで、現状は alert のみ。

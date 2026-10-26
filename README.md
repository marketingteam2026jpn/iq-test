# AI-KNOW IQテスト

40問（図形推理22・数的推理6・言語論理8・記憶4）でIQスコア・パーセンタイル・4領域の認知プロファイルを表示する静的サイト。

| ファイル | 役割 |
|---|---|
| `index.html` | LP |
| `quiz.html` | 40問の出題・採点（文章問題は `QUESTIONS` 配列が正本） |
| `result.html` | 結果表示（σ区分付き正規分布・プロファイル・有料レポートのロック表示） |
| `matrix.js` | 行列推理の問題エンジン（規則から行列と6択をSVGで生成） |
| `style.css` | 共通スタイル |
| `planning.md` | 設計仕様書（問題構成・規則一覧・配点・IQ変換・課金の切り分け） |

外部依存は Google Fonts のみ。結果は `localStorage.aiknow_iq_result` に保存して result.html が読む。
決済ボタン（result.html の `#buy`）は AI-KNOW 本体への接続待ちで、現状は alert のみ。

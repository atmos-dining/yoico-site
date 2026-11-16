# よいコ 公開記録

## 公開方針
- GitHub Pages: https://atmos-dining.github.io/yoico-site/
- 独自ドメインはユーザーの初版確認後に設定。購入済みだがホスト名は未確認。CNAMEはまだ作成しない。
- リポジトリ: atmos-dining/yoico-site
- 予約受付なし。電話はお問い合わせ、地図・Instagramが主要導線。

## 情報確認（2026-11-16）
- Google Maps: https://maps.app.goo.gl/1e6gciR9RLULjyuq7
- Instagram: https://www.instagram.com/yoico_nishijin/
- 食べログ: https://tabelog.com/fukuoka/A4001/A400203/40065397/
- 住所: 福岡市早良区西新5-4-14 A、電話092-836-8775、西新駅徒歩5分。
- 営業時間は情報差あり。Google Maps:火〜日17:00〜24:00、月休み。食べログ:16:15〜24:00、月休み。初版はGBP17:00を採用。独自ドメイン移行前に店舗の正式時間を確認する。
- 現行の商品価格は未確認なので捏造せず、料理紹介・店頭メニュー案内に留めた。
- 写真出典: image-sources.md。実写8点と、実店舗暖簾を参照した演出画像。

## 構成
トップ / おつまみ / お酒 / お知らせ / 記事詳細 / プライバシーポリシー / CMS。
CMSはposts.json単一ファイル方式、Sveltia0.250.2/SRI、DOMPurify/Markedを維持。テスト記事なし。
GitHub Pagesのサブパス対応。独自ドメイン移行時はcanonical/OGP/構造化データ/sitemap/robots/site-configとCMS public_folder、全HTML/partialsのリンクを一括更新する。
共通Workerは古いローカル設定を再デプロイしない。移行時に既存全ホストを保持して新ホストのみ追加する。

## 検証
- 暖簾の既存回帰テスト15件通過（初回の弱い/強い操作、慣性、同一位置からの2回目、タッチ、キーボード、軽減モーション）。
- 初回公開コミット9833bca、GitHub Pages built、HTTPS200、https_enforced=true。独自ドメインなし。
- デスクトップで暖簾初回スクロール→完全開き→同座標の2回目で本文への遷移を確認。アクセス欄の文字色を目視確認。
- 390px iframeでモバイルレイアウトとメニュー展開を確認（ブラウザーviewport機能が反映されなかったためiframeで代替）。
- CMSログイン画面表示とGitHubアカウント選択まで確認。既存共通OAuthアプリのContinue操作が自動承認レビューに拒否されたため認証完了は未確認。ユーザーの明示承認後に再開する。共通Workerは変更していない。

## 計測の保留
GA4新規プロパティ作成は自動承認レビューで明示承認不足として拒否。作成は行っていない。measurementId空欄、他店舗のIDを流用しない。電話/map/Instagramイベントの実装のみ準備済み。新規GA4プロパティ作成のユーザー承認後に設定する。

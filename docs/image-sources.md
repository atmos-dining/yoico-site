# 写真の出典

取得・目視確認: 2026-11-16。ユーザー指定の系列店舗「よいコ」の公開オンライン写真を使用。生成画像ではなく店舗実写。

食べログの店舗メイン写真・店舗紹介写真から取得。外観・料理・ワイン等は `mode=owner`（お店からの写真）一覧でも画像ファイル識別子を照合。メイン写真と一覧で同一画像のディレクトリ番号が異なる場合あり。口コミユーザーの写真は選択していない。

- 店舗ページ: https://tabelog.com/fukuoka/A4001/A400203/40065397/
- お店からの写真: https://tabelog.com/fukuoka/A4001/A400203/40065397/dtlphotolst/smp2/?mode=owner
- 公式外観一覧: https://tabelog.com/fukuoka/A4001/A400203/40065397/dtlphotolst/4/smp2/?mode=owner

|ファイル|内容|元画像URL|
|---|---|---|
|`images/yoico-exterior.jpg`|朱赤の暖簾がある外観|https://tblg.k-img.com/restaurant/images/Rvw/328380/6c2dbd594313f210ebe2e6313c52d202.jpg|
|`images/yoico-wine.jpg`|ワインと料理|https://tblg.k-img.com/restaurant/images/Rvw/269305/69aad7f033fef38c679ba0a93b8378b9.jpg|
|`images/yoico-sangria.jpg`|赤い果実入りドリンクと料理|https://tblg.k-img.com/restaurant/images/Rvw/328380/b1d16e1f4d3fc6e2c5f5c40c5d993702.jpg|
|`images/yoico-interior.jpg`|営業中のカウンターと店内照明|https://tblg.k-img.com/restaurant/images/Rvw/328380/12c8e6006e9047250d11a15d1b3e1fc1.jpg|
|`images/yoico-polpettini.jpg`|ポルペッティーニ|https://tblg.k-img.com/restaurant/images/Rvw/269305/3afc80ffdd4a32b42646ba4e50d4ee98.jpg|
|`images/yoico-pasta.jpg`|パスタとワイン|https://tblg.k-img.com/restaurant/images/Rvw/328380/8b4e03934b3efe84308b218eb48efc2e.jpg|
|`images/yoico-counter.jpg`|店舗紹介「空間」のカウンター写真|https://tblg.k-img.com/restaurant/images/Rvw/269305/90298536fa8d52c9b37235312d97cbb3.jpg|

ピンチョス写真追加: `images/yoico-pinchos.jpg` — https://tblg.k-img.com/restaurant/images/Rvw/234065/0197f27ab9b7c0e93c6502de47f8c168.jpg （料理カテゴリのお店からの写真）

## 暖簾の目視記録

- 朱赤〜朱橙色の布。横長で4分割の垂れ。
- 白い丸みの強いバブル状ロゴ。左に日本語「よいコ」を縦方向に配し、上部に欧文yoicoが右に伸びる一体的な構成。
- 右端下寄りに白い小文字で `yoico / is / “NOT” / good / kids`。
- 夜景画像の色は照明に影響されるため、GBPの店舗説明「朱赤ののれん」と併せて色を判断。

## 暖簾の演出画像
- `images/noren-design.jpg`: 上記の実店舗外観写真を参照して画像生成で正面の暖簾を再構成。実写店舗写真ではなくWeb演出用。4枚垂れ、朱橙色、白いバブル文字、右端スローガンを再現。

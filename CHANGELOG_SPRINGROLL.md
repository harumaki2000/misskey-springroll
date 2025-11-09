## v1.7.0

### Client
- Feat: NowPlayingウィジェットを追加

## v1.6.9

### Client
- Enhance: 地震情報ウィジェットのコードを書き直し

## v1.6.8

### Server
- Fix: ノートの時間指定削除を動くように  
 
## v1.6.7

### Client
- Enhance: 天気予報ウィジェットをlqvp/misskey-tempuraのコードに変更

https://github.com/lqvp/misskey-tempura/blob/develop/packages/frontend/src/widgets/WidgetWeather.vue

## v1.6.6

### Server
- Fix: notificationTypesの定義漏れを修正

[fix(misskey-js): notificationTypesの定義漏れを修正](https://github.com/harumaki2000/misskey-springroll/commit/2f612798f2f6e4906d26942247c977e8cb90366d)

## v1.6.5

### Client
- Fix: いいねボタンの挙動の修正

[fix(frontend): いいねボタンを押した際、UI上の表示が消えるように](https://github.com/harumaki2000/misskey-springroll/commit/bd91f816ba0b3bb30682dc374d8c6ca512d4b1a9)

## v1.6.4

### Server
- Fix: 登録申請時のメールの文章を修正

[fix(backend): 登録申請時のメールの文章を修正](https://github.com/harumaki2000/misskey-springroll/commit/40a397ad8f2707b76188ac4cd3d0d7da1166edaa)


## v1.6.3

### Client
- Enhance: 申請承認制をオンにした際、申請理由を必須項目に
- 申請承認制の説明文を変更

### Server
- Enhance: 申請承認制をオンにした際、申請理由を必須項目に

[enhance(locales): 申請承認制の説明文を変更](https://github.com/harumaki2000/misskey-springroll/commit/8e0ff403c405817be66ba8cb8b2baaf419557ab0)

[enhance(backend): 申請承認制をオンにした際、申請理由を必須項目に](https://github.com/harumaki2000/misskey-springroll/commit/0d8b78f5d1d3f08f2aa9ce3a6c281d3df0564db6)

[enhance(frontend): 申請承認制をオンにした際、申請理由を必須項目に](https://github.com/harumaki2000/misskey-springroll/commit/efd65115583c30c370d41208ac7e543436d07387)


## v1.6.2

### Server
- Fix: 申請の承認時に、新しく作成されたユーザーアカウントに申請時のメールアドレスを書き込む処理が抜けていたため修正

[fix(backend): 承認済みユーザーのメールアドレスが設定されない問題を修正](https://github.com/harumaki2000/misskey-springroll/commit/e1335294cbbfbd3e0a5e3eff0244f3463c8f721b)


## v1.6.1

### Client
- Feat: 管理者が登録申請を管理し、ユーザーが申請を行えるUIを実装
- Feat: 管理者用の申請一覧・承認ページを作成
- Feat: モデレーション設定に機能のON/OFFスイッチを追加
- Feat: 新規登録フォームを申請承認制に対応

### Server
- Feat: 申請承認制機能のバックエンドを実装

[feat(backend): 申請承認機能のバックエンドを実装](https://github.com/harumaki2000/misskey-springroll/commit/1296f3430f59f5ae7723ca664838e72f02d10bd0)

[feat(frontend): 申請承認機能のUIを実装](https://github.com/harumaki2000/misskey-springroll/commit/6922c6fcad029f6a688198d6f0759444db16a42e)

## v1.6.0

### Client
- Feat: 天気予報ウィジェットの追加

https://github.com/harumaki2000/misskey-springroll/commit/04d8eca5b4b208024f92d475aadb5b99f0aeef21


## v1.5.9

### Client
- Fix: 開発環境でToDoリストウィジェットとメモウィジェットが読み込めない問題の修正

https://github.com/harumaki2000/misskey-springroll/commit/11fc030b4f1d3498f8afe0d2c5404f4a6999325b


## v1.5.8

### Server
- Enhance: 相互タイムラインのパフォーマンス向上 + パラメータ周りの反映

https://github.com/harumaki2000/misskey-springroll/commit/e5d5274fed83f2be9d86be1805a03da7d7d17738


## v1.5.7

### Client
- Fix: 相互フォロータイムラインが表示されない問題の修正

https://github.com/harumaki2000/misskey-springroll/commit/bd7fbf64b82dcfa58f70a05f587c4532e780c60d


## v1.5.6

### Client
- Fix: ウィジェットを閉じてもタイマーがリセットされないように

https://github.com/harumaki2000/misskey-springroll/commit/8d8cfc7afff354b0be2fe6c999d063ae140d42f4


## v1.5.5

### Client
- Feat: タイマーウィジェットの追加

https://github.com/harumaki2000/misskey-springroll/commit/169622fdc15d52b21bd200af2e72ce3558866f76


## v1.5.4

### Client
- Enhance: 相互フォロータイムラインの調整

https://github.com/harumaki2000/misskey-springroll/commit/4ee0fa55477b52d2b12e1bd391b354502deb290d


## v1.5.3

### Client
- Enhance: 相互フォロータイムラインの調整

https://github.com/harumaki2000/misskey-springroll/commit/4d05b1618f3778e9864c51b6af6c61344edd1504


## v1.5.2

### Server
- Enhance: フォロー解除 / ブロック通知周りのコードが読みづらいのを修正

https://github.com/harumaki2000/misskey-springroll/commit/bfbf0ac68bcd62277366f501392cadd33fe27fb7


## v1.5.1

### Server
- Enhance: フォロー解除 / ブロック通知周りの修正

https://github.com/harumaki2000/misskey-springroll/commit/8074002d7abc7d71feb624bb8c59dfd0e2fc191f


## v1.5.0

### Client
- Enhance: フォロー解除 / ブロック通知にユーザー名を表示するように

https://github.com/harumaki2000/misskey-springroll/commit/3a55ae282ec0b83d07456c10451b9554d6679b82


## v1.4.9

### Client
- Enhance: フォロー解除 / ブロック通知の表示修正

https://github.com/harumaki2000/misskey-springroll/commit/6c023d1388059252152e588099b61bc1b295f3a6


## v1.4.8

### Client
- Fix: フォロー解除 / ブロック通知の設定に何も表示されない問題を修正

### Server
- Fix: ユーザーをブロックできない問題の修正

https://github.com/harumaki2000/misskey-springroll/commit/c8705a2cea1b30a6bd2de14c782840c46791e099


## v1.4.7

### Server
- Feat: フォロー解除、ブロックされた際に通知をするように

https://github.com/harumaki2000/misskey-springroll/commit/4465eb1c68b1cf3faa5fe01c7fdf436d9456a4a4


## v1.4.6

### Client
- Enhance: 時間指定削除が有効になっているノートに削除予定日時を表示するように

https://github.com/harumaki2000/misskey-springroll/commit/2714f61c4736efaac907ae9d580f87910aac2a42


## v1.4.5

### Server
- Fix: 相互フォロータイムラインがリアルタイム更新されるように

https://github.com/harumaki2000/misskey-springroll/commit/518d66e10acc1ab718c3804e7b7f0613e61561c1
https://github.com/harumaki2000/misskey-springroll/commit/214ac69c14aa55521549975f6dcc5ff97e309d6b


## v1.4.4

### Client
- Feat: 相互フォロータイムラインを追加

https://github.com/harumaki2000/misskey-springroll/commit/1c0c3e024a41e9193173aea9bb3427f0911a21b1


## v1.4.3

### Client
- Enhance: 時間指定削除が有効になっているノートに表示されるアイコンのホバー時に削除予定日時を表示するように

https://github.com/harumaki2000/misskey-springroll/commit/f9607971e94f32d85ce5eb5758f3f8e53333fb17


## v1.4.2

### Client
- Enhance: 時間指定削除が有効になっているノートのアイコン表示位置調整
- Enhance: ノートの時間指定削除機能に30日間の期限を設定

https://github.com/harumaki2000/misskey-springroll/commit/01d26eb7c803960be5664f79c9c545419a4fc542
https://github.com/harumaki2000/misskey-springroll/commit/d5789a5eb19cc1322f72bfb259d3171e2195e7cf


## v1.4.1

### Client
- Enhance: 時間指定削除が有効になっているノートにアイコンを表示するように

https://github.com/harumaki2000/misskey-springroll/commit/b3690d4d1319d883b6b2f3d5b4c13c112a38b79e


## v1.4.0

### Client
- Enhance: ノートの時間指定削除機能に日時設定を追加

https://github.com/harumaki2000/misskey-springroll/commit/6bc0d37646e30897a7f10b40290e0d3c7164aa5a


## v1.3.9

### Client
- Enhance: ノートの時間指定削除機能に時間制限を追加

https://github.com/harumaki2000/misskey-springroll/commit/75337724e4ac8e368f288f5004780aeac7bb4da7


## v1.3.8

### Client
- Enhance: ノートの時間指定削除が有効になっているノートの表示をわかりやすく

https://github.com/harumaki2000/misskey-springroll/commit/1a06396cf49727a51da76964f5c975c2126f4955


## v1.3.7

### Server
- Feat: ノートの時間指定削除機能を追加

https://github.com/harumaki2000/misskey-springroll/commit/0822663c44ec82ddb6fccd085f8f9152b4cad316
https://github.com/harumaki2000/misskey-springroll/commit/6abe1471d8ed0cce4a7e25283fefd0f240b394af
https://github.com/harumaki2000/misskey-springroll/commit/30f4016f05a17f803da6c3b6a0b9957297a4ec85
https://github.com/harumaki2000/misskey-springroll/commit/e275b1fab6c31be6abee2906b53bce916430efa1
https://github.com/harumaki2000/misskey-springroll/commit/862caf486f3c3c66e05b39ee2e494441866613d6
https://github.com/harumaki2000/misskey-springroll/commit/defa8660d1deb195968e2132a979333bd2ed2271
https://github.com/harumaki2000/misskey-springroll/commit/385566c31161b0ecb4ab4ce160d25f435d96977e


## v1.3.6

### Client
- Fix: お気に入りリアクションボタンの追加修正

https://github.com/harumaki2000/misskey-springroll/commit/cacdb2f186d00813553bad106987f3d5c11ef42b


## v1.3.5

### Client
- Enhance: WelcomePageのリポジトリURLをmisskey-springrollに変更

https://github.com/harumaki2000/misskey-springroll/commit/bb409534f9f159244747b9a6a7cba52deb58f77a


## v1.3.4

### Client
- Enhance: ワンタップでリアクションできるように変更

https://github.com/harumaki2000/misskey-springroll/commit/310bdfee7773af07a172d5d3eb81cb2a2736a46d


## v1.3.3

### Client
- Enhance: お気に入りをワンタップでできるように

https://github.com/harumaki2000/misskey-springroll/commit/253b21c26564e1dc4b1f83a51701e496b0265681


## v1.3.2

### Client
- Fix: 地震情報ウィジェットが正しく情報を拾うように修正

https://github.com/harumaki2000/misskey-springroll/commit/ae12abdd5bab551e806fc6e22e4cfd85ddb7ce04


## v1.3.1

### Client
- Enhance: 地震情報ウィジェットの不要な行を削除

https://github.com/harumaki2000/misskey-springroll/commit/6512f6e86cd714fdf55dc8524a82eb1074aa187b


## v1.3.0

### Client
- Enhance: 地震情報ウィジェットの表示修正

https://github.com/harumaki2000/misskey-springroll/commit/f3bc516d4fcbcc01961f06e33bf8ad3694c51d61


## v1.2.9

### Server
- Enhance: バージョン表示をspringrollに変更

https://github.com/harumaki2000/misskey-springroll/commit/dd943c31f613f6cd2cf2e1197e3403b14a70272b


## v1.2.8

### Client
- Enhance: ロード画面の表示をmisskey2000に変更

https://github.com/harumaki2000/misskey-springroll/commit/263d2ae13f9204666a899b7b9b8e3994bd6e6499


## v1.2.7

### Client
- Feat: systemd風のロード画面を出すように

https://github.com/harumaki2000/misskey-springroll/commit/f998f2a959c8d0a39b1fb5f149a42952c0f89120
https://github.com/harumaki2000/misskey-springroll/commit/f5a02c806a0b0825422836fad29a81f433541eaa


## v1.2.6

### Client
- Fix: カウンターウィジェット、ToDoリストウィジェットの保存機能修正
- Fix: 地震情報ウィジェットが正しく情報を拾うように修正

https://github.com/harumaki2000/misskey-springroll/commit/df035312978077fb8fbf665bb4a266352dc59ebc
https://github.com/harumaki2000/misskey-springroll/commit/8411119a935caf05938fb9dbbf6b302d543a46a3


## v1.2.5

### Client
- Fix: プラグイン周りの修正
- Removed: NowPlayingウィジェットの削除

https://github.com/harumaki2000/misskey-springroll/commit/dbd26081f8309ee54fde1ff4257c85b07d670133
https://github.com/harumaki2000/misskey-springroll/commit/7ec6c3db085e97078d1623953fda3aa72b4e7359


## v1.2.4

### Client
- Fix: 地震情報ウィジェットの修正

https://github.com/harumaki2000/misskey-springroll/commit/d3922662c6cb0737e62ab5b7d206b84f8fb2419c


## v1.2.3

### Client
- Fix: 地震情報ウィジェットの修正

https://github.com/harumaki2000/misskey-springroll/commit/709bab59931509155b0e5391b0de82e082ce6f43


## v1.2.2

### Client
- Fix: 地震情報ウィジェットの修正

https://github.com/harumaki2000/misskey-springroll/commit/9816fa6abdf5a8ec4d58cfdd3a980a76bd303930


## v1.2.1

### Client
- Fix: 地震情報ウィジェットの修正

https://github.com/harumaki2000/misskey-springroll/commit/808a837f74a7764c5a51fca60f01b0cd6fde5c33


## v1.2.0

### Client
- Enhance: 地震情報をWebSocketで取得するように戻した

https://github.com/harumaki2000/misskey-springroll/commit/b027ae14f05e94e1759b7fabd93f5622d57ab218


## v1.1.9

### Client
- Enhance: 地震情報ウィジェットの仕様を元の仕様に

https://github.com/harumaki2000/misskey-springroll/commit/e31ce6ca1c2a4fa4a1d94253a6dbc896e2ffbb5c


## v1.1.8

### Client
- Enhance: 地震情報ウィジェットのローディング表示時間の調整

https://github.com/harumaki2000/misskey-springroll/commit/4b7a158fef2e4676b429f33b946df9bafcd715c9


## v1.1.7

### Client
- Fix: 地震情報ウィジェットの修正

https://github.com/harumaki2000/misskey-springroll/commit/37812797af093d6d6a3d6caf4f52e22fe85d02b9


## v1.1.6

### Client
- Enhance: 地震情報をWebSocketで取得するように
- Fix: ToDoリストウィジェットのタイプミス修正

https://github.com/harumaki2000/misskey-springroll/commit/f6f3f7f34f3fe606f96d2b278a7a88908e80190c
https://github.com/harumaki2000/misskey-springroll/commit/9b3209b715f868f006d14f9fd86593d18fc33eab


## v1.1.5

### Client
- Enhance: ToDoリストウィジェットの表示改善

https://github.com/harumaki2000/misskey-springroll/commit/515f9ed50452ff7440951741e602edc8c27c6ae9


## v1.1.4

### Client
- Enhance: ToDoリストウィジェットの表示改善

https://github.com/harumaki2000/misskey-springroll/commit/d93d37bbb7f3f7c0eff155176f23ac7305a9a1e0


## v1.1.3

### Client
- Fix: 表示崩れの修正

https://github.com/harumaki2000/misskey-springroll/commit/e658dd093ae80690ac3ff43e29a51c1b6682621c


## v1.1.2

### Client
- Feat: ToDoリストウィジェットの追加

https://github.com/harumaki2000/misskey-springroll/commit/1284d3214e2aca51a5eb48290735ff384f89e596


## v1.1.1

### Client
- Fix: 地震情報ウィジェットでマグニチュードが表示されない問題を修正

https://github.com/harumaki2000/misskey-springroll/commit/0ca4f0d1dfff1e5923f6ffdccae399f00935b420


## v1.1.0

### Client
- Enhance: 地震情報ウィジェットにローディング表示をするように
- Fix: 地震情報ウィジェットのkmの表示が二重になるため修正

https://github.com/harumaki2000/misskey-springroll/commit/40e6ec258c919582945a788ed82bd3a680a989bb
https://github.com/harumaki2000/misskey-springroll/commit/8db7592bfe1c53148418c8ab50053824539649f1


## v1.0.9

### Client
- Fix: 地震情報ウィジェットが一部環境で更新できない問題を修正

https://github.com/harumaki2000/misskey-springroll/commit/e0b6944101040e3c00ec4ffc3902cdd6b3117bf8


## v1.0.8

### Client
- Fix: 地震情報ウィジェットの表示を修正

https://github.com/harumaki2000/misskey-springroll/commit/99f12d14e6829dd46c3236569dafe3c72f335265


## v1.0.7

### Client
- Enhance: 地震情報ウィジェットのURLを修正

https://github.com/harumaki2000/misskey-springroll/commit/6d45ee48eafab26a5a35372570318ab893226b6a


## v1.0.6

### Client
- Enhance: 地震情報ウィジェットの修正

https://github.com/harumaki2000/misskey-springroll/commit/94bc5fbaf42b684d114735aed41b6bce2482a296


## v1.0.5

### Client
- Fix: `index.ts`の記入漏れを修正

https://github.com/harumaki2000/misskey-springroll/commit/5bd7d4d04e4a026bf4d8829582d691baecf9e1a8


## v1.0.4

### Client
- Feat: 地震情報ウィジェットの追加

https://github.com/harumaki2000/misskey-springroll/commit/4f429d5a7b93457689828cff25e60294798cbfa8


## v1.0.3

### Client
- Fix: カウンターウィジェットの保存が機能しない問題を修正

https://github.com/harumaki2000/misskey-springroll/commit/81b894e1c9b09b34e1851069c8e9e7e307565764


## v1.0.2

### Client
- Feat: カウンターウィジェットを追加

https://github.com/harumaki2000/misskey-springroll/commit/efacfd8a3731ddf6fd5293c45364aa213054fc6e
https://github.com/harumaki2000/misskey-springroll/commit/19f9a4bf56420b2221cdd1968502919be5b5f513


## v1.0.1

### Client
- Feat: 音楽を投稿できるNowPlayingウィジェットを追加

https://github.com/harumaki2000/misskey-springroll/commit/4a7e8771e899056edede2fca83cb75bc0969d7a9

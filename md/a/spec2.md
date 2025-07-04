# テキストベース人間関係シミュレーション仕様書 (2025年更新版)

## 🧭 概要

- **ジャンル**：テキストベースの生活・人間関係シミュレーション
- **プレイヤーの立場**：登場人物たちを見守る「管理人」(メタ越しの上位存在)
- **主な特徴**：画像やアバターなし。性格や関係性に基づく会話やイベントが中心
- **時間制御**：ゲーム内の時間は現実時間と同期
- **目標**：AIを活用して、個性や関係性の変化を観察・記録しながら、感情豊かな人間模様を楽しむ

---

## 🔧 システム構成

### キャラクター構造

- 名前
- 年齢（任意）
- 性別（任意）
- 性格（MBTI + 質問式スライダーによる推定 or 直接指定）
- パラメータ（以下5項目：1〜5段階）
  - 社交性
  - 気配り傾向
  - 頑固さ
  - 行動力
  - 表現力
- 話し方（砕けた／ていねい語など）
- 興味・関心
- 好感度（片方向 A→B）：-100 〜 +100
- 信頼度（A→プレイヤー）：初期値は性格により30〜70、最大100
- 関係タグ：定義不可な空間の理解に使われるメタデータ（先輩後輩／親子／兄弟姉妹／従兄弟など）

---

## 🧩 関係性モデル

### 🏷 関係ラベル（双方向同値 / 全6段階）

1. なし
2. 認知
3. 顔見知り
4. 友達
5. 親友
6. 恋人

- 関係ラベルは何かのイベント経由で変化する。
- 「親友」「恋人」のラベル変化はプレイヤー関与型イベントのみ

### ✨ 特別関係ラベル（双方向）

- 家族（親／子／兄弟姉妹／従兄弟）
- 初期セットで明示された場合のみ指定可
- 通常の関係ラベルと互いに強化される情報として扱う

### 🌛 感情ラベル（片方向 / 1人1つ）

- 普通

- 気になる

- 好きかも

- 嫌いかも

- 気まずい

- やりとりや時間経過で変化

---

## 💬 好感度・信頼度

### 好感度 (A → B / -100 〜 +100)

- 初期値は0
- 会話やイベントで増加
- 3日以内に接触あり：減少なし
- 7日以内に接触あり：-1
- 8日以上接触なし：-2

### 信頼度 (A → プレイヤー / 0 〜 100)

- 初期値：性格により30〜70の間で指定
- 助言成功時：SYSTEMのログに「信頼度が上昇しました。」と表示
- 助言失敗時：「信頼度が下降しました。」と表示
- 変化量は具体数値を表示せず
- 助言の結果は後日のキャラの反応にも反映

---

## 🤖 GPT活用と会話生成

- GPT APIを用いて、自然な会話・ログを生成
- プロンプトには、性格、関係性、時間帯、好感度、信頼度などを反映
- プレイヤーとのやりとりは、定型文スロット＋単語穴埋め式

---

## 🕒 時間とイベント管理

- 時間進行：現実の時間と同期
- イベント種別
  - プレイヤー関与型（困りごとイベント）
  - 非関与型（初対面／雑談／思い出し／二人きりなど）

### プレイヤー関与型：困りごとイベント

- 起動時に2件発生、その後は最大3件追加（最大5件/日）
- 発生通知はログ外、実際の応答のみログ記録

### プレイヤー非関与型

| 種類      | 発生条件                                          |
| ------- | --------------------------------------------- |
| 初対面     | 関係ラベルが「なし」または「認知」                             |
| 雑談      | 関係ラベルが「友達」以上                                  |
| 思い出し会話  | 関係ラベルが「親友」以上＋好感度に依存                           |
| 二人きりの時間 | 感情ラベルに依存（「気になる」「好きかも」は発生率↑、「嫌いかも」「気まずい」は発生率↓） |

---

## 🗒 ログと日報

### ログ表示仕様（CLI風）

- 表示形式：

```
[08:42] EVENT: 莉音と咲が会話中…
            莉音「ねぇ、あの本、読んだ？」
            咲「えっ、まだだけど、面白かった？」
[08:45] SYSTEM: 信頼度が上昇しました。
[08:47] SYSTEM: 莉音→咲の感情ラベルが「気になる」に変化しました。
```

- EVENT行／セリフ／SYSTEM行すべてに**タイピング風（1文字ずつ）表示**を適用
- SYSTEM: の文字のみ**橙系で強調表示**（例：#FFA500）
- 未読ログは画面下部で「未読があります」などのマークで示す（スクロールで解除）

### 日報

- 毎日0:00切り替えで自動生成
- 表示内容は `EVENT`／`SYSTEM` のみ（セリフ省略）
- キャラ別・種別・日付でフィルタ可能（初期状態では日付フィルタON）

---

## 🎮 プレイヤー機能

- キャラ追加・編集・削除
  - 入力項目は折りたたみ式で一画面表示
  - MBTI診断は「直接選択」か「質問形式（スライダー）」から選べる
  - 他キャラとの初期関係性設定が可能（親・子・兄弟姉妹・従兄弟・幼なじみ・友人・親友・先輩後輩・元恋人）
  - 関係設定に応じて、初期の関係ラベル・感情ラベル・好感度を自動生成
- 任意の2キャラ間の会話を指示可能
- プレイヤーとの会話（助言・雑談）
- キャラステータス画面で好感度・信頼度・関係・感情を確認可能（数値はここで表示）

---

## 🛠 技術メモ

- データ保存形式：JSON（キャラ、関係、ログなど）
- GPT-3.5／GPT-4oに対応（切り替え可能）
- UI設計：ログ表示はCLI風。各行のアニメーション、未読マーク、セリフ分割対応
- 信頼度・好感度の変化数値は内部管理とステータス画面表示のみ。ログでは簡潔な変化通知のみ

---


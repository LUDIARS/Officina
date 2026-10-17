# Officina — Codex制作工房

ゲーム本体を丸ごと持ち込まず、必要な資料だけで制作・検証・受け渡しを行うためのスキル集です。Blenderモデリング、重いレンダリング、ビルド・テスト、学習を対象にします。

## 使い方

1. このリポジトリを作業場所として開き、`AGENTS.md` を読ませます。スキルの正本は `.agents/skills/` です。
2. `templates/brief.md` をGit管理外の `work/<job-id>/brief.md` にコピーして、今回の依頼を記録します。未定の項目は未定のまま残し、その項目が必要な工程で確認します。
3. 次のように依頼します。

   > $production-workflow Tokyo2070向けのビルを一棟作って。資料と成果物はSynergos、使えなければ指定のGoogle Driveフォルダを使う。指定したDiscordスレッドで確認して。三面図・コンセプトアートがなければ要求し、反証役のレビューを受けて修正して。

4. モデル制作なら三面図やコンセプトアートを確認し、粗い形→途中画像→反証レビュー→修正→成果物返却と進みます。ビルドや学習には不要な画像資料を要求しません。

## スキル

| スキル | 担当 |
|---|---|
| `production-workflow` | 依頼ごとの条件、進行、確認と完了判定 |
| `model-reference` | 三面図・コンセプトアートの要求と読み取り、画像による品質確認 |
| `adversarial-review` | 独立したLLMによる反証、修正と再確認 |
| `artifact-exchange` | Synergos優先、Google Drive代替のデータ受け渡し |
| `discord-coordination` | 作業専用フォーラムスレッドでの進捗・画像・確認事項 |

## 実行環境に渡すもの

今回の仕事の説明、対象データ、受け渡し先、Discordのスレッドと回答者を渡します。接続資格は実行環境の秘密設定へ入れ、リポジトリや依頼本文には書きません。

- Synergos: 接続済みの専用共有領域、または管理側が発行する用途限定の取得・送信手段。
- Google Drive: Synergosが使えない場合の指定フォルダと、利用可能な接続ツール。共有範囲を勝手に公開へ変更しません。
- Discord: `CC_DISCORD_THREAD_ID` と、そのスレッドへの投稿手段。Webhookを使う場合は `CC_DISCORD_WEBHOOK_URL`。回答取得には別途Cc・Discord接続ツール、または人間による回答の中継が必要です。
- 反証役: 独立したLLMへの委託手段。利用できなければ自己レビューを独立レビューと偽らず、未実施とします。

Blender・GPU・ネットワーク接続は毎回実環境で確認します。環境名やログインだけで利用可能とは判定しません。

## データの置き方

`work/<job-id>/` に brief、inputs、source、previews、outputs、reviews、receipts を置きます。この領域はGit管理外です。大きなゲーム本体や学習データをこのリポジトリへ追加しません。対象・容量・成果物名は仕事ごとに決めます。

受け渡し用の記録は `templates/artifact-manifest.json`、反証役への依頼は `templates/critic-prompt.md`、人間への質問は `templates/question.md` を使えます。

## 導入と検証の区別

このリポジトリは**スキルと運用手順の定義**です。常駐サーバ、自動投稿ボット、Google Drive認証、Synergos管理APIの新規実装は含みません。接続設定・実行環境への導入・実際の制作と配達は別途実環境で確認します。詳細は `spec/design.md` と `docs/connection-check.md`。

Codexの配置形式は[公式スキル資料](https://learn.chatgpt.com/docs/build-skills)と[AGENTS.md資料](https://learn.chatgpt.com/docs/agent-configuration/agents-md)に基づきます。

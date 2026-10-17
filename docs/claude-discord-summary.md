# Claudeの最終報告をDiscordへ送る

Officinaの `.claude/settings.json` は `Stop` フックを登録しています。Node.js 20以上が必要です。新しいクラウドセッションでこの設定を読み込みます。現在進行中のセッションへの反映は保証しません。

Webhookと投稿先スレッドはCcが用意してCloudに渡します。利用者がCloudの環境設定へ毎回手入力する運用ではありません。Officinaには受け取り・投稿用の専用ツールを同梱しています。

1. Ccは承認済みの非公開の受け渡し経路でWebhookと既存スレッドIDをCloudへ渡します。Ex Vaultへの保存だけでCloudに届くわけではありません。
2. Cloudは `node scripts/discord-summary/tool.mjs bind` を実行し、標準入力にJSONの `webhook_url` と `thread_id` を渡します。秘密値をコマンド引数、Git、公開の依頼文、診断ログへ残しません。
3. その後のStopフックは登録先へ最終応答を送ります。明示的に送る場合は `node scripts/discord-summary/tool.mjs publish` の標準入力へ `session_id` と `summary` を渡します。同じ内容の二重投稿を避けるため、Stopと同じセッションIDを使います。

登録先はGit対象外の `work/discord-summary/destination.json` です。Cloudの作業フォルダを依頼ごとに分離してください。一度登録した別の投稿先への変更は拒否します。終了時に秘密設定を含む作業フォルダを破棄し、秘密のない配達記録だけ保管します。CcからCloudへの実際の受け渡しとDiscord配達は別途確認が必要です。

既存の環境変数 `CC_DISCORD_WEBHOOK_URL` / `CC_DISCORD_THREAD_ID` も利用できますが、登録済みの投稿先と異なる場合は送信しません。Webhookは指定フォーラムに属するもの、thread IDはその中の既存スレッドを使います。

ネットワーク設定で `discord.com` へのHTTPS通信を許可します。URLは `/api/webhooks/<id>/<token>` または `/api/v10/webhooks/<id>/<token>` 形式です。別サイト、別スレッドへのリダイレクトは拒否します。

最終応答だけを送信し、長ければ summary.txt として添付します。会話履歴・ツール出力・思考過程は収集しません。最終応答は人に共有できる内容にしてください。既知の秘密値を伏せる処理はありますが、任意の機密情報を完全に判別する機能ではありません。

受信した投稿は「作業報告」であり、作業全体の成功を保証しません。Webhookは返信を読みません。確認事項への回答は別の読み取り経路または人間の中継が必要です。

送信記録はGit対象外の work/discord-summary/ にあります。deliveredだけがDiscordのmessage IDとthread IDを照合済みです。delivery_unknownは送信済みの可能性があるため、スレッドの実投稿を照合してください。同じ報告の再実行では自動再送しません。rejectedでも設定修正後の再送は人間による照合が必要です。既存の記録を機械的に消さないでください。

ローカル試験は通信を模したクライアントで検証します。実際のクラウド・Discord配達はWebhook設定後に別途確認してください。

仕様: [Discord summary](../spec/discord-summary.md)。公式資料: https://code.claude.com/docs/en/hooks 、https://docs.discord.com/developers/resources/webhook#execute-webhook 。

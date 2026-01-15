# DevContainer セットアップガイド

Claude Code を安全に使用するための devcontainer 環境を提供します。

## 目的

この devcontainer は、Claude Code（`--dangerously-skip-permissions`）をエージェント運用（無人実行）で現実的に使用できるようにするためのものです。

### 主な特徴

- **Secure-by-default**: 起動時に outbound ファイアウォールが有効化
- **Deny-by-default**: allowlist にないドメインへの接続をブロック
- **永続化**: Claude の設定とシェル履歴がコンテナ再作成後も維持
- **診断ツール**: トラブルシューティング用の make targets

## 起動手順

### VS Code

1. [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) をインストール
2. リポジトリを開く
3. コマンドパレット（`Cmd/Ctrl + Shift + P`）で「Dev Containers: Reopen in Container」を選択
4. ビルド完了後、自動的にファイアウォールが適用される

### Cursor

1. リポジトリを開く
2. コマンドパレットで「Dev Containers: Reopen in Container」を選択
3. ビルド完了後、自動的にファイアウォールが適用される

### Dev Container CLI

```bash
# インストール
npm install -g @devcontainers/cli

# 起動
devcontainer up --workspace-folder .

# 接続
devcontainer exec --workspace-folder . bash
```

## 永続化

### Claude 設定

- **保存場所**: `/home/node/.claude`
- **永続化方法**: named volume (`devcontainer-claude-config-${devcontainerId}`)
- **環境変数**: `CLAUDE_CONFIG_DIR=/home/node/.claude`

Claude の認証情報、設定ファイルはコンテナを Rebuild しても維持されます。

### シェル履歴

- **保存場所**: `/commandhistory/.bash_history`
- **永続化方法**: named volume (`devcontainer-bashhistory-${devcontainerId}`)

### Git 設定の共有

ホストマシンの Git 設定（`user.name`, `user.email`）は自動的にコンテナ内に共有されます。

**仕組み:**

- `ghcr.io/devcontainers/features/common-utils` feature がホストの Git 設定を転送
- `ghcr.io/devcontainers/features/git` feature で最新の Git をインストール

**確認方法:**

```bash
# コンテナ内で実行
git config --global user.name
git config --global user.email
```

### GitHub CLI 認証

ホストマシンの `gh auth` 認証情報は自動的にコンテナ内に共有されます。

**前提条件:**

ホストマシンで GitHub CLI にログイン済みであること:

```bash
# ホストマシンで実行
gh auth login
gh auth status  # 確認
```

**コンテナ内での確認:**

```bash
# コンテナ内で実行
gh auth status
```

**仕組み:**

1. DevContainer 起動時に `initializeCommand` でホスト側の `gh auth token` を取得
2. 取得したトークンを `.devcontainer/.env.devcontainer` に書き出し
3. `--env-file` オプションでコンテナに `GH_TOKEN` 環境変数として渡す
4. `ghcr.io/devcontainers/features/github-cli` feature で `gh` コマンドをインストール

**関連ファイル:**

- `.devcontainer/init-gh-token.sh` - トークン取得スクリプト
- `.devcontainer/.env.devcontainer` - 生成されるenv ファイル（gitignore済み）

### SSH Agent Forwarding

ホストマシンの SSH 鍵をコンテナ内で使用して `git push` できます。

**前提条件（ホストで実行）:**

```bash
# SSH agent に鍵が登録されているか確認
ssh-add -l

# もし "The agent has no identities." と出たら鍵を追加
# macOS の場合
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
# または
ssh-add ~/.ssh/id_rsa
```

**コンテナ内での確認:**

```bash
# SSH agent が転送されているか確認
ssh-add -l

# GitHub への接続テスト
ssh -T git@github.com
```

**仕組み:**

- ホストの `SSH_AUTH_SOCK` をコンテナにマウント
- コンテナ内の `SSH_AUTH_SOCK` 環境変数でソケットを参照
- SSH 鍵自体はホストにあり、コンテナには転送されない（セキュア）

## ファイアウォール

### モード

| モード | 説明 |
|--------|------|
| `strict`（デフォルト） | 全ての allowlist ドメインが解決できない場合、初期化失敗 |
| `balanced` | DNS 解決に失敗してもエラーにならず続行 |

モード変更:

```jsonc
// .devcontainer/devcontainer.json
"containerEnv": {
  "DEVCONTAINER_FIREWALL_MODE": "balanced"
}
```

### Allowlist 変更

[.devcontainer/allowlist.domains](.devcontainer/allowlist.domains) を編集してください。

**変更手順:**

1. ブランチを作成
2. `allowlist.domains` にドメインを追加
3. PR を作成（理由を明記）
4. レビュー後にマージ

詳細は [allowlist.readme.md](.devcontainer/allowlist.readme.md) を参照。

### 環境変数

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `DEVCONTAINER_FIREWALL_MODE` | `strict` | `strict` または `balanced` |
| `DEVCONTAINER_ALLOW_GITHUB` | `true` | GitHub API へのアクセス許可 |
| `DEVCONTAINER_ALLOW_SSH` | `true` | SSH (port 22) へのアクセス許可 |
| `DEVCONTAINER_ALLOWLIST_FILE` | `/usr/local/etc/devcontainer/allowlist.domains` | allowlist ファイルパス |

## 診断コマンド

```bash
# 環境診断
make devcontainer:doctor

# ファイアウォール状態確認
make devcontainer:firewall:status

# ブロックされた通信のログ
make devcontainer:firewall:logs

# ファイアウォール動作検証
make devcontainer:firewall:verify

# allowlist ドメインの DNS 解決チェック
make devcontainer:allowlist:check
```

## トラブルシューティング

### 通信がブロックされる

```bash
# 1. ファイアウォールが有効か確認
make devcontainer:firewall:status

# 2. ブロックされているドメインを特定
# エラーメッセージからドメインを確認

# 3. DNS 解決を確認
dig +short <domain>

# 4. 必要であれば allowlist に追加（PR 経由）
```

### iptables の権限エラー

devcontainer は `NET_ADMIN` と `NET_RAW` の capability が必要です。

```jsonc
// devcontainer.json で確認
"runArgs": [
  "--cap-add=NET_ADMIN",
  "--cap-add=NET_RAW"
]
```

### WSL での問題

WSL2 環境では、Docker Desktop のネットワーク設定が影響する場合があります。

```bash
# WSL のネットワークモードを確認
wsl --status

# Docker Desktop の設定で「Use the WSL 2 based engine」を確認
```

### プロキシ環境

企業プロキシ環境では追加設定が必要な場合があります。

```jsonc
// devcontainer.json に追加
"containerEnv": {
  "HTTP_PROXY": "http://proxy.example.com:8080",
  "HTTPS_PROXY": "http://proxy.example.com:8080",
  "NO_PROXY": "localhost,127.0.0.1"
}
```

プロキシを経由する場合、プロキシサーバー自体を allowlist に追加する必要があります。

### DNS 解決の問題

```bash
# 1. Docker DNS が動作しているか確認
cat /etc/resolv.conf

# 2. 外部 DNS で直接解決
dig @8.8.8.8 api.github.com

# 3. Docker Desktop の DNS 設定を確認（GUI）
```

### postStartCommand の失敗

```bash
# ログを確認
# VS Code: 「Dev Containers: Show Container Log」

# 手動でファイアウォールを再実行
sudo /usr/local/bin/init-firewall.sh
```

## セキュリティに関する注意

### DevContainer の限界

- DevContainer のファイアウォールは **完全な防御ではありません**
- コンテナエスケープの脆弱性が存在する可能性があります
- ホストファイルシステムへのアクセスは制限されていません

### 推奨事項

1. **信頼できるリポジトリでのみ使用**
   - 不明なソースのコードを devcontainer で実行しない
   
2. **定期的な更新**
   - ベースイメージと Claude Code を定期的に更新
   
3. **多層防御**
   - ホストマシンのセキュリティ対策も併用
   - 機密情報をコンテナ内に保存しない

4. **監査**
   - allowlist の変更を PR でレビュー
   - 定期的に不要なドメインを削除

## Stack-specific 拡張

このベース devcontainer は言語/フレームワーク依存を含みません。各 Stack 用の拡張は以下で管理されています：

- `stacks/<stack_id>/devcontainer/` - Stack 固有の devcontainer 設定

ベース devcontainer と Stack devcontainer を組み合わせる場合は、Docker Compose または Feature を使用してください。

## 関連ファイル

| ファイル | 説明 |
|----------|------|
| [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) | メイン設定 |
| [.devcontainer/Dockerfile](.devcontainer/Dockerfile) | コンテナイメージ定義 |
| [.devcontainer/init-firewall.sh](.devcontainer/init-firewall.sh) | ファイアウォール初期化スクリプト |
| [.devcontainer/allowlist.domains](.devcontainer/allowlist.domains) | 許可ドメインリスト |
| [.devcontainer/allowlist.readme.md](.devcontainer/allowlist.readme.md) | allowlist 管理ガイド |

## リファレンス

- [anthropics/claude-code devcontainer](https://github.com/anthropics/claude-code/tree/main/.devcontainer) - 本実装のベース
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Dev Container CLI](https://github.com/devcontainers/cli)

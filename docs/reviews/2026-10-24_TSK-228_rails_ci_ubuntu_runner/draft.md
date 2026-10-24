# [Rails/CI] Ruby を 3.4.12 に上げて、Ubuntu 26.04 の CI で失敗しないようにする

## 概要

GitHub Actions の `ubuntu-latest` が Ubuntu 26.04 に切り替わり、Rails CI の 4 ジョブ(RuboCop・RSpec・Brakeman・Bundler Audit)がすべて `Setup Ruby` の段階で失敗するようになった。Ubuntu 26.04 では Ruby 3.4 系のうち最新の 3.4.12 しか用意されておらず、このプロジェクトの 3.4.4 が使えないためである。

main にはブランチ保護が無いので、CI が赤のままでもマージはできてしまう。このままでは、テストされていない Rails の変更がリリースされうる。本番環境はまだ無いので、Ruby を 3.4.12 に上げて CI を元どおり動くようにする。あわせて、ワークフローの無効な入力を消し、ワークフローを変えただけの PR でも Rails CI が動くようにする。

## 背景(調査結果)

- `.github/workflows/rails-ci.yml` の 4 ジョブは `runs-on: ubuntu-latest` で、OS のバージョンを GitHub が決めている
- PR #213(2026-10-24)で初めて失敗した。エラーは次のとおり

  ```text
  Error: Unavailable version 3.4.4 for ruby on ubuntu-26.04
    Only the latest patch release of each series is built for newer runner images.
    ruby-3.4.12 is available on ubuntu-26.04: use ruby-version: '3.4.12', or '3.4' to always use the latest 3.4.x release.
  ```

- `ruby/setup-ruby` は Ubuntu 26.04 を対応 OS に含めているが、新しい実行環境向けには各系列の最新パッチだけをビルドしている
- このプロジェクトは Ruby 3.4.4 を 4 か所で固定している: `rails/.ruby-version`(`ruby-3.4.4`)、`rails/Gemfile`(`ruby '3.4.4'`)、`rails/Gemfile.lock`(`RUBY VERSION ruby 3.4.4p34`)、`rails/Dockerfile`(`FROM ruby:3.4.4`)
- 本番環境はまだ無い(オーナーに確認済み)。Ruby を上げて影響を受けるのは開発環境(docker)と CI だけ
- ワークフローの `ruby-version-file: rails/.ruby-version` は `setup-ruby` に存在しない入力名で、毎回 `Unexpected input(s) 'ruby-version-file'` の警告が出て無視されている。バージョンが合っているのは、`working-directory: rails` の `.ruby-version` を `setup-ruby` が既定で読むため
- Rails CI のトリガーは `pull_request.paths: 'rails/**'` だけで、ワークフローを変えただけの PR では Rails CI が動かない
- main にはブランチ保護が無く、Rails CI は必須チェックではない。今は必須チェックにしない(オーナーが判断)
- frontend の CI は Ruby を使わないので影響を受けていない

### 検証済みの前提

| 前提 | 確かめた方法 |
|---|---|
| 10/17 までの成功時は Ubuntu 24.04 で動いていた | 最後に成功した Rails CI(run 39030222693、10/17)のログに `Image: ubuntu-24.04` |
| 今回の失敗は Ubuntu 26.04 で起きた | #213 の失敗ジョブ(run 40076128057)のログに `Image: ubuntu-26.04` |
| ワークフローと Ruby のバージョンは、こちらでは変えていない | `git log` で `rails-ci.yml` の最終変更は 10/4(#171)、`.ruby-version` は 3.4.4 のまま |
| 26.04 で使える 3.4 系は 3.4.12 だけ | 失敗ログの案内文と、`ruby/setup-ruby` の `ruby-builder.js`(`unavailableVersionHint`)の実装 |
| `setup-ruby` に 3.4.12 が入ったのは 10/23 | `ruby/setup-ruby` のコミット「Add ruby-3.3.13,ruby-3.4.12,ruby-4.0.9」(2026-10-23) |
| 開発環境用の Docker イメージ `ruby:3.4.12` がある | Docker Hub の `library/ruby` のタグ `3.4.12`(2026-10-23 更新) |
| 今の開発環境は Debian 12、`ruby:3.4.12` は Debian 13 | Docker Hub の digest: `ruby:3.4.4` = `ruby:3.4.4-bookworm`、`ruby:3.4.12` = `ruby:3.4.12-trixie`。`ruby:3.4.12-bookworm` もある(10/23 更新) |
| Debian 13 には `yarn` パッケージが無い | packages.debian.org で trixie の `yarn` は「Package not available in this suite」(bookworm では仮想パッケージ) |
| Rails は nodejs・yarn を使っていない | `config.api_only = true`、`rails/` に `package.json`・`yarn.lock` が無く、Gemfile に JS 系の gem も無い |
| 古いパッチのビルドは、新しいパッチが出たあとも消えない | ruby/ruby-builder の `ruby-3.4.11` のリリースに `ruby-3.4.11-ubuntu-26.04-x64.tar.gz` が残っている。CI が落ちるのは、次に `ubuntu-latest` の OS が切り替わったときだけ |
| 開いている PR は #213・#212・#199 | `gh pr list` |
| `ruby-version-file` は無効な入力 | `ruby/setup-ruby` の `action.yml` の inputs に無い。ログの警告 |
| main にブランチ保護が無い | `gh api repos/yuta20253/edu-platform/branches/main/protection` が 404 |

### 未検証

- **docker の `gem_data` ボリュームに残っている gem がそのまま使えるか**: Debian 12 のまま Ruby のパッチだけを上げるので使える見込みだが、使えなければボリュームを消して `bundle install` し直す
- **3.4.4 → 3.4.12 でテストや gem に差が出ないか**: パッチ版の更新なので互換性は保たれる想定だが、確かめていない。docker のイメージを作り直して `bundle exec rspec`・`rubocop`・`brakeman`・`bundler-audit` を流して確かめる
- **3.4.12 は出たばかり(10/23)**: 大きな不具合の報告が出ていないかは、作業時に Ruby の公式サイトのリリース情報で確かめる

## 設計

1. Ruby を 3.4.12 に上げる。`rails/.ruby-version`・`rails/Gemfile` を書き換え、`rails/Dockerfile` は `FROM ruby:3.4.12-bookworm` にする(OS は今と同じ Debian 12 のまま、Ruby のパッチだけを上げる)。`rails/Gemfile.lock` の `RUBY VERSION` も更新する
2. `rails-ci.yml` の無効な入力 `ruby-version-file` を 4 か所とも削除する(動作は変わらず、警告が消えるだけ)
3. `rails-ci.yml` の `on.pull_request.paths` に `'.github/workflows/rails-ci.yml'` を追加する。今後、ワークフローだけを変える PR でも Rails CI が動くようになる

- `runs-on` は `ubuntu-latest` のままにする(オーナーの判断)。次に OS が切り替わって同じことが起きたら、Ruby をその時点の最新パッチに上げて直す
- 開発環境は docker のイメージを作り直す必要がある(`docker compose build`)。Gemfile の Ruby とコンテナの Ruby が食い違うと Bundler が起動を止めるので、main を取り込んだブランチでは作り直しが、作り直した環境では main の取り込みが要る。PR に症状と対処を書いて、チームに伝える
- 戻すとき: PR を revert すると 3.4.4 に戻り、CI は Ubuntu 26.04 で再び落ちる。その場合は案 A(`runs-on: ubuntu-24.04`)で一時的にしのぐ。開発環境は再度 `docker compose build` する
- `frontend-ci.yml` は Ruby を使わないので変えない

## 比較した案

| 案 | 内容 | 採用しない理由 |
|---|---|---|
| A | `runs-on: ubuntu-24.04` に固定し、Ruby は 3.4.4 のまま | 本番が無いので、Ruby を上げない理由が弱い。OS の固定という負債と、それを外すチケットが残る |
| B(採用) | Ruby を 3.4.12 に上げ、`ubuntu-latest` のまま | ― |
| C | CI だけ `ruby-version: '3.4'` にして最新の 3.4.x を使う | `Gemfile` の `ruby '3.4.4'` と食い違い、Bundler がエラーにする。開発環境と違うバージョンでテストすることにもなる |
| D | 何もせず、`setup-ruby` が 26.04 向けに 3.4.4 を出すのを待つ | 新しい実行環境には最新パッチしか作らない方針なので、待っても出ない |
| E | ジョブを `container: ruby:3.4.4` で動かす | `bundler-cache` が使えずキャッシュを自前で書くことになり、DB などのサービスへの接続先も変わる。変更が大きい |
| F | Ruby を上げ、`runs-on: ubuntu-26.04` に固定 | OS が勝手に変わらなくなるが、固定を更新する作業が別に要る。オーナーの判断で `ubuntu-latest` のままにした |
| G | `FROM ruby:3.4.12`(Debian 13) | ベースの OS も変わり、Debian 13 には `yarn` が無いのでビルドが通らない見込み。Debian の更新(と、使っていない nodejs・yarn の削除)は別チケットにする |

## やること

- [ ] `rails/.ruby-version` を `ruby-3.4.12`、`rails/Gemfile` を `ruby '3.4.12'`、`rails/Dockerfile` を `FROM ruby:3.4.12-bookworm` にする
- [ ] docker のイメージを作り直し(`docker compose build rails sidekiq`)、コンテナ内で `bundle install` する。`git diff rails/Gemfile.lock` で `RUBY VERSION` が `ruby 3.4.12p…` になったことを確かめ、変わっていなければ `bundle update --ruby` する。`BUNDLED WITH` が変わった場合は、残すか戻すかを PR 本文に書く
- [ ] ローカルで `bundle exec rspec`・`bundle exec rubocop`・`bundle exec brakeman`・`bundle exec bundler-audit check --update` が通ることを確かめる
- [ ] `.github/workflows/rails-ci.yml` の `ruby-version-file: rails/.ruby-version` を 4 か所とも削除する
- [ ] 同ファイルの `on.pull_request.paths` に `'.github/workflows/rails-ci.yml'` を追加する
- [ ] 確認: この PR で Rails CI の 4 ジョブが動き、`Setup Ruby` で 3.4.12 が入り、`Unexpected input(s)` の警告が出ないこと
- [ ] PR 本文に、開発環境の作り直し手順(`docker compose build` → `docker compose up -d`)と、症状と対処を書く。症状: `Your Ruby version is ..., but your Gemfile specified ...` で rails・sidekiq が起動しない。対処: main を取り込む、または `docker compose build`
- [ ] マージ後: #213 に main を取り込み、Rails CI が通ることを見る(失敗したジョブの Re-run では直らない。Update branch か rebase で main を取り込む)。#212・#199 はフロントしか触っていないので取り込みは必須ではないが、そのブランチのままローカルで Rails を動かすときは、main を取り込むか上の対処が要る

## 完了条件

- この PR の Rails CI の 4 ジョブ(RuboCop・RSpec・Brakeman・Bundler Audit)が `ubuntu-latest`(26.04)上で、Ruby 3.4.12 で成功する
- Ruby のバージョンが 4 か所とも 3.4.12 にそろっている
- `Setup Ruby` の `Unexpected input(s) 'ruby-version-file'` の警告が出ない
- 開発環境(docker)で `docker compose exec rails ruby -v` が 3.4.12 を返し、rails と sidekiq が起動し、既存のテストがすべて通る
- 開発環境の OS は Debian 12(bookworm)のまま

## 依存

- 依存: なし
- このチケットを待っているもの: PR #213(TSK-178 1/2)。このチケットの PR がマージされるまで Rails CI が通らない
- 関連(別チケット): テスト環境で Bullet を有効にし、N+1 を CI で検知する
- 関連(別チケット候補): 開発環境を Debian 13 に上げ、使っていない nodejs・yarn を Dockerfile から削除する

## 設計レビュー記録

`docs/reviews/2026-10-24_TSK-228_rails_ci_ubuntu_runner/`

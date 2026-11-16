#!/usr/bin/env bash
# Publish only this site through the existing atmos-dining GitHub account.
# GitHub Pages API: https://docs.github.com/en/rest/pages/pages
set -euo pipefail
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
repository='atmos-dining/yoico-site'
expected_remote="https://github.com/${repository}.git"
expected_url='https://atmos-dining.github.io/yoico-site/'
expected_domain=''
gh_bin='/Users/shutaono/.local/bin/gh'
if [ ! -x "$gh_bin" ]; then gh_bin="$(command -v gh)"; fi
if [ "$(git remote get-url origin)" != "$expected_remote" ]; then
  echo '停止: origin が よいコ の予定リポジトリと一致しません。' >&2; exit 1
fi
if [ "$(git branch --show-current)" != main ] || [ -n "$(git status --porcelain)" ]; then
  echo '停止: main ブランチの未コミット変更を確認してください。変更は自動で混ぜません。' >&2; exit 1
fi

echo '1/5 GitHubへの接続を確認します。'
curl --fail --silent --show-error --connect-timeout 10 --max-time 20 -I https://api.github.com >/dev/null
# Token remains in process memory; never write it to remote URLs, files or output.
set +x
atmos_token="$("$gh_bin" auth token --hostname github.com --user atmos-dining)"
gh_atmos() { GH_TOKEN="$atmos_token" "$gh_bin" "$@"; }
git_atmos() { GH_TOKEN="$atmos_token" GIT_TERMINAL_PROMPT=0 git "$@"; }
if [ "$(gh_atmos api user --jq .login)" != atmos-dining ]; then
  echo '停止: atmos-dining アカウントを確認できません。' >&2; exit 1
fi
publish_tmp="$(mktemp -d "${TMPDIR:-/tmp}/yoico-publish.XXXXXX")"
trap 'unset atmos_token; rm -rf -- "$publish_tmp"' EXIT

echo '2/5 リポジトリを確認し、存在しなければ作成します。'
if ! gh_atmos api "repos/$repository" --jq .full_name >"$publish_tmp/repository" 2>"$publish_tmp/error"; then
  if grep -q 'HTTP 404' "$publish_tmp/error"; then
    gh_atmos repo create "$repository" --public --description 'よいコ | Wine and small plates in Nishijin, Fukuoka'
  else
    cat "$publish_tmp/error" >&2; exit 1
  fi
fi
if ! gh_atmos api "repos/$repository/pages" --jq '.cname // ""' >"$publish_tmp/cname" 2>"$publish_tmp/error"; then
  if ! grep -q 'HTTP 404' "$publish_tmp/error"; then cat "$publish_tmp/error" >&2; exit 1; fi
  pages_exists=false
else
  pages_exists=true
  if [ -s "$publish_tmp/cname" ] && [ -n "$(cat "$publish_tmp/cname")" ] && [ "$(cat "$publish_tmp/cname")" != "$expected_domain" ]; then
    echo '停止: 既存の独自ドメインを検出しました。現在の公開先を確認してから再開してください。' >&2; exit 1
  fi
fi

echo '3/5 pull --rebase を実行してから main をpushします。'
remote_heads="$(git_atmos ls-remote --heads origin)"
if ! git_atmos pull --rebase origin main >"$publish_tmp/pull" 2>&1; then
  cat "$publish_tmp/pull"
  # A newly created empty repository has no main to pull. No other failure is ignored.
  if [ -n "$remote_heads" ] || ! grep -q "couldn't find remote ref main" "$publish_tmp/pull"; then
    echo '停止: pull が成功しなかったため、pushは行いません。' >&2; exit 1
  fi
  echo '空のリポジトリに初回の main を作成します。'
else
  cat "$publish_tmp/pull"
fi
git_atmos push -u origin main
published_commit="$(git rev-parse HEAD)"
remote_commit="$(git_atmos ls-remote origin refs/heads/main | cut -f1)"
[ "$published_commit" = "$remote_commit" ] || { echo '停止: GitHubのmainとローカルが一致しません。' >&2; exit 1; }

echo '4/5 GitHub Pagesを main / root に設定します。'
if [ "$pages_exists" = true ]; then method=PUT; else method=POST; fi
gh_atmos api --method "$method" "repos/$repository/pages" -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/' >/dev/null
site_url="$(gh_atmos api "repos/$repository/pages" --jq .html_url)"
if [ "$site_url" != "$expected_url" ] && [ "$site_url" != "http://$expected_domain/" ]; then
  echo "停止: 想定外の公開URLです: $site_url" >&2; exit 1
fi

site_url="$expected_url"
echo '5/5 公開されたコミットとページを確認します（通常1〜3分）。'
for attempt in {1..18}; do
  if build="$(gh_atmos api "repos/$repository/pages/builds/latest" --jq '[.status,.commit] | @tsv' 2>"$publish_tmp/error")"; then
    build_status="${build%%$'\t'*}"
    build_commit="${build#*$'\t'}"
    if [ "$build_commit" = "$published_commit" ] && [ "$build_status" = errored ]; then
      echo 'GitHubへのpushは完了しましたが、Pagesのビルドが失敗しました。' >&2
      gh_atmos api "repos/$repository/pages/builds/latest" --jq .error >&2; exit 1
    fi
    if [ "$build_status" = built ] && [ "$build_commit" = "$published_commit" ]; then
      verified=true
      for page in '' menu.html drink.html blog/ admin/; do
        if ! curl --fail --silent --show-error --connect-timeout 10 --max-time 20 "$site_url$page" -o "$publish_tmp/page" || ! grep -q 'よいコ' "$publish_tmp/page"; then
          verified=false; break
        fi
      done
      if [ "$verified" = true ]; then
        # The default github.io host uses GitHub’s shared TLS certificate.
        # Per-domain certificate enforcement is only applicable after CNAME setup.
        if [ -n "$expected_domain" ]; then
          gh_atmos api --method PUT "repos/$repository/pages" -F https_enforced=true >/dev/null
          [ "$(gh_atmos api "repos/$repository/pages" --jq .https_enforced)" = true ] || exit 2
        fi
        echo "本番公開を確認しました: $site_url"
        echo "GitHub main: $published_commit"
        exit 0
      fi
    fi
  elif ! grep -q 'HTTP 404' "$publish_tmp/error"; then
    cat "$publish_tmp/error" >&2; exit 1
  fi
  if [ "$attempt" -lt 18 ]; then sleep 10; fi
done
echo "GitHubへのpushは完了しています。DNS・SSL証明書またはPagesの公開待ちです。同じコマンドで再確認できます: $site_url" >&2
exit 2

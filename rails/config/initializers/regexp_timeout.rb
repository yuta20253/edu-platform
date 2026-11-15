# frozen_string_literal: true

# ReDoS(正規表現を使ったDoS攻撃)対策として、正規表現マッチに1秒のタイムアウトを設定する。
# config.load_defaultsを8.0以上に上げる際は、railties側が同じ設定(Regexp.timeout ||= 1)を行うため本ファイルは削除してよい。
Regexp.timeout = 1

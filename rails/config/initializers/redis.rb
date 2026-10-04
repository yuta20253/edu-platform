# frozen_string_literal: true

module RedisConnection
  # Home画面表示などリクエスト中に同期で呼ぶため、Redis障害時にリクエストが
  # デフォルト(5秒)のまま詰まらないよう短めに設定する。
  TIMEOUT = 0.3

  def self.client
    @client ||= Redis.new(
      url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0'),
      connect_timeout: TIMEOUT,
      read_timeout: TIMEOUT,
      write_timeout: TIMEOUT
    )
  end
end

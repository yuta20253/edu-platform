# frozen_string_literal: true

module RedisConnection
  def self.client
    @client ||= Redis.new(url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0'))
  end
end

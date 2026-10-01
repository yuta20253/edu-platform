# frozen_string_literal: true

module Student
  class TodayAnswerCounterService
    TTL_BUFFER = 5.minutes

    def initialize(user:)
      @user = user
    end

    def increment
      redis.incr(key)
      redis.expireat(key, ttl_at.to_i)
    rescue Redis::BaseError => e
      Rails.logger.error("[TodayAnswerCounterService] increment failed: #{e.message}")
    end

    def fetch
      redis.get(key).to_i
    rescue Redis::BaseError => e
      Rails.logger.error("[TodayAnswerCounterService] fetch failed: #{e.message}")
      0
    end

    private

    attr_reader :user

    def redis
      RedisConnection.client
    end

    def key
      "student:today_answer_count:#{user.id}:#{Time.current.to_date.iso8601}"
    end

    def ttl_at
      Time.current.end_of_day + TTL_BUFFER
    end
  end
end

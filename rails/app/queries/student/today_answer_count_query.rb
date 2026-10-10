# frozen_string_literal: true

module Student
  class TodayAnswerCountQuery
    def initialize(user:)
      @user = user
    end

    def fetch
      redis.get(key).to_i
    rescue Redis::BaseError => e
      Rails.logger.error("[TodayAnswerCountQuery] failed: #{e.message}")
      0
    end

    private

    attr_reader :user

    def redis
      RedisConnection.client
    end

    def key
      ::Student::TodayAnswerCountKey.build(user)
    end
  end
end

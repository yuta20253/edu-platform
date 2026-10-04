# frozen_string_literal: true

module Student
  class IncrementTodayAnswerCountService
    TTL_BUFFER = 5.minutes

    def initialize(user:)
      @user = user
    end

    def call
      redis.pipelined do |pipeline|
        pipeline.incr(key)
        # NX: 既にTTLが付いているキーへの再設定(無駄な通信・日付境界のズレ)を避ける。
        # INCRでキーが新規作成された直後だけTTLなしなので、そのときだけ実際に設定される。
        pipeline.expireat(key, ttl_at.to_i, nx: true)
      end
    rescue Redis::BaseError => e
      Rails.logger.error("[IncrementTodayAnswerCountService] failed: #{e.message}")
    end

    private

    attr_reader :user

    def redis
      RedisConnection.client
    end

    def key
      ::Student::TodayAnswerCountKey.build(user)
    end

    def ttl_at
      Time.current.end_of_day + TTL_BUFFER
    end
  end
end

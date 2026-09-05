# frozen_string_literal: true

module Rack
  class Attack
    ACCOUNT_LINK_PATH = '/api/v1/student/account_link'

    throttle('account_link/user', limit: 5, period: 10.minutes) do |req|
      req.env['warden']&.user&.id if req.post? && req.path == ACCOUNT_LINK_PATH
    end

    self.throttled_responder = lambda do |_request|
      [
        429,
        { 'Content-Type' => 'application/json' },
        [{ errors: ['試行回数の上限に達しました。しばらく時間をおいてから再度お試しください'] }.to_json]
      ]
    end
  end
end

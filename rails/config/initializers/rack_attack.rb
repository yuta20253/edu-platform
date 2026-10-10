# frozen_string_literal: true

module Rack
  class Attack
    # previewは紐付けを確定しないreadonlyの確認APIだが、生徒コードの存在確認に
    # 使えてしまうため、account_linkと同じthrottleバケットを共有して合算でカウントする。
    ACCOUNT_LINK_PATHS = [
      '/api/v1/student/account_link',
      '/api/v1/student/account_link/preview'
    ].freeze

    throttle('account_link/user', limit: 5, period: 10.minutes) do |req|
      req.env['warden']&.authenticate(scope: :user)&.id if req.post? && ACCOUNT_LINK_PATHS.include?(req.path)
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

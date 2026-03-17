# frozen_string_literal: true

class StripAuthorizationResponseHeader
  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, body = @app.call(env)
    headers.delete('Authorization')
    [status, headers, body]
  end
end

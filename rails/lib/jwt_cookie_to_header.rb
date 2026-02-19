# frozen_string_literal: true

class JwtCookieToHeader
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)

    token = request.cookies['access_token']
    env['HTTP_AUTHORIZATION'] = "Bearer #{token}" if token && env['HTTP_AUTHORIZATION'].blank?

    @app.call(env)
  end
end

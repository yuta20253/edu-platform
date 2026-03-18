# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sessions', type: :request do
  let(:email) { 'student@example.com' }
  let(:password) { 'password' }

  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let(:valid_params) do
    { email:, password: }
  end

  def login_and_cookie_header(headers:, params:)
    post '/api/v1/user/login',
         params: params.to_json,
         headers: headers

    set_cookie = response.headers['Set-Cookie']
    set_cookie&.split(';')&.first
  end

  before do
    create(:user, email:, password:)
  end

  describe 'POST /api/v1/user/login' do
    context '正常系' do
      it 'ログインできる' do
        post '/api/v1/user/login', params: valid_params.to_json, headers: headers

        expect(response).to have_http_status(:ok)
      end

      it 'HttpOnly CookieにJWTがセットされる' do
        post '/api/v1/user/login', params: valid_params.to_json, headers: headers

        set_cookie = response.headers['Set-Cookie']
        expect(set_cookie).to include('access_token=')
        expect(set_cookie).to match(/HttpOnly/i)
      end

      it 'Authorizationヘッダは無視される（cookieが使われる）' do
        post '/api/v1/user/login', params: valid_params.to_json, headers: headers

        set_cookie = response.headers['Set-Cookie']
        expect(set_cookie).to include('access_token=')
      end

      it 'Cookieを付けて /api/v1/me を叩くと current_user が取得できる' do
        cookie_header = login_and_cookie_header(headers: headers, params: valid_params)
        expect(cookie_header).to be_present

        get '/api/v1/me', headers: headers.merge('Cookie' => cookie_header)

        body = response.parsed_body
        expect(body['user']['email']).to eq(email)
      end
    end

    context '異常系' do
      it 'メールアドレスが存在しない場合は401を返す' do
        invalid_params = { email: 'invalid_email@example.com', password: }

        post '/api/v1/user/login', params: invalid_params.to_json, headers: headers

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body['errors']).to include('メールアドレスまたはパスワードが違います')
      end

      it 'パスワードが違う場合も401を返す' do
        invalid_params = { email:, password: 'invalid_password' }

        post '/api/v1/user/login', params: invalid_params.to_json, headers: headers

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body['errors']).to include('メールアドレスまたはパスワードが違います')
      end
    end
  end

  describe 'DELETE /api/v1/user/logout' do
    let(:cookie_header) { login_and_cookie_header(headers: headers, params: valid_params) }

    it 'ログアウトできる' do
      delete '/api/v1/user/logout', headers: headers.merge('Cookie' => cookie_header)

      expect(response).to have_http_status(:ok)
    end

    it 'Cookie削除のSet-Cookieが返る' do
      delete '/api/v1/user/logout', headers: headers.merge('Cookie' => cookie_header)

      logout_set_cookie = response.headers['Set-Cookie']
      expect(logout_set_cookie).to be_present
      expect(response.cookies['access_token']).to be_nil
    end

    it 'ログアウト後は /api/v1/me が401になる' do
      delete '/api/v1/user/logout', headers: headers.merge('Cookie' => cookie_header)

      get '/api/v1/me', headers: headers.merge('Cookie' => cookie_header)

      expect(response).to have_http_status(:unauthorized)
    end
  end
end

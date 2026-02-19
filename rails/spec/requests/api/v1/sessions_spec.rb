# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sessions', type: :request do
  describe 'POST /api/v1/user/login' do
    let!(:user) { create(:user, email: 'student@example.com', password: 'password') }

    let(:valid_params) do
      {
        email: 'student@example.com',
        password: 'password'
      }
    end

    let(:headers) do
      {
        'Content-Type' => 'application/json',
        'Accept' => 'application/json'
      }
    end

    context '正常系' do
      it 'ログインでき、HttpOnly CookieにJWTがセットされる' do
        post '/api/v1/user/login', params: valid_params.to_json, headers: headers

        expect(response).to have_http_status(:ok)

        set_cookie = response.headers['Set-Cookie']
        expect(set_cookie).to be_present
        expect(set_cookie).to include('access_token=')

        # HttpOnlyであること
        expect(set_cookie).to match(/HttpOnly/i)

        expect(response.headers['Authorization']).to be_nil
      end

      it 'ログイン後、Cookieをつけて /api/v1/user を実行すると current_user が取得できる' do
        post '/api/v1/user/login', params: valid_params.to_json, headers: headers

        expect(response).to have_http_status(:ok)

        set_cookie = response.headers['Set-Cookie']
        cookie_header = set_cookie.split(';').first

        get '/api/v1/user', headers: headers.merge('Cookie' => cookie_header)

        body = response.parsed_body
        expect(body['email']).to eq('student@example.com')
      end
    end

    context '異常系' do
      it 'メールアドレスが存在しない場合は401を返す' do
        invalid_params = { email: 'invalid_email@example.com', password: 'password' }

        post '/api/v1/user/login', params: invalid_params.to_json, headers: headers

        expect(response).to have_http_status(:unauthorized)
        body = response.parsed_body
        expect(body['errors']).to include('メールアドレスまたはパスワードが違います')
      end

      it 'パスワードが違う場合も401を返す' do
        invalid_password = { email: 'student@example.com', password: 'invalid_password' }

        post '/api/v1/user/login', params: invalid_password.to_json, headers: headers

        expect(response).to have_http_status(:unauthorized)

        body = response.parsed_body
        expect(body['errors']).to include('メールアドレスまたはパスワードが違います')
      end
    end
  end

  describe 'DELETE /api/v1/user/logout' do
    let!(:user) { create(:user, email: 'student@example.com', password: 'password') }

    let(:headers) do
      { 'Content-Type' => 'application/json', 'Accept' => 'application/json' }
    end

    it 'ログアウトができ、Cookieが削除される' do
      post '/api/v1/user/login',
        params: { email: 'student@example.com', password: 'password' }.to_json,
        headers: headers

      set_cookie = response.headers['Set-Cookie']
      cookie_header = set_cookie.split(';').first

      delete '/api/v1/user/logout', headers: headers.merge('Cookie' => cookie_header)
      expect(response).to have_http_status(:ok)

      logout_set_cookie = response.headers['Set-Cookie']
      expect(logout_set_cookie).to be_present
      expect(logout_set_cookie).to include('access_token=')

      get '/api/v1/user', headers: headers.merge('Cookie' => cookie_header)
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

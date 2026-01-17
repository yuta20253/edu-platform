# frozen_string_literal: true

require 'rails_helper'
require 'devise/jwt/test_helpers'

RSpec.describe 'Api::V1::Sessions', type: :request do
  include Devise::Test::IntegrationHelpers

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
      it 'ログインできる' do
        post '/api/v1/user/login', params: valid_params.to_json, headers: headers

        expect(response).to have_http_status(:ok)
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
end

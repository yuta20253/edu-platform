# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'エラー応答の日本語化', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json', 'Accept' => 'application/json' } }

  describe '未認証' do
    it '日本語のerrors配列で401を返す' do
      get '/api/v1/me', headers: headers

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq('errors' => ['ログインしてください'])
    end
  end

  describe '必須パラメータの欠落' do
    it '新規登録に空ボディを送ると400を返す' do
      post '/api/v1/student/signup', params: {}.to_json, headers: headers

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['errors']).to eq(['必須パラメータ「user」がありません'])
    end
  end

  describe '短いパスワード' do
    it '新規登録で日本語のメッセージになる' do
      role = create(:user_role, :student)
      high_school = create(:high_school, prefecture: create(:prefecture, name: '東京都'))
      grade = create(:grade, high_school: high_school, year: 1)
      params = { user: { email: 'short@example.com', password: 'abc', password_confirmation: 'abc',
                         name: 'テスト太郎', name_kana: 'テストタロウ', user_role_name: role.name,
                         high_school_id: high_school.id, grade_id: grade.id } }

      post '/api/v1/student/signup', params: params.to_json, headers: headers

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to include('パスワードは6文字以上で入力してください')
    end

    it 'パスワード再設定で日本語のメッセージになる' do
      token = create(:user).send(:set_reset_password_token)
      params = { password_reset: { reset_password_token: token, password: 'abc', password_confirmation: 'abc' } }

      patch '/api/v1/password/reset', params: params.to_json, headers: headers

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to include('パスワードは6文字以上で入力してください')
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'エラー応答の日本語化', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json', 'Accept' => 'application/json' } }

  describe '未認証' do
    it '日本語のメッセージで401を返す' do
      get '/api/v1/me', headers: headers

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq('error' => 'ログインしてください')
    end
  end

  describe '必須パラメータの欠落' do
    it '新規登録に空ボディを送ると400を返す' do
      post '/api/v1/student/signup', params: {}.to_json, headers: headers

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['errors']).to eq(['必須パラメータ「user」がありません'])
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::CsvTemplates', type: :request do
  let(:json_headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: json_headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/admin/csv_template/questions' do
    subject(:get_template) do
      get '/api/v1/admin/csv_template/questions',
          headers: { 'Accept' => 'text/csv', 'Cookie' => cookie }
    end

    context 'adminでログインしている場合' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返る' do
        get_template
        expect(response).to have_http_status(:ok)
      end

      it 'Content-Typeにtext/csvが含まれる' do
        get_template
        expect(response.headers['Content-Type']).to include('text/csv')
      end

      it 'Content-Dispositionにattachmentとファイル名が含まれる' do
        get_template
        expect(response.headers['Content-Disposition']).to include('attachment')
        expect(response.headers['Content-Disposition']).to include('questions_template.csv')
      end

      it 'ヘッダー行が既存インポート実装のカラム順と一致する' do
        get_template
        body = response.body.delete_prefix('﻿')
        parsed = CSV.parse(body, headers: true)

        expect(parsed.headers).to eq(
          %w[問題文 正解番号 解説 選択肢1 選択肢2 選択肢3 選択肢4 ヒント1 ヒント2]
        )
      end

      it 'サンプル行が1行含まれる' do
        get_template
        body = response.body.delete_prefix('﻿')
        parsed = CSV.parse(body, headers: true)

        expect(parsed.size).to eq(1)
      end
    end

    context '未ログインの場合' do
      let(:cookie) { nil }

      it 'ステータス401が返る' do
        get_template
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'admin以外でログインしている場合' do
      let!(:student_user) { create(:user, :student) }
      let(:cookie) { login_and_get_cookie(student_user) }

      it 'ステータス403が返る' do
        get_template
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end

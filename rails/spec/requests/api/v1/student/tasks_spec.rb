# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Student::Tasks', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers
    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/student/tasks' do
    context '正常系' do
      subject { get '/api/v1/student/tasks', headers: headers.merge('Cookie' => cookie) }

      let!(:prefecture) { create(:prefecture, name: '東京都') }
      let!(:high_school) { create(:high_school, name: 'A高校', prefecture: prefecture) }
      let!(:user) { create(:user, high_school: high_school) }
      let!(:goal) { create(:goal, user: user) }
      let!(:tasks) { create_list(:task, 3, user: user, goal: goal) }

      let!(:cookie) { login_and_get_cookie(user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'tasksキーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('tasks')
      end

      it 'metaキーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('meta')
      end

      it 'meta に必要なフィールドが含まれる' do
        subject
        meta = response.parsed_body['meta']
        expect(meta.keys).to include('current_page', 'total_pages', 'total_count', 'per_page')
      end

      it 'タスク一覧が取得される' do
        subject
        json = response.parsed_body

        expect(json['tasks'].size).to eq(3)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/student/tasks', headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - ログイン生徒以外のアクセス' do
      let!(:other_user) { create(:user, :teacher) }

      it '403が返される' do
        cookie = login_and_get_cookie(other_user)
        get '/api/v1/student/tasks', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end

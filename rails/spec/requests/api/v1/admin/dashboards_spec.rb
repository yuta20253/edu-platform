# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Dashboards', type: :request do
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

  describe 'GET /api/v1/admin/dashboard' do
    context '正常系' do
      subject { get '/api/v1/admin/dashboard', headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:students)   { create_list(:user, 3) }
      let!(:teachers)   { create_list(:user, 2, :teacher) }
      let!(:unit)       { create(:unit) }
      let!(:questions)  { create_list(:question, 4, unit: unit) }
      let!(:imports)    { create_list(:import_history, 6, user: admin_user, unit: unit) }

      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'stats.student_count が正しい' do
        subject
        expect(response.parsed_body.dig('stats', 'student_count')).to eq(3)
      end

      it 'stats.teacher_count が正しい' do
        subject
        expect(response.parsed_body.dig('stats', 'teacher_count')).to eq(2)
      end

      it 'stats.admin_count が正しい' do
        subject
        expect(response.parsed_body.dig('stats', 'admin_count')).to eq(1)
      end

      it 'stats.total_questions が正しい' do
        subject
        expect(response.parsed_body.dig('stats', 'total_questions')).to eq(4)
      end

      it 'recent_imports は最大5件返される' do
        subject
        expect(response.parsed_body['recent_imports'].length).to eq(5)
      end

      it 'recent_imports に必要なフィールドが含まれる' do
        subject
        import = response.parsed_body['recent_imports'].first
        expect(import.keys).to include('id', 'file_name', 'status', 'success_count', 'error_count', 'total_count',
                                       'created_at')
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/admin/dashboard', headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get '/api/v1/admin/dashboard', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end

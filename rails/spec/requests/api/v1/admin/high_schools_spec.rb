# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::HighSchools', type: :request do
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

  describe 'GET /api/v1/admin/high_schools' do
    context '正常系' do
      subject { get '/api/v1/admin/high_schools', headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:school)     { create(:high_school) }
      let!(:students)   { create_list(:user, 2, high_school: school) }
      let!(:teachers)   { create_list(:user, 1, :teacher, high_school: school) }

      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'schools キーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('schools')
      end

      it 'meta キーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('meta')
      end

      it 'meta に必要なフィールドが含まれる' do
        subject
        meta = response.parsed_body['meta']
        expect(meta.keys).to include('current_page', 'total_pages', 'total_count', 'per_page')
      end

      it 'schools の各要素に必要なフィールドが含まれる' do
        subject
        school_data = response.parsed_body['schools'].first
        expect(school_data.keys).to include('id', 'name', 'prefecture_name', 'student_count', 'teacher_count',
                                            'created_at', 'updated_at')
      end

      it 'student_count が正しい' do
        subject
        school_data = response.parsed_body['schools'].find { |s| s['id'] == school.id }
        expect(school_data['student_count']).to eq(2)
      end

      it 'teacher_count が正しい' do
        subject
        school_data = response.parsed_body['schools'].find { |s| s['id'] == school.id }
        expect(school_data['teacher_count']).to eq(1)
      end

      context 'prefecture_id パラメータ指定時' do
        let!(:other_school) { create(:high_school) }

        it '指定した都道府県の高校のみ返される' do
          get '/api/v1/admin/high_schools',
              params: { prefecture_id: school.prefecture_id },
              headers: headers.merge('Cookie' => cookie)
          ids = response.parsed_body['schools'].pluck('id')
          expect(ids).to include(school.id)
          expect(ids).not_to include(other_school.id)
        end
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get '/api/v1/admin/high_schools', headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get '/api/v1/admin/high_schools', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET /api/v1/admin/high_schools/:id' do
    context '正常系' do
      subject { get "/api/v1/admin/high_schools/#{school.id}", headers: headers.merge('Cookie' => cookie) }

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:school)     { create(:high_school) }
      let!(:students)   { create_list(:user, 3, high_school: school) }
      let!(:teachers)   { create_list(:user, 2, :teacher, high_school: school) }

      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it '必要なフィールドが含まれる' do
        subject
        expect(response.parsed_body.keys).to include('id', 'name', 'prefecture_name', 'student_count',
                                                     'teacher_count', 'created_at', 'updated_at')
      end

      it 'student_count が正しい' do
        subject
        expect(response.parsed_body['student_count']).to eq(3)
      end

      it 'teacher_count が正しい' do
        subject
        expect(response.parsed_body['teacher_count']).to eq(2)
      end
    end

    context '異常系 - 未認証アクセス' do
      let!(:school) { create(:high_school) }

      it '401が返される' do
        get "/api/v1/admin/high_schools/#{school.id}", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 存在しない id' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '404が返される' do
        get '/api/v1/admin/high_schools/0', headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }
      let!(:school)       { create(:high_school) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get "/api/v1/admin/high_schools/#{school.id}", headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end

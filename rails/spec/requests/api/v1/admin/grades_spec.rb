# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Grades', type: :request do
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

  describe 'GET /api/v1/admin/high_schools/:high_school_id/grades' do
    context '正常系' do
      subject do
        get "/api/v1/admin/high_schools/#{school.id}/grades",
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:school)     { create(:high_school) }
      let!(:grade2)     { create(:grade, high_school: school, year: 2) }
      let!(:grade1)     { create(:grade, high_school: school, year: 1) }
      let(:cookie)      { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'grades キーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('grades')
      end

      it '各学年に必要なフィールドが含まれる' do
        subject
        grade_data = response.parsed_body['grades'].first
        expect(grade_data.keys).to include('id', 'year', 'display_name')
      end

      it 'display_name が正しく返される' do
        subject
        grade_data = response.parsed_body['grades'].find { |g| g['id'] == grade1.id }
        expect(grade_data['display_name']).to eq(grade1.display_name)
      end

      it 'year の昇順で返される' do
        subject
        years = response.parsed_body['grades'].pluck('year')
        expect(years).to eq([1, 2])
      end

      it '対象高校の学年のみ返される' do
        other_school = create(:high_school)
        create(:grade, high_school: other_school, year: 1)
        subject
        ids = response.parsed_body['grades'].pluck('id')
        expect(ids).to contain_exactly(grade1.id, grade2.id)
      end
    end

    context '異常系 - 未認証アクセス' do
      let!(:school) { create(:high_school) }

      it '401が返される' do
        get "/api/v1/admin/high_schools/#{school.id}/grades", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }
      let!(:school)       { create(:high_school) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get "/api/v1/admin/high_schools/#{school.id}/grades",
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 存在しない high_school_id' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '404が返される' do
        get '/api/v1/admin/high_schools/0/grades',
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end

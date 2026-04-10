# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Teachers', type: :request do
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

  describe 'GET /api/v1/admin/high_schools/:high_school_id/teachers' do
    context '正常系' do
      subject do
        get "/api/v1/admin/high_schools/#{school.id}/teachers",
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:school)     { create(:high_school) }
      let!(:grade)      { create(:grade, high_school: school, year: 1) }
      let!(:teacher) do
        user = create(:user, :teacher, high_school: school, grade: nil)
        create(:teacher_permission, user: user, grade_scope: :all_grades, manage_other_teachers: false)
        create(:teacher_grade, user: user, grade: grade)
        user
      end
      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'teachers キーが含まれる' do
        subject
        expect(response.parsed_body).to have_key('teachers')
      end

      it '各教師に必要なフィールドが含まれる' do
        subject
        teacher_data = response.parsed_body['teachers'].first
        expect(teacher_data.keys).to include('id', 'name', 'email', 'grade_scope', 'manage_other_teachers', 'grades')
      end

      it 'grade_scope が文字列で返される' do
        subject
        teacher_data = response.parsed_body['teachers'].first
        expect(teacher_data['grade_scope']).to eq('all_grades')
      end

      it 'grades[].name が display_name で返される' do
        subject
        grade_data = response.parsed_body['teachers'].first['grades'].first
        expect(grade_data['name']).to eq(grade.display_name)
      end

      it '対象高校の教師のみ返される' do
        other_school = create(:high_school)
        create(:user, :teacher, high_school: other_school, grade: nil)
        subject
        ids = response.parsed_body['teachers'].pluck('id')
        expect(ids).to include(teacher.id)
        expect(ids.length).to eq(1)
      end
    end

    context '異常系 - 未認証アクセス' do
      let!(:school) { create(:high_school) }

      it '401が返される' do
        get "/api/v1/admin/high_schools/#{school.id}/teachers", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 管理者以外のアクセス（生徒）' do
      let!(:student_user) { create(:user) }
      let!(:school)       { create(:high_school) }

      it '403が返される' do
        cookie = login_and_get_cookie(student_user)
        get "/api/v1/admin/high_schools/#{school.id}/teachers",
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context '異常系 - 存在しない high_school_id' do
      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let(:cookie) { login_and_get_cookie(admin_user) }

      it '404が返される' do
        get '/api/v1/admin/high_schools/0/teachers',
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end

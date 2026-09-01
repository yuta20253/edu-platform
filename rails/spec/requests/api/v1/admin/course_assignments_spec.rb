# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::CourseAssignments', type: :request do
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

  describe 'GET /api/v1/admin/high_schools/:high_school_id/course_assignments' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let!(:school)     { create(:high_school) }
    let!(:course)     { create(:course) }
    let!(:assignment) { create(:course_assignment, high_school: school, course: course) }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    context '正常系' do
      subject do
        get "/api/v1/admin/high_schools/#{school.id}/course_assignments",
            headers: headers.merge('Cookie' => cookie)
      end

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it 'course_assignments キーに割当済みコースが含まれる' do
        subject
        ids = response.parsed_body['course_assignments'].pluck('id')
        expect(ids).to eq([assignment.id])
      end

      it '対象高校の割当のみ返される' do
        other_school = create(:high_school)
        create(:course_assignment, high_school: other_school, course: create(:course))
        subject
        ids = response.parsed_body['course_assignments'].pluck('id')
        expect(ids).to eq([assignment.id])
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        get "/api/v1/admin/high_schools/#{school.id}/course_assignments", headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context '異常系 - 存在しない high_school_id' do
      it '404が返される' do
        get '/api/v1/admin/high_schools/0/course_assignments',
            headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/admin/high_schools/:high_school_id/course_assignments' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let!(:school)     { create(:high_school) }
    let!(:course)     { create(:course) }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    let(:valid_params) { { course_id: course.id }.to_json }

    context '正常系' do
      subject do
        post "/api/v1/admin/high_schools/#{school.id}/course_assignments",
             params: valid_params,
             headers: headers.merge('Cookie' => cookie)
      end

      it 'ステータス201が返される' do
        subject
        expect(response).to have_http_status(:created)
      end

      it '割当が作成される' do
        expect { subject }.to change(CourseAssignment, :count).by(1)
      end
    end

    context '異常系 - 重複割当' do
      before { create(:course_assignment, high_school: school, course: course) }

      it '422が返される' do
        post "/api/v1/admin/high_schools/#{school.id}/course_assignments",
             params: valid_params,
             headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        post "/api/v1/admin/high_schools/#{school.id}/course_assignments",
             params: valid_params,
             headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /api/v1/admin/high_schools/:high_school_id/course_assignments/:course_id' do
    let!(:admin_user) { create(:user, :admin, high_school: nil) }
    let!(:school)     { create(:high_school) }
    let!(:course)     { create(:course) }
    let!(:assignment) { create(:course_assignment, high_school: school, course: course) }
    let(:cookie)      { login_and_get_cookie(admin_user) }

    context '正常系' do
      subject do
        delete "/api/v1/admin/high_schools/#{school.id}/course_assignments/#{course.id}",
               headers: headers.merge('Cookie' => cookie)
      end

      it 'ステータス204が返される' do
        subject
        expect(response).to have_http_status(:no_content)
      end

      it '割当が削除される' do
        expect { subject }.to change(CourseAssignment, :count).by(-1)
      end
    end

    context '異常系 - 割当が存在しない' do
      it '404が返される' do
        delete "/api/v1/admin/high_schools/#{school.id}/course_assignments/0",
               headers: headers.merge('Cookie' => cookie)
        expect(response).to have_http_status(:not_found)
      end
    end

    context '異常系 - 未認証アクセス' do
      it '401が返される' do
        delete "/api/v1/admin/high_schools/#{school.id}/course_assignments/#{course.id}",
               headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

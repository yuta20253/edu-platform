# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Units', type: :request do
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

  describe 'GET /api/v1/admin/courses/:course_id/units/:id' do
    context '正常系' do
      subject do
        get "/api/v1/admin/courses/#{course.id}/units/#{unit.id}",
            headers: headers.merge('Cookie' => cookie)
      end

      let!(:admin_user) { create(:user, :admin, high_school: nil) }
      let!(:course)     { create(:course) }
      let!(:unit)       { create(:unit, course: course, unit_name: '単元A') }

      let(:cookie) { login_and_get_cookie(admin_user) }

      it 'ステータス200が返される' do
        subject
        expect(response).to have_http_status(:ok)
      end

      it '基本フィールドが含まれる' do
        subject
        expect(response.parsed_body.keys).to include(
          'id', 'course_id', 'unit_name', 'questions', 'recent_import_histories'
        )
      end

      it 'id / course_id / unit_name が正しい' do
        subject
        body = response.parsed_body
        expect(body['id']).to eq(unit.id)
        expect(body['course_id']).to eq(course.id)
        expect(body['unit_name']).to eq('単元A')
      end
    end
  end
end

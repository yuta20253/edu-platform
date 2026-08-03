# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teacher::Students', type: :request do
  let(:headers) do
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end
  let!(:prefecture) { create(:prefecture) }
  let!(:high_school) { create(:high_school, prefecture: prefecture) }
  let!(:teacher) do
    create(:user, :teacher, high_school: high_school)
  end
  let!(:teacher_permission) do
    create(
      :teacher_permission,
      user: teacher,
      grade_scope: :all_grades
    )
  end
  let!(:cookie) { login_and_get_cookie(teacher) }

  def login_and_get_cookie(user)
    post '/api/v1/user/login',
         params: { email: user.email, password: 'password' }.to_json,
         headers: headers

    response.headers['Set-Cookie']&.split(';')&.first
  end

  describe 'GET /api/v1/teacher/students' do
    subject do
      get '/api/v1/teacher/students',
          headers: headers.merge('Cookie' => cookie)
    end

    before do
      create_list(:user, 15, :student, high_school: high_school)
    end

    it '200が返る' do
      subject

      expect(response).to have_http_status(:ok)
    end

    it 'studentsが返る' do
      subject

      expect(response.parsed_body).to have_key('students')
    end

    it 'metaが返る' do
      subject

      expect(response.parsed_body).to have_key('meta')
    end

    it 'デフォルトの件数が10件' do
      subject

      expect(response.parsed_body['meta']['per_page']).to eq(10)
      expect(response.parsed_body['students'].size).to eq(10)
    end

    it 'per_pageを指定できる' do
      get '/api/v1/teacher/students',
          params: { per_page: 5 },
          headers: headers.merge('Cookie' => cookie)

      expect(response.parsed_body['meta']['per_page']).to eq(5)
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Users', type: :request do
  describe 'GET /api/v1/me' do
    let(:headers) do
      {
        'Content-Type' => 'application/json',
        'Accept' => 'application/json'
      }
    end
    let!(:prefecture) { create(:prefecture) }
    let!(:high_school) { create(:high_school, prefecture: prefecture) }
    let!(:teacher) { create(:user, :teacher, high_school: high_school) }
    let!(:teacher_permission) do
      create(:teacher_permission, user: teacher, grade_scope: :own_grade)
    end
    let!(:cookie) { login_and_get_cookie(teacher) }

    def login_and_get_cookie(user)
      post '/api/v1/user/login',
           params: { email: user.email, password: 'password' }.to_json,
           headers: headers

      response.headers['Set-Cookie']&.split(';')&.first
    end

    subject do
      get '/api/v1/me', headers: headers.merge('Cookie' => cookie)
    end

    it '教員のteacher_permission(grade_scope)を含めて返すこと' do
      subject

      expect(response.parsed_body.dig('user', 'teacher_permission', 'grade_scope')).to eq('own_grade')
    end
  end
end
